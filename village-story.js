/* A bounded, saved story: remembered help, a route choice with a real risk, and a next-day project. */
(() => {
  const life = VillageLife;
  const state = () =>
    life.state.story ||
    (life.state.story = {
      stage: "ready",
      route: null,
      project: null,
      day: null,
    });
  const actor = (name) =>
    S.villagers.find((v) => v.n === name) || S.villagers[0];
  // Remembered favours come up once, then now and again, instead of replacing every other line.
  const oldLine = talkLine;
  talkLine = function (who) {
    const memories = {
      Naresh: [
        "water",
        "I remember that first bucket. You made my morning easier.",
      ],
      "Meera Devi": [
        "litter",
        "The lane is clear again. Thank you for looking after our shared space.",
      ],
      Prakash: [
        "garden",
        "Our saplings are growing because you helped. Come and see them tomorrow.",
      ],
      "Hari Singh": [
        "truck",
        "You helped get the harvest aboard. There is more to a market than buying and selling.",
      ],
      "Kamla Devi": [
        "feed",
        "The cows know your footsteps now. Small acts of care matter here.",
      ],
    };
    const memory = memories[who.n];
    if (!memory || !life.state.done.includes(memory[0])) return oldLine(who);
    const told = (life.state.told = life.state.told || {});
    const count = told[who.n] || 0;
    told[who.n] = count + 1;
    return count % 4 === 0 ? memory[1] : oldLine(who);
  };
  const marker = new THREE.Group();
  marker.name = "Neighbour project";
  scene.add(marker);
  const projectMaterials = {
    lane: WorldArt.material(0xc2af89),
    water: WorldArt.P.steel,
  };
  let shownProject = null;
  const basket = new THREE.Group();
  basket.position.set(-0.35, 0.8, -0.22);
  playerMesh.add(basket);
  WorldArt.mesh(
    new THREE.CylinderGeometry(0.25, 0.18, 0.38, 12),
    WorldArt.P.wood,
    basket,
  );
  WorldArt.tube(
    basket,
    [
      [-0.2, 0.18, 0],
      [-0.16, 0.4, 0],
      [0.16, 0.4, 0],
      [0.2, 0.18, 0],
    ],
    0.02,
    WorldArt.P.wood,
  );
  let nextVisit = 0;
  function projectArt() {
    const s = state();
    basket.visible = ["route", "deliver"].includes(s.stage);
    // Neighbours actually use what was built: they cross the lane or fetch water at the stand.
    if (s.project && S.day > s.day && astraTime > nextVisit) {
      nextVisit = astraTime + 60;
      if (s.project === "lane") {
        const meera = actor("Meera Devi"),
          hari = actor("Hari Singh");
        meera.tx = 1335;
        meera.ty = 1012;
        meera.wait = 35;
        if (hari !== meera) {
          hari.tx = 1268;
          hari.ty = 1008;
          hari.wait = 35;
        }
      } else {
        const who = actor("Naresh");
        who.tx = 1130;
        who.ty = 780;
        who.wait = 35;
      }
    }
    if (!s.project || S.day <= s.day || shownProject === s.project) return;
    shownProject = s.project;
    if (s.project === "lane") {
      for (let i = 0; i < 12; i++)
        WorldArt.boxAt(
          marker,
          projectMaterials.lane,
          128 + i * 0.45,
          groundY(128 + i * 0.45, 101) + 0.03,
          101,
          0.42,
          0.06,
          1.8,
        );
    } else {
      WorldArt.boxAt(
        marker,
        WorldArt.P.wood,
        113,
        groundY(113, 78) + 0.45,
        78,
        1.8,
        0.12,
        0.8,
      );
      for (let i = 0; i < 3; i++)
        WorldArt.mesh(
          new THREE.CylinderGeometry(0.2, 0.16, 0.4, 12),
          projectMaterials.water,
          marker,
          [112.5 + i * 0.5, groundY(113, 78) + 0.7, 78],
        );
    }
    log(
      s.project === "lane"
        ? "The shared lane repair is ready. Meera can take her baskets across."
        : "The shared water collection stand is ready. Naresh can collect several containers in one trip.",
    );
  }
  function chooseRoute() {
    if (life.carry) {
      log("Finish your current delivery before taking the market basket.");
      return;
    }
    screen(
      '<h2>Meera’s market morning</h2><p>Carry a small market basket to Hari by one of two routes. The short lane has a broken crossing: you must stop and hold the basket level, and if you walk off while it settles, it tips. The long route has clear footing but costs daylight.</p><button id="routeShort">Short lane · stop and steady the basket</button><button id="routeSafe" class="ghost">Long route · clear footing, slower</button><button id="storyBack" class="ghost">Later</button>',
      true,
    );
    document.getElementById("storyBack").onclick = closeScreen;
    for (const [id, route] of [
      ["routeShort", "short"],
      ["routeSafe", "safe"],
    ])
      document.getElementById(id).onclick = () => {
        Object.assign(state(), { stage: "route", route, spilled: false });
        closeScreen();
        speak(
          actor("Meera Devi"),
          "Please bring the basket to Hari. Take your time; I would rather it arrived safely.",
        );
        life.save();
      };
  }
  function meeting() {
    if (S.rank < 1) {
      life.election();
      return;
    }
    const denied = publicWorksPermission();
    screen(
      `<h2>One shared improvement</h2><p>Meera needs an easier crossing. Naresh needs fewer water trips. Both projects cost 20 public coins, and this story has room for one first. Your public works budget: ${S.coins}.</p>${denied ? `<p role="status">${denied}</p>` : ""}<button id="chooseLane" ${denied || S.coins < 20 ? "disabled" : ""}>Repair the lane · 20 coins</button><button id="chooseWater" class="ghost" ${denied || S.coins < 20 ? "disabled" : ""}>Build a collection stand · 20 coins</button><button id="storyBack" class="ghost">Back to the village</button>`,
      true,
    );
    document.getElementById("storyBack").onclick = closeScreen;
    for (const [id, project] of [
      ["chooseLane", "lane"],
      ["chooseWater", "water"],
    ])
      document.getElementById(id).onclick = () => {
        if (publicWorksPermission() || S.coins < 20 || state().project) return;
        S.coins -= 20;
        Object.assign(state(), { project, day: S.day, stage: "tomorrow" });
        closeScreen();
        speak(
          actor(project === "lane" ? "Meera Devi" : "Naresh"),
          "Thank you for hearing us. Come back tomorrow and see the work we have done together.",
        );
        life.save();
      };
  }
  function open() {
    const s = state();
    if (!life.state.done.includes("water")) {
      speak(
        actor("Meera Devi"),
        "Help Naresh with his water first. I will have a market errand for you afterwards.",
      );
      return;
    }
    if (s.stage === "ready") chooseRoute();
    else if (s.stage === "meeting") meeting();
    else {
      screen(
        `<h2>Meera’s market morning</h2><p>${s.stage === "route" ? (s.route === "short" ? "Follow the marker to the short crossing, stand still while the basket settles, then deliver it to Hari." : "Follow the marker along the clear lane, then deliver the basket to Hari.") : s.stage === "deliver" ? "Take the basket to Hari at the market truck." : s.stage === "tomorrow" ? "The neighbours are working together. Return to the improvement tomorrow." : "Your choice changed this corner of the village. Visit the neighbours and see what they remember."}</p><button id="storyBack">Back to the village</button>`,
        true,
      );
      document.getElementById("storyBack").onclick = closeScreen;
    }
  }
  // What the Neighbour jobs card says about the story right now.
  function status() {
    const s = state();
    if (!life.state.done.includes("water"))
      return {
        label: "AFTER NARESH’S WATER",
        hint: "Help Naresh first; Meera has a market errand afterwards.",
      };
    if (s.stage === "ready")
      return {
        label: "MEERA DEVI · A STORY",
        hint: "Carry her basket to Hari by a short crossing or a clear lane.",
      };
    if (s.stage === "route")
      return {
        label: "IN PROGRESS",
        hint:
          s.route === "short"
            ? "Steady the basket at the short crossing."
            : "Carry the basket along the clear lane.",
      };
    if (s.stage === "deliver")
      return {
        label: "IN PROGRESS",
        hint: "Deliver the basket to Hari at the truck.",
      };
    if (s.stage === "meeting")
      return {
        label: S.rank ? "A DECISION WAITS" : "AFTER THE ELECTION",
        hint: S.rank
          ? "Choose one shared improvement at the Panchayat."
          : "Meera and Naresh both need something. Win the election to decide.",
      };
    if (s.stage === "tomorrow")
      return { label: "TOMORROW", hint: "See what the neighbours built." };
    return {
      label: "✓ COMPLETE",
      hint: "Your choice changed a corner of the village.",
    };
  }
  function target() {
    const s = state();
    if (s.stage === "route")
      return s.route === "short"
        ? {
            x: 1300,
            y: 1010,
            name: "Steady the basket at the short crossing",
            hint: "Stand still and hold it level. Walking off tips it.",
          }
        : {
            x: 1460,
            y: 1120,
            name: "Carry the basket along the clear lane",
            hint: "Slower, but nothing spills.",
          };
    if (s.stage === "deliver")
      return {
        x: 1390,
        y: 967,
        name: "Deliver Meera’s basket to Hari",
        hint: "Hari is at the market truck.",
      };
    if (s.stage === "meeting" && S.rank)
      return {
        x: 1250,
        y: 724,
        name: "Choose a shared improvement",
        hint: "Meera and Naresh both asked. Only one project fits this story.",
      };
    if (s.stage === "tomorrow")
      return S.day > s.day
        ? {
            x: s.project === "lane" ? 1300 : 1130,
            y: s.project === "lane" ? 1010 : 780,
            name: "See what your neighbours built",
            hint: "The affected neighbour is on their way there.",
          }
        : {
            x: HOME.x,
            y: HOME.y + 34,
            name: "Rest at home; return to the project tomorrow",
            hint: "Sleeping runs the night at triple speed.",
          };
    return null;
  }
  window.VillageStory = { target, update: projectArt, open, status };
  const oldInteract = life.interact;
  life.interact = function (p, edge) {
    if (life.busy) return oldInteract(p, edge);
    const t = target(),
      s = state();
    if (
      !t ||
      Math.hypot(p.x - t.x, p.y - t.y) > 26 ||
      (s.stage === "tomorrow" && S.day <= s.day)
    ) {
      // Meera herself offers the errand once Naresh has his water.
      if (
        s.stage === "ready" &&
        life.state.done.includes("water") &&
        !life.carry
      ) {
        const meera = S.villagers.find((v) => v.n === "Meera Devi");
        if (meera && Math.hypot(p.x - meera.x, p.y - meera.y) < 24) {
          showPrompt(
            "storyMeera",
            '<h4>Meera Devi <span class="tiny">(keeps cows)</span></h4><p>She has a market errand for a steady pair of hands.</p><button id="storyAction">Hear Meera’s request</button>',
          );
          document.getElementById("storyAction").onclick = open;
          if (edge) open();
          return true;
        }
      }
      return oldInteract(p, edge);
    }
    const fn = () => {
      if (s.stage === "route") {
        if (S.phase !== "day") {
          speak(
            actor("Meera Devi"),
            "Keep the basket safe tonight. We can take it to market in daylight.",
            null,
            true,
          );
          return;
        }
        if (s.route === "short") {
          // A real moment of care: stand still while the basket settles, or it tips.
          life.begin(
            "Steadying the basket",
            2.5,
            () => {
              s.stage = "deliver";
              speak(
                actor("Meera Devi"),
                "Good, you steadied the basket before crossing. That broken lane could use our help.",
              );
              life.save();
            },
            () => {
              s.route = "safe";
              s.spilled = true;
              speak(
                actor("Meera Devi"),
                "The basket tipped! Half the vegetables are in the dust. Take the clear lane with what is left.",
              );
              log(
                "<b>The basket spilled.</b> The clear lane is safer; the marker has moved.",
              );
              life.save();
            },
          );
          return;
        }
        s.stage = "deliver";
        // The long way round is safe, but the sun moves on.
        advanceVillageTime(90);
        speak(
          actor("Meera Devi"),
          s.spilled
            ? "What is left arrived safely. Next time we will not need the long way round."
            : "The clear route kept everything safe. It took longer; the sun is higher now.",
        );
      } else if (s.stage === "deliver") {
        s.stage = "meeting";
        speak(
          actor("Hari Singh"),
          "The basket arrived safely. Meera mentioned the lane; Naresh asked about water. Hear both needs when you take up village responsibilities.",
        );
      } else if (s.stage === "meeting") {
        meeting();
        return;
      } else {
        s.stage = "complete";
        const who = actor(s.project === "lane" ? "Meera Devi" : "Naresh");
        who.tx = t.x;
        who.ty = t.y;
        who.wait = 20;
        speak(
          who,
          s.project === "lane"
            ? "The repaired crossing saves a detour. I can bring my baskets this way now."
            : "With the collection stand, I can prepare several containers together. You remembered what I needed.",
        );
      }
      life.save();
    };
    showPrompt(
      "story" + s.stage + (s.route || ""),
      `<h4>${t.name}</h4>${s.stage === "route" && s.route === "short" ? "<p>Stand still and hold the basket level.</p>" : ""}<button id="storyAction">${s.stage === "route" ? (s.route === "short" ? "Steady the basket" : "Continue carefully") : s.stage === "deliver" ? "Deliver basket" : s.stage === "meeting" ? "Discuss the project" : "Greet your neighbour"}</button>`,
    );
    document.getElementById("storyAction").onclick = fn;
    if (edge) fn();
    return true;
  };
})();
