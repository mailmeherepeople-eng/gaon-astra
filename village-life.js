/* Neighbourhood service, visible carrying, and earned Panchayat responsibility. */
(() => {
  "use strict";
  const key = "gaon-astra-village-v2",
    A = WorldArt,
    T = THREE;
  let state = { done: [], carry: null, litter: 0, loads: 0, selected: 0 },
    action = null,
    saveClock = 0;
  const homes = S.buildings.filter((b) =>
    ["home", "homeM", "homeS", "house"].includes(b.id),
  );
  S.villagers.forEach((v, i) => {
    const h = homes[i % homes.length];
    v.x = h.x + (i % 2 ? 42 : -42);
    v.y = h.y + 60 + (i % 3) * 12;
    v.tx = v.x;
    v.ty = v.y;
    v.wait = 3 + i * 0.8;
  });
  const jobs = [
    {
      id: "water",
      name: "Water for Naresh",
      by: "Naresh · milkman",
      hint: "Fill a bucket at the hand pump. Bring it to Naresh’s front door.",
      note: 14,
    },
    {
      id: "litter",
      name: "A clean lane",
      by: "Meera · neighbour",
      hint: "Pick up litter in the lane, then put it in the collection bin.",
      note: 19,
    },
    {
      id: "feed",
      name: "Breakfast for the cows",
      by: "Kamla Devi · Sarpanch",
      hint: "Collect fresh fodder and carry it to a cow.",
      note: 22,
    },
    {
      id: "truck",
      name: "Get the harvest to market",
      by: "Hari Singh · shopkeeper",
      hint: "Carry three sacks from the grain stack to the truck.",
      note: 22,
    },
    {
      id: "garden",
      name: "Help the saplings grow",
      by: "Prakash · teacher",
      hint: "Fill another bucket and water the community garden.",
      note: 3,
    },
  ];
  const complete = (id) => state.done.includes(id);
  // Thanks are spoken where the player stands, not wherever the speaker's actor wandered.
  const playerAnchor = () => ({
    x: U(S.player.x),
    y: groundY(U(S.player.x), U(S.player.y)) + 2.1,
    z: U(S.player.y),
  });
  let started = false;
  function save() {
    if (!started || S.over || window.GameRecovery?.failed)
      return {
        ok: false,
        message: "Village not saved while this session is inactive.",
      };
    try {
      const fields = VillageStore.fields;
      const sim = {};
      fields.forEach((k) => (sim[k] = S[k]));
      sim.player = { ...S.player, moving: false, jy: 0, vy: 0 };
      return VillageStore.write({ v: 2, state, sim });
    } catch (e) {
      return {
        ok: false,
        message: "Could not save. Export a backup from Settings.",
      };
    }
  }
  let saved = VillageStore.read();
  function restart() {
    try {
      VillageStore.clear();
      started = false;
      location.reload();
    } catch {
      screen(
        '<h2>Could not reset this browser save.</h2><p role="alert">Browser storage is unavailable. Your journal has not been changed. Enable site storage, then try again.</p><button id="retryReset">Try again</button>',
      );
      document.getElementById("retryReset").onclick = restart;
    }
  }
  function restore() {
    if (!saved) return;
    state = saved.state;
    for (const field of [...VillageStore.fields, "player"])
      if (Object.hasOwn(saved.sim, field)) S[field] = saved.sim[field];
    S.villagers = [];
    spawnVillagers();
    S.scene = "village";
    S.room = null;
    S.keys = {};
    S.paused = true;
    S.problems.forEach((p) => {
      if (p.target)
        p.target =
          S.buildings.find((b) => b.x === p.target.x && b.y === p.target.y) ||
          null;
    });
    HOME =
      S.buildings.find((b) => b.id === S.homeId) ||
      S.buildings.find((b) => b.id === "home");
    S.dayLen = 480;
    S.nightLen = 150;
    visuals();
  }
  function done(id, message) {
    if (complete(id)) return;
    state.done.push(id);
    state.carry = null;
    S.approval = 20 + state.done.length * 16;
    S.happy = Math.min(85, 55 + state.done.length * 5);
    if (!book.discovered.includes(id)) {
      book.discovered.push(id);
      saveBook();
    }
    const speakers = {
      water: "Naresh",
      garden: "Prakash",
      truck: "Hari Singh",
      litter: "Meera",
      feed: "Kamla Devi",
    };
    const name = speakers[id],
      who = S.villagers.find(
        (v) => v.n === name || v.n.startsWith(name + " "),
      ) || { n: name };
    const line = message.match(/“([^”]+)”/)?.[1];
    log("<b>Favour completed.</b> " + jobs.find((j) => j.id === id).name + ".");
    if (line) speak(who, line, playerAnchor(), true);
    Gaon.audio.play("celebrate");
    state.selected = jobs.findIndex((j) => !complete(j.id));
    if (state.selected < 0) state.selected = 0;
    visuals();
    save();
    if (state.done.length === 5)
      log(
        "<b>Your neighbours have nominated you.</b> Visit the Panchayat Bhavan to take part in the village election.",
      );
  }
  function notice(title, body) {
    screen(
      `<span class="eyebrow">LIFE IN LAKSHMANPUR</span><h2>${title}</h2><p>${body}</p><button id="lifeBack">Back to the village</button>`,
      true,
    );
    document.getElementById("lifeBack").onclick = closeScreen;
  }
  function locked() {
    notice(
      "A villager first",
      "Public money and the village plan are responsibilities of the elected Panchayat. Help your neighbours, earn their trust, then stand in the village election. Your own pocket is separate from the public treasury.",
    );
  }
  const supporters = [
    ["water", "Naresh", "the water you carried"],
    ["litter", "Meera Devi", "the lane you cleared"],
    ["feed", "Kamla Devi", "the cows you fed"],
    ["truck", "Hari Singh", "the harvest you loaded"],
    ["garden", "Prakash", "the saplings you watered"],
  ];
  function election() {
    if (S.rank >= 1) {
      openPlan();
      return;
    }
    if (state.done.length < 5) {
      locked();
      return;
    }
    const backing = supporters.filter(([id]) => complete(id));
    const votes = 2 + backing.length * 2;
    const rival = 15 - votes;
    screen(
      `<span class="eyebrow">THE VILLAGE ELECTION</span><h2>Your neighbours know your work.</h2><p>In this story, the next scheduled election has arrived. The fifteen adult voters of the ward choose their Panchayat member by secret ballot; each voter has one vote. Devi Lal, who has sat on the Panchayat before, also stands.</p><ul class="ballot">${backing.map(([, n, why]) => `<li><b>${n}</b> and one of their household remember ${why}.</li>`).join("")}<li><b>Two neighbours</b> like what they have heard of you.</li><li><b>${rival} voters</b> trust Devi Lal's experience.</li></ul><p class="village-example">Helping people earned their trust. It did not automatically give you a seat: the voters decide, and the count is read out loud.</p><button id="voteResult">Count the ballots</button><button class="ghost" id="voteLater">Come back later</button>`,
      true,
    );
    document.getElementById("voteLater").onclick = closeScreen;
    document.getElementById("voteResult").onclick = () => {
      S.rank = 1;
      S.approval = Math.round((votes / 15) * 100);
      S.dayLen = 480;
      S.nightLen = 150;
      S.t = 0;
      S.phase = "day";
      save();
      screen(
        `<span class="eyebrow">ELECTED · PANCHAYAT MEMBER</span><h2>${votes} of 15 votes.</h2><div class="stats"><span>You</span><span>${votes}</span><span>Devi Lal</span><span>${rival}</span></div><p>The fictional ward has chosen you. You can now use the map table and the public works budget. Approval starts at ${S.approval}% and moves each dawn with happiness, finished works and favours; the Sabha votes again every third morning and expects 55%.</p><p>You are a Panchayat member. The Sarpanch and the rest of the Panchayat still have their own responsibilities.</p><button id="memberGo">Take up your responsibilities</button>`,
        true,
      );
      document.getElementById("memberGo").onclick = () => {
        closeScreen();
        log(
          "<b>Elected Panchayat member.</b> Village planning is now available at the Bhavan.",
        );
      };
    };
  }

  const baseDawn = dawn,
    baseDusk = dusk;
  dawn = function () {
    if (S.rank >= 1) {
      baseDawn();
      assignDaily();
      return;
    }
    S.asleep = false;
    document.getElementById("sleep").classList.add("hidden");
    resetTouch();
    S.keys = {};
    S.sabhaDone = true;
    S.problems = [];
    S.awake = 999;
    log(
      "<b>A fresh morning.</b> Your neighbours are out and about. Unfinished jobs will wait for you.",
    );
  };
  dusk = function () {
    if (S.rank >= 1) {
      baseDusk();
      return;
    }
    S.sabhaDone = true;
    S.problems = [];
    S.awake = 999;
    log(
      "<b>Lanterns are glowing.</b> Take your time. You can rest at home or finish helping a neighbour.",
    );
  };
  S.approval = 20;
  S.dayLen = 480;
  S.nightLen = 150;
  S.mandateLost = 0;
  S.finishedAtDusk = 0;
  const waypoint = new T.Mesh(
    new T.TorusGeometry(0.48, 0.045, 10, 40),
    A.material(0xe0b75f, { emissive: 0x44321a }),
  );
  waypoint.rotation.x = -Math.PI / 2;
  scene.add(waypoint);
  const objects = new T.Group();
  objects.name = "Neighbour jobs";
  scene.add(objects);
  function at(x, z) {
    const g = new T.Group();
    g.position.set(x, groundY(x, z), z);
    objects.add(g);
    return g;
  }
  function sack(g, x = 0, y = 0.4, z = 0) {
    A.oval(g, A.material(0xb8a077), x, y, z, 0.26, 0.4, 0.23);
    A.tube(
      g,
      [
        [x - 0.13, y + 0.31, z],
        [x, y + 0.38, z],
        [x + 0.13, y + 0.31, z],
      ],
      0.017,
      A.P.wood,
    );
  }
  const fodder = at(123, 103);
  for (let i = 0; i < 12; i++)
    A.rod(
      fodder,
      [-0.35 + i * 0.06, 0.08, -0.2],
      [0.2 + i * 0.04, 0.28, 0.2],
      0.045,
      0.022,
      A.material(0x829852),
    );
  const fs = villageSign("चारा | FODDER", 1.6);
  fs.position.set(-1, 0, 0);
  fodder.add(fs);
  const grain = at(135, 98);
  for (let i = 0; i < 5; i++)
    sack(grain, (i % 3) * 0.5, Math.floor(i / 3) * 0.5 + 0.35, 0);
  const truck = at(139, 94);
  truck.name = "Harvest truck";
  SOLIDS.push({ x: 1390, z: 940, r: 16 });
  const teal = A.material(0x527e77),
    rubber = A.material(0x353732);
  A.boxAt(truck, A.P.iron, 0, 0.66, 0, 2.2, 0.22, 4.8);
  A.boxAt(truck, teal, 0, 1.42, -1.65, 2.15, 1.6, 1.55);
  A.boxAt(
    truck,
    A.material(0x688887, { roughness: 0.18 }),
    0,
    1.74,
    -2.44,
    1.8,
    0.62,
    0.02,
  );
  A.boxAt(truck, A.P.wood, 0, 0.87, 0.65, 2.15, 0.17, 3);
  for (const x of [-1.08, 1.08]) {
    A.boxAt(truck, teal, x, 1.21, 0.65, 0.09, 0.64, 3.1);
    for (const z of [-1.6, 1.5]) {
      const wheel = new T.Mesh(
        new T.CylinderGeometry(0.44, 0.44, 0.23, 24),
        rubber,
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.47, z);
      truck.add(wheel);
    }
  }
  for (const x of [-0.77, 0.77])
    A.boxAt(truck, A.material(0xf6e3a3), x, 1.02, -2.45, 0.3, 0.2, 0.03);
  const loaded = new T.Group();
  truck.add(loaded);
  for (let i = 0; i < 3; i++) sack(loaded, (i - 1) * 0.56, 1.29, 0.7);
  const bin = at(137, 104.5);
  A.boxAt(bin, A.material(0x537d74), 0, 0.48, 0, 0.7, 0.95, 0.65);
  A.boxAt(bin, A.P.iron, 0, 0.96, 0, 0.78, 0.06, 0.72);
  const bs = villageSign("सूखा कचरा | DRY WASTE", 1.8);
  bs.position.set(1, 0, 0);
  bin.add(bs);
  const extraLitter = [];
  for (const [x, z] of [
    [141.5, 101.8],
    [140.4, 103.5],
  ]) {
    const g = at(x, z);
    for (let i = 0; i < 4; i++) {
      const paper = A.boxAt(
        g,
        i % 2 ? A.P.lime : A.P.wood,
        Math.sin(i) * 0.35,
        0.04,
        Math.cos(i) * 0.3,
        0.22,
        0.035,
        0.16,
      );
      paper.rotation.y = i;
    }
    extraLitter.push(g);
  }
  const carried = new T.Group();
  carried.position.set(0.36, 0.35, 0.09);
  playerMesh.add(carried);
  const carryModels = new Map();
  function visuals() {
    const item = state.carry;
    carried.children.forEach((m) => (m.visible = false));
    if (carryModels.has(item)) {
      carryModels.get(item).forEach((m) => (m.visible = true));
    } else {
      const before = new Set(carried.children);
      if (state.carry === "water") {
        A.mesh(
          new T.CylinderGeometry(0.2, 0.15, 0.34, 24, 1, true),
          A.P.steel,
          carried,
          [0, 0.16, 0],
        );
        A.tube(
          carried,
          [
            [-0.2, 0.31, 0],
            [-0.13, 0.56, 0],
            [0.13, 0.56, 0],
            [0.2, 0.31, 0],
          ],
          0.009,
          A.P.iron,
        );
        const water = A.mesh(
          new T.CircleGeometry(0.185, 24),
          A.P.water,
          carried,
          [0, 0.29, 0],
        );
        water.rotation.x = -Math.PI / 2;
      } else if (state.carry === "grain") sack(carried, 0, 0.24, 0);
      else if (state.carry === "fodder") {
        for (let i = 0; i < 8; i++)
          A.rod(
            carried,
            [-0.2 + i * 0.04, 0, -0.2],
            [0.1 + i * 0.03, 0.25, 0.2],
            0.035,
            0.015,
            A.P.leaf,
          );
      } else if (state.carry === "litter")
        A.oval(carried, A.P.lime, 0, 0.15, 0, 0.2, 0.25, 0.17);
      if (item)
        carryModels.set(
          item,
          carried.children.filter((m) => !before.has(m)),
        );
    }
    [litter, ...extraLitter].forEach(
      (g, i) => (g.visible = !complete("litter") && i >= state.litter),
    );
    loaded.children.forEach((g, i) => (g.visible = i < state.loads * 2));
    garden.userData.watered = complete("garden");
  }
  function take(item) {
    if (state.carry) {
      log("<b>Your hands are full.</b> Finish this delivery first.");
      return;
    }
    state.carry = item;
    visuals();
    save();
  }
  function start(label, seconds, fn, onCancel) {
    if (action) return;
    action = {
      label,
      left: seconds,
      total: seconds,
      x: S.player.x,
      y: S.player.y,
      fn,
      onCancel,
    };
    closePrompt();
  }
  function interact(p, edge) {
    let o = null;
    const near = (x, y, r = 25) => Math.hypot(p.x - x, p.y - y) < r;
    if (action) {
      showPrompt(
        "working" + Math.ceil(action.left * 5),
        `<h4>${action.label}</h4><p>Stay nearby · ${Math.max(1, Math.ceil(action.left))} s</p><progress value="${action.total - action.left}" max="${action.total}"></progress>`,
      );
      return true;
    }
    const d = state.daily;
    const dailyOn = (k) => !!d && !d.done && d.id === k && S.rank >= 1;
    if (dailyOn("water") && state.carry === "water" && near(d.x, d.y, 28))
      o = {
        name: d.who + "’s home",
        text: d.who + " needs water for the day. Set the bucket by the door.",
        button: "Deliver the bucket",
        fn: () =>
          dailyDone(
            d.who,
            "Thank you. A full bucket first thing makes the whole day easier.",
          ),
      };
    if (o) {
    } else if (near(1140, 760))
      o = {
        name: "The hand pump",
        text: state.carry
          ? "Your hands are full. Deliver what you are carrying."
          : "A few steady strokes will fill your bucket.",
        button: state.carry ? null : "Fill bucket",
        fn: () => {
          if (!state.carry)
            start("Filling the bucket", 2.2, () => take("water"));
        },
      };
    else if (near(1040, 895) && state.carry === "water" && !complete("water"))
      o = {
        name: "Naresh’s home",
        text: "Naresh needs clean water for washing the milk containers.",
        button: "Deliver the bucket",
        fn: () =>
          done(
            "water",
            "<b>Naresh smiles:</b> “Clean water makes all this work possible. Thank you!”",
          ),
      };
    else if (near(1090, 815) && state.carry === "water")
      o = {
        name: "Community garden",
        text: "Pour slowly at the roots.",
        button: "Water the saplings",
        fn: () =>
          start("Watering the saplings", 1.6, () => {
            if (!complete("garden"))
              done(
                "garden",
                "<b>Prakash:</b> “Look at those leaves! We will care for these together.”",
              );
            else {
              state.carry = null;
              visuals();
              save();
            }
          }),
      };
    else if (near(1230, 1030) && !state.carry)
      o = {
        name: "Kamla’s fodder bundle",
        text: "Fresh fodder for the village cows.",
        button: "Pick up fodder",
        fn: () => take("fodder"),
      };
    else if (
      near(1350, 980) &&
      !state.carry &&
      (!complete("truck") || dailyOn("truck"))
    )
      o = {
        name: "Hari’s grain sacks",
        text: complete("truck")
          ? "Hari needs one more sack on the truck today."
          : `${state.loads}/3 sacks loaded. Carry one to the back of the truck.`,
        button: "Lift a sack",
        fn: () => start("Lifting a grain sack", 0.7, () => take("grain")),
      };
    else if (near(1390, 967) && state.carry === "grain")
      o = {
        name: "The market truck",
        text: "Set the sack safely on the loading bed.",
        button: "Load the truck",
        fn: () =>
          start("Loading the harvest", 1, () => {
            if (complete("truck") && dailyOn("truck")) {
              dailyDone(
                "Hari Singh",
                "One more sack aboard. The market will have enough tomorrow.",
              );
              return;
            }
            // A repeat sack must never alter the completed tutorial counter.
            if (!complete("truck")) state.loads = Math.min(3, state.loads + 1);
            state.carry = null;
            if (!complete("truck") && state.loads === 3)
              done(
                "truck",
                "<b>Hari Singh:</b> “All aboard! Farmers and transport workers both get food to the market.”",
              );
            visuals();
            save();
          }),
      };
    else if (near(1370, 1045) && state.carry === "litter")
      o = {
        name: "Dry-waste collection",
        text:
          state.litter < 3
            ? "Pick up all three patches of dry litter before finishing this job."
            : "Paper and packaging belong in this dry-waste container.",
        button: state.litter < 3 ? "Keep collecting" : "Sort the litter",
        fn: () => {
          if (state.litter === 3)
            done(
              "litter",
              "<b>Meera:</b> “A clear lane again! We help keep it clean; the Panchayat arranges collection.”",
            );
        },
      };
    else if (
      !complete("litter") &&
      (!state.carry || state.carry === "litter")
    ) {
      const points = [
        [1395, 1010],
        [1415, 1018],
        [1404, 1035],
      ];
      const i = state.litter;
      if (i < 3 && near(...points[i]))
        o = {
          name: "Litter in the lane",
          text: `${state.litter}/3 patches collected. Gather dry paper and packaging.`,
          button: "Pick up litter",
          fn: () =>
            start("Clearing the lane", 0.8, () => {
              state.litter++;
              state.carry = "litter";
              visuals();
              save();
            }),
        };
    }
    if (!o) {
      const animal = [...cows, ...chickens].find((a) =>
        near(a.position.x * 10, a.position.z * 10, 23),
      );
      if (animal)
        o = {
          name: animal.userData.chicken ? "A curious hen" : "Kamla’s cow",
          text:
            state.carry === "fodder"
              ? "A little breakfast and a new friend."
              : "Say hello. Animals prefer a calm approach.",
          button:
            state.carry === "fodder" && !animal.userData.chicken
              ? "Feed the cow"
              : "Greet gently",
          fn: () => {
            animal.userData.friendlyUntil = astraTime + 7;
            if (state.carry === "fodder" && !animal.userData.chicken) {
              if (!complete("feed"))
                done(
                  "feed",
                  "<b>Kamla Devi:</b> “She knows you now! Caring for animals is part of our daily work.”",
                );
              else if (dailyOn("feed"))
                dailyDone(
                  "Kamla Devi",
                  "She was hungry. Thank you for remembering the cows.",
                );
              else {
                state.carry = null;
                visuals();
                save();
              }
            } else
              log(
                "<b>A little company.</b> Your new friend follows for a moment.",
              );
          },
        };
    }
    if (!o) return false;
    showPrompt(
      "life" + o.name + o.button + state.litter + state.loads,
      `<h4>${esc(o.name)}</h4><p>${esc(o.text)}</p>${o.button ? `<button id="hsb">${o.button}</button>` : ""}`,
    );
    const b = document.getElementById("hsb");
    if (b) b.onclick = o.fn;
    if (edge) o.fn();
    return true;
  }
  // Small daily favours keep neighbours asking once the first five are done.
  function assignDaily() {
    if (S.rank < 1 || state.done.length < 5) return;
    // Keep an unfinished delivery across dawn, including its recipient and reward.
    if (state.daily && !state.daily.done) return;
    const kinds = ["water", "feed", "truck"];
    const id = kinds[(S.day + 1) % kinds.length];
    const houses = S.buildings.filter(
      (b) =>
        b !== HOME &&
        ["house", "homeM", "homeS"].includes(b.id) &&
        !b.under &&
        residentOf(b),
    );
    const h = houses.length ? houses[S.day % houses.length] : null;
    const who =
      id === "water"
        ? h
          ? residentOf(h).n
          : "Naresh"
        : id === "feed"
          ? "Kamla Devi"
          : "Hari Singh";
    state.daily = {
      day: S.day,
      id,
      done: false,
      who,
      x: id === "water" && h ? h.x : 1390,
      y: id === "water" && h ? h.y + DOOR_OFF[h.id] + 4 : 967,
    };
    log(
      `<b>${esc(who)} asks a favour.</b> ${id === "water" ? "A bucket of water at the door." : id === "feed" ? "A hand with the cows' fodder." : "One more sack on the truck."} Small favours keep the village's trust.`,
    );
  }
  function dailyDone(name, quote) {
    state.daily.done = true;
    state.carry = null;
    S.approval = Math.min(100, S.approval + 3);
    S.happy = Math.min(100, S.happy + 1);
    const who = S.villagers.find((v) => v.n === name) || { n: name };
    log("<b>Favour done.</b> Your neighbours remember. Approval +3.");
    speak(who, quote, playerAnchor(), true);
    Gaon.audio.play("celebrate");
    visuals();
    save();
  }
  function dailyTarget(d) {
    if (d.id === "water")
      return state.carry === "water"
        ? {
            x: d.x,
            y: d.y,
            name: `Deliver water to ${d.who}`,
            hint: "Set the bucket by the door.",
          }
        : {
            x: 1140,
            y: 760,
            name: `Fill a bucket for ${d.who}`,
            hint: "The hand pump is by the chowk lane.",
          };
    if (d.id === "feed")
      return state.carry === "fodder"
        ? {
            x: cows[0].position.x * 10,
            y: cows[0].position.z * 10,
            name: "Feed a cow for Kamla",
            hint: "Any cow will do.",
          }
        : {
            x: 1230,
            y: 1030,
            name: "Collect fodder for Kamla",
            hint: "The bundle is by the fodder sign.",
          };
    return state.carry === "grain"
      ? {
          x: 1390,
          y: 967,
          name: "Load the sack for Hari",
          hint: "Set it on the truck bed.",
        }
      : {
          x: 1350,
          y: 980,
          name: "Lift a sack for Hari",
          hint: "The grain stack is by the truck.",
        };
  }
  // The elected day has a shape: budget, plan, watch, Sabha, home.
  function electedTarget() {
    const door = { x: PANCH.x, y: PANCH.y + DOOR_OFF.panchayat };
    const home = { x: HOME.x, y: HOME.y + DOOR_OFF[HOME.id] };
    if (S.asleep)
      return {
        ...home,
        name: "Sleeping",
        hint: "The night passes at triple speed.",
      };
    if (S.phase === "night") {
      if (!S.sabhaDone)
        return {
          ...door,
          name: "Take your seat at the night Sabha",
          hint: "The village is waiting inside the Bhavan.",
        };
      const problem = S.problems.find((q) => !q.rep);
      if (problem && S.awake > 15)
        return {
          x: problem.x,
          y: problem.y,
          name:
            "Report the trouble by the " +
            ({
              thief: "fields",
              flood: "river",
              plastic: "chowk",
              sick: "houses",
              dispute: "field edge",
            }[problem.k] || "lane"),
          hint: "Walk close with the lantern; the Panchayat fixes what you report at dawn.",
        };
      return {
        ...home,
        name:
          S.rank >= 2
            ? "Walk with the lantern, or sleep at home"
            : "Home before the lamps go out",
        hint: "Your bed is inside. Sleeping runs the night at triple speed.",
      };
    }
    if (!S.collected && S.mandateLost !== S.day)
      return {
        ...door,
        name: "Collect the budget at the Panchayat",
        hint: "The night's income waits in the treasury. The map table counts it.",
      };
    const d = state.daily;
    if (d && !d.done) return dailyTarget(d);
    const site = S.buildings.find((b) => b.under);
    if (site)
      return {
        x: site.x,
        y: site.y + 40,
        name: `Watch the ${B[site.id].n.toLowerCase()} rise`,
        hint: "Construction finishes at dusk. Talk to neighbours meanwhile.",
      };
    if (S.collected && S.coins >= 10 && S.mandateLost !== S.day)
      return {
        ...door,
        name: "Plan a project at the map table",
        hint: "Public works raise happiness and approval.",
      };
    return {
      ...home,
      name: "A free afternoon",
      hint: "Talk to neighbours, or rest at home until dusk.",
    };
  }
  function target() {
    if (S.rank >= 1 && (S.phase === "night" || S.asleep))
      return electedTarget();
    const storyTarget = window.VillageStory?.target();
    if (storyTarget) return storyTarget;
    if (S.rank >= 1) return electedTarget();
    if (state.done.length === 5)
      return {
        x: 1250,
        y: 724,
        name: "Attend the village election",
        hint: "The ward votes at the map table inside the Panchayat Bhavan.",
      };
    const j = jobs[state.selected] || jobs[0];
    const points = {
      water: state.carry === "water" ? [1040, 895] : [1140, 760],
      garden: state.carry === "water" ? [1090, 815] : [1140, 760],
      litter:
        state.litter === 3
          ? [1370, 1045]
          : [
              [1395, 1010],
              [1415, 1018],
              [1404, 1035],
            ][state.litter],
      feed:
        state.carry === "fodder"
          ? [cows[0].position.x * 10, cows[0].position.z * 10]
          : [1230, 1030],
      truck: state.carry === "grain" ? [1390, 967] : [1350, 980],
    };
    let id = j.id;
    if (state.carry === "grain") id = "truck";
    if (state.carry === "fodder") id = "feed";
    if (state.carry === "litter") id = "litter";
    if (state.carry === "water") id = !complete("water") ? "water" : "garden";
    const xy = points[id] || [1250, 724];
    return {
      x: xy[0],
      y: xy[1],
      name: {
        water:
          state.carry === "water"
            ? "Deliver water to Naresh"
            : "Fill a bucket at the pump",
        garden:
          state.carry === "water"
            ? "Water the garden"
            : "Fill water for the garden",
        feed: state.carry === "fodder" ? "Feed a cow" : "Collect fresh fodder",
        truck:
          state.carry === "grain"
            ? "Load the market truck"
            : "Lift a grain sack",
        litter:
          state.litter === 3 ? "Use the collection bin" : "Pick up lane litter",
      }[id],
    };
  }
  function storyCard() {
    const st = window.VillageStory?.status();
    if (!st) return "";
    return `<h3 class="jobs-heading">A village story</h3><div class="lesson-grid"><button id="storyButton" data-story><small>${st.label}</small>Meera’s market morning<p>${st.hint}</p></button></div>`;
  }
  function dailyCard() {
    const d = state.daily;
    if (!d || S.rank < 1) return "";
    const t = dailyTarget(d);
    return `<h3 class="jobs-heading">${d.day < S.day && !d.done ? "An unfinished favour" : "Today's favour"}</h3><div class="lesson-grid"><button data-daily><small>${d.done ? "✓ DONE TODAY" : esc(d.who)}</small>${esc(t.name)}<p>${d.done ? "Another neighbour will ask tomorrow." : esc(t.hint)}</p></button></div>`;
  }
  function openJobs() {
    screen(
      `<div class="journal-head"><div><span class="eyebrow">YOUR NEIGHBOURS NEED A HAND</span><h2>A good day in the village</h2></div><button id="jobsClose" class="ghost">Back ×</button></div><p>Explore, help and make friends. ${S.rank === 0 ? "Complete five favours to earn a nomination for the next village election." : "Your elected responsibilities are now available at the Bhavan."}</p><div class="lesson-grid">${jobs.map((j, i) => `<button data-job="${i}"><small>${complete(j.id) ? "✓ THANK YOU" : j.by}</small>${j.name}<p>${j.hint}</p></button>`).join("")}</div>${dailyCard()}${storyCard()}<p class="source">${state.done.length}/5 favours · Carrying: ${state.carry || "nothing"} · The chapter journal is always optional.</p>`,
      true,
    );
    document.getElementById("jobsClose").onclick = closeScreen;
    const story = document.getElementById("storyButton");
    if (story)
      story.onclick = () => {
        closeScreen();
        window.VillageStory?.open();
      };
    const daily = ov.querySelector("[data-daily]");
    if (daily) daily.onclick = closeScreen;
    ov.querySelectorAll("[data-job]").forEach(
      (b) =>
        (b.onclick = () => {
          state.selected = +b.dataset.job;
          closeScreen();
        }),
    );
  }
  let nextMissionUpdate = 0,
    lastMissionHtml = "",
    lastLifeHud = "";
  function update(dt) {
    window.VillageStory?.update();
    if (action && dt) {
      if (Math.hypot(S.player.x - action.x, S.player.y - action.y) > 9) {
        const cancelled = action;
        action = null;
        pumpUntil = 0;
        if (cancelled.onCancel) cancelled.onCancel();
        else log("Paused the job. Come back when you are ready.");
      } else {
        if (action.label.includes("bucket")) pumpUntil = astraTime + 0.2;
        action.left -= dt;
        if (action.left <= 0) {
          const fn = action.fn;
          action = null;
          fn();
        }
      }
    }
    saveClock += dt;
    if (saveClock > 5) {
      saveClock = 0;
      save();
    }
    waypoint.visible = S.scene === "village" && !S.paused;
    if (waypoint.visible) {
      const t = target();
      waypoint.position.set(
        t.x / 10,
        groundY(t.x / 10, t.y / 10) + 0.08,
        t.y / 10,
      );
      waypoint.scale.setScalar(1 + Math.sin(astraTime * 2) * 0.08);
    }
    if (S.scene === "village" && !S.paused && astraTime >= nextMissionUpdate) {
      nextMissionUpdate = astraTime + 0.1;
      const t = target(),
        dist = Math.round(Math.hypot(S.player.x - t.x, S.player.y - t.y) / 10),
        relative = Math.atan2(t.x - S.player.x, t.y - S.player.y) - cam.yaw;
      const touch = matchMedia("(pointer:coarse)").matches;
      const hint =
        t.hint ||
        (S.rank
          ? "Collect the public budget, choose a project, then return at dusk."
          : touch
            ? "Use nearby · Menu → Neighbour jobs"
            : "E to interact · Neighbour jobs for directions");
      const eyebrow = S.rank
        ? S.phase === "night"
          ? "NIGHT IN LAKSHMANPUR"
          : "A VILLAGE TO CARE FOR"
        : `${state.done.length}/5 NEIGHBOUR FAVOURS`;
      const missionHtml = `<span class="eyebrow">${eyebrow}</span><strong>${esc(t.name)}</strong><small><span style="display:inline-block;transform:rotate(${Math.round((-relative * 180) / Math.PI)}deg)">↓</span> ${dist} m · Carrying ${state.carry || "nothing"}</small><p>${hint}</p>`;
      if (missionHtml !== lastMissionHtml) {
        mission.innerHTML = missionHtml;
        lastMissionHtml = missionHtml;
      }
    }
    if (S.rank === 0) {
      const hud = document.getElementById("hud");
      const lifeHud = `<span class="pill rank"><b>Villager</b><span class="age">Lakshmanpur</span></span><span class="pill"><span class="lbl">neighbour trust</span><b>${20 + state.done.length * 16}%</b></span><span class="pill"><b>${state.done.length}/5</b><span class="lbl">favours</span></span>`;
      if (hud && lifeHud !== lastLifeHud) {
        hud.innerHTML = lifeHud;
        lastLifeHud = lifeHud;
      }
    }
  }
  // Hide overhead beams and the camera-facing boundary, including its window frames.
  const makeRoom = buildRoom;
  buildRoom = function (b) {
    const r = makeRoom(b);
    const textureMaterials = new Map();
    r.scene.traverse((m) => {
      if (
        !m.isMesh ||
        !m.material ||
        Array.isArray(m.material) ||
        m.material.map
      )
        return;
      const old = m.material;
      if (
        m.geometry?.parameters?.height === 0.04 &&
        m.geometry?.parameters?.width === 3
      ) {
        m.visible = false;
        return;
      }
      if (!textureMaterials.has(old)) {
        const base = [RM.wood, RM.wood2, RM.chest].includes(old)
          ? A.P.wood
          : [RM.cloth, RM.cloth2, RM.cloth3].includes(old)
            ? A.P.lime
            : A.P.plaster;
        const n = base.clone();
        n.color.copy(old.color);
        textureMaterials.set(old, n);
      }
      m.material = textureMaterials.get(old);
    });
    const decor = new T.Group();
    r.scene.add(decor);
    const pot = (x, z, s = 1) => {
      const pts = [
        [0.13, 0],
        [0.26, 0.12],
        [0.28, 0.32],
        [0.16, 0.48],
        [0.14, 0.54],
      ].map((p) => new T.Vector2(p[0] * s, p[1] * s));
      A.mesh(new T.LatheGeometry(pts, 24), A.P.brick, decor, [x, 0, z]);
    };
    pot(-r.W / 2 + 1, -r.D / 2 + 1);
    pot(-r.W / 2 + 1.55, -r.D / 2 + 1, 0.7);
    const rug = document.createElement("canvas");
    rug.width = rug.height = 256;
    const rx = rug.getContext("2d");
    rx.fillStyle = "#ad604d";
    rx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 16; i++) {
      rx.fillStyle = i % 2 ? "#d2ad75" : "#724b43";
      rx.fillRect(0, i * 16, 256, 5);
    }
    rx.strokeStyle = "#e2c69b";
    rx.lineWidth = 9;
    rx.strokeRect(14, 14, 228, 228);
    const rm = A.material(0xffffff, { map: new T.CanvasTexture(rug) });
    rm.map.colorSpace = T.SRGBColorSpace;
    const carpet = A.mesh(
      new T.PlaneGeometry(2.8, 1.9),
      rm,
      decor,
      [0, 0.035, 0.3],
    );
    carpet.rotation.x = -Math.PI / 2;
    for (const x of [-1.3, -0.4, 0.5, 1.4])
      A.boxAt(decor, A.P.wood, x, 1.55, -r.D / 2 + 0.2, 0.8, 0.06, 0.42);
    for (let i = 0; i < 6; i++) {
      const book = A.boxAt(
        decor,
        A.material([0x77938a, 0xc89768, 0xa7654d][i % 3]),
        -0.9 + i * 0.25,
        1.76,
        -r.D / 2 + 0.22,
        0.13,
        0.35,
        0.22,
      );
      book.rotation.z = i % 2 ? 0.08 : 0;
    }
    for (const light of r.scene.children) {
      if (light.isDirectionalLight) {
        light.intensity = 0.75 * Math.PI;
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        Object.assign(light.shadow.camera, {
          left: -14,
          right: 14,
          top: 14,
          bottom: -14,
          near: 0.1,
          far: 40,
        });
        light.shadow.camera.updateProjectionMatrix();
        light.shadow.normalBias = 0.03;
      }
      if (light.isHemisphereLight) light.intensity = 0.75 * Math.PI;
    }
    r.scene.background = new T.Color(0xd4c9b4);
    const group = r.scene.children.find((c) => c.isGroup);
    r.cutaway = decor.children.filter(
      (o) => Math.abs(o.position.z) > r.D / 2 - 0.5,
    );
    if (group)
      for (const o of group.children) {
        if (o.position.y > 3.35) {
          o.visible = false;
          continue;
        }
        const p = o.position;
        if (Math.abs(p.x) > r.W / 2 - 0.5 || Math.abs(p.z) > r.D / 2 - 0.5)
          r.cutaway.push(o);
      }
    for (const h of r.hotspots) {
      if (h.key === "chest") {
        const fn = h.act;
        h.act = () => (S.rank < 1 ? locked() : fn());
        const html = h.html;
        h.html = () =>
          S.rank < 1
            ? "<h4>Public treasury</h4><p>The elected Panchayat manages these funds. They are not personal pocket money.</p>"
            : html();
      }
      if (h.key === "table") {
        const fn = h.act;
        h.act = () => (S.rank < 1 ? election() : fn());
      }
    }
    return r;
  };
  GameSystems.beforeRender.push(function updateRoomCutaway() {
    if (S.scene === "interior" && S.room?.cutaway) {
      for (const o of S.room.cutaway) {
        const p = o.position;
        o.visible = !(
          (Math.abs(p.x) > S.room.W / 2 - 0.5 &&
            Math.sign(p.x) === Math.sign(Math.sin(cam.yaw))) ||
          (Math.abs(p.z) > S.room.D / 2 - 0.5 &&
            Math.sign(p.z) === Math.sign(Math.cos(cam.yaw)))
        );
      }
    }
  });
  window.VillageLife = {
    get carry() {
      return state.carry;
    },
    get state() {
      return state;
    },
    jobs,
    interact,
    update,
    save,
    restart,
    begin: start,
    get busy() {
      return !!action;
    },
    get started() {
      return started;
    },
    locked,
    election,
    openJobs,
    target,
  };
  window.astraNearby = () => false;
  document.getElementById("trailsButton").textContent = "Neighbour jobs";
  document.getElementById("trailsButton").onclick = () => {
    if (!S.paused) openJobs();
  };
  const pause = document.createElement("button");
  pause.textContent = "Pause";
  pause.id = "pauseVillage";
  toolsBar.appendChild(pause);
  function pauseMenu() {
    const result = save();
    screen(
      '<span class="eyebrow">TAKE A BREATHER</span><h2>Your village will wait.</h2><p>' +
        esc(result.message) +
        "</p>" +
        moodLine() +
        '<button id="resumeVillage">Keep playing</button><button id="jobsPause" class="ghost">Neighbour jobs</button>',
      true,
    );
    document.getElementById("resumeVillage").onclick = closeScreen;
    document.getElementById("jobsPause").onclick = openJobs;
  }
  pause.onclick = pauseMenu;
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !S.paused) pauseMenu();
  });
  addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) save();
  });
  restore();
  visuals();
  screen(
    `<span class="eyebrow">GAON ASTRA · A VILLAGE THAT KNOWS YOU</span><h1>A small favour.<br>A new beginning.</h1><p>Welcome to Lakshmanpur. You are a villager, with neighbours to meet, animals to care for and a day to make your own.</p><p>Carry water. Clear a lane. Help a harvest reach the market. Earn your neighbours’ trust before standing for the Panchayat.</p><div class="village-example"><b>Make yourself at home</b><p>WASD / arrows to walk · Shift to run · Click, then move the mouse to look · Wheel to zoom · E to use things. On touchscreens, use the movement stick and action button.</p></div><button id="beginVillage">${saved ? "Continue your village" : "Step into Lakshmanpur"}</button>${saved ? '<button id="freshVillage" class="ghost">Start a new village</button>' : ""}<p class="source">The journal keeps the full civics explanations and optional practice. No quiz interrupts a favour.</p>`,
    true,
  );
  document.getElementById("beginVillage").disabled = true;
  document.getElementById("beginVillage").onclick = () => {
    started = true;
    closeScreen();
    if (!saved) {
      S.player.x = 1130;
      S.player.y = 840;
      cam.dist = 9;
      cam.pitch = 0.45;
      cam.yaw = Math.atan2(S.player.x - 1140, S.player.y - 760);
      log("Your first favour: follow the gold marker to the hand pump.");
    }
    Gaon.audio.init();
  };
  const reset = document.getElementById("freshVillage");
  if (reset)
    reset.onclick = () => {
      screen(
        '<h2>Start a new village?</h2><p>This replaces the village saved in this browser. Your chapter journal is kept.</p><button id="confirmFresh">Start fresh</button><button id="cancelFresh" class="ghost">Keep my village</button>',
        true,
      );
      document.getElementById("cancelFresh").onclick = () => location.reload();
      document.getElementById("confirmFresh").onclick = () => {
        restart();
      };
    };
})();
