/* A bounded, saved story: remembered help, a route choice and a next-day project. */
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
    return memory && life.state.done.includes(memory[0])
      ? memory[1]
      : oldLine(who);
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
    if (s.project && S.day > s.day && astraTime > nextVisit) {
      nextVisit = astraTime + 60;
      const who = actor(s.project === "lane" ? "Meera Devi" : "Naresh");
      who.tx = s.project === "lane" ? 1300 : 1130;
      who.ty = s.project === "lane" ? 1010 : 780;
      who.wait = 35;
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
      '<h2>Meera’s market morning</h2><p>Carry a small market basket along one of two routes. The shorter lane needs a careful crossing; the longer route gives you clear footing. You can switch before starting.</p><button id="routeShort">Short lane · stop and steady the basket</button><button id="routeSafe" class="ghost">Long route · clear footing</button><button id="storyBack" class="ghost">Later</button>',
      true,
    );
    document.getElementById("storyBack").onclick = closeScreen;
    for (const [id, route] of [
      ["routeShort", "short"],
      ["routeSafe", "safe"],
    ])
      document.getElementById(id).onclick = () => {
        Object.assign(state(), { stage: "route", route });
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
    screen(
      `<h2>One shared improvement</h2><p>Meera needs an easier crossing. Naresh needs fewer water trips. Both projects cost 20 public coins, and this story has room for one first. Your public works budget: ${S.coins}.</p><button id="chooseLane" ${S.coins < 20 ? "disabled" : ""}>Repair the lane · 20 coins</button><button id="chooseWater" class="ghost" ${S.coins < 20 ? "disabled" : ""}>Build a collection stand · 20 coins</button><button id="storyBack" class="ghost">Return after collecting the budget</button>`,
      true,
    );
    document.getElementById("storyBack").onclick = closeScreen;
    for (const [id, project] of [
      ["chooseLane", "lane"],
      ["chooseWater", "water"],
    ])
      document.getElementById(id).onclick = () => {
        if (S.coins < 20 || state().project) return;
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
        `<h2>Meera’s market morning</h2><p>${s.stage === "route" ? "Follow your story marker to the route checkpoint, then deliver the basket to Hari." : s.stage === "deliver" ? "Take the basket to Hari at the market truck." : s.stage === "tomorrow" ? "The neighbours are working together. Return to the improvement tomorrow." : "Your choice changed this corner of the village. Visit the neighbours and see what they remember."}</p><button id="storyBack">Back to the village</button>`,
        true,
      );
      document.getElementById("storyBack").onclick = closeScreen;
    }
  }
  function target() {
    const s = state();
    if (s.stage === "route")
      return s.route === "short"
        ? { x: 1300, y: 1010, name: "Steady the basket at the short crossing" }
        : { x: 1460, y: 1120, name: "Carry the basket along the clear lane" };
    if (s.stage === "deliver")
      return { x: 1390, y: 967, name: "Deliver Meera’s basket to Hari" };
    if (s.stage === "meeting" && S.rank)
      return { x: 1250, y: 724, name: "Choose a shared improvement" };
    if (s.stage === "tomorrow")
      return S.day > s.day
        ? {
            x: s.project === "lane" ? 1300 : 1130,
            y: s.project === "lane" ? 1010 : 780,
            name: "See what your neighbours built",
          }
        : {
            x: HOME.x,
            y: HOME.y + 34,
            name: "Rest at home; return to the project tomorrow",
          };
    return null;
  }
  const oldTarget = life.target;
  life.target = () => target() || oldTarget();
  // The village loop uses its own target binding; route it through an explicit extension.
  window.VillageStory = { target, update: projectArt };
  const oldInteract = life.interact;
  life.interact = function (p, edge) {
    const t = target(),
      s = state();
    if (
      !t ||
      Math.hypot(p.x - t.x, p.y - t.y) > 26 ||
      (s.stage === "tomorrow" && S.day <= s.day)
    )
      return oldInteract(p, edge);
    const fn = () => {
      if (s.stage === "route") {
        s.stage = "deliver";
        speak(
          actor("Meera Devi"),
          s.route === "short"
            ? "Good, you steadied the basket before crossing. That broken lane could use our help."
            : "The clear route kept everything safe. It took a little longer, but nothing was lost.",
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
      "story" + s.stage,
      `<h4>${t.name}</h4><button id="storyAction">${s.stage === "route" ? "Continue carefully" : s.stage === "deliver" ? "Deliver basket" : s.stage === "meeting" ? "Discuss the project" : "Greet your neighbour"}</button>`,
    );
    document.getElementById("storyAction").onclick = fn;
    if (edge) fn();
    return true;
  };
  const button = document.createElement("button");
  button.id = "storyButton";
  button.textContent = "Meera’s market morning";
  button.onclick = () => {
    closeScreen();
    open();
  };
  toolsBar.appendChild(button);
})();
