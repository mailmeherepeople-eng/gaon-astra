/* Regression coverage for actual transitions missed by the September audit. */
const { chromium } = require("./browser.cjs");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  const p = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const reload = async () => {
    await p.reload();
    await p.locator("#beginVillage").click();
  };
  try {
    await p.goto(process.env.ASTRA_URL || "http://127.0.0.1:8773/");
    await p.locator("#beginVillage").click();
    // Keep each kind of delivery through a real save/reload and then dawn.
    for (const [day, id, carry] of [
      [2, "water", "water"],
      [3, "feed", "fodder"],
      [4, "truck", "grain"],
    ]) {
      assert.equal(
        await p.evaluate(
          ({ day, carry }) => {
            S.rank = 1;
            S.day = day;
            S.phase = "day";
            S.t = 20;
            VillageLife.state.done = [
              "water",
              "feed",
              "truck",
              "garden",
              "litter",
            ];
            VillageLife.state.loads = 3;
            VillageLife.state.daily = null;
            VillageLife.state.story = {
              stage: "complete",
              route: null,
              project: null,
              day: null,
            };
            dawn();
            closeScreen();
            VillageLife.state.carry = carry;
            return VillageLife.save().ok;
          },
          { day, carry },
        ),
        true,
      );
      await reload();
      const result = await p.evaluate(() => {
        S.day++;
        S.phase = "day";
        dawn();
        closeScreen();
        const d = VillageLife.state.daily;
        const target =
          d.id === "water"
            ? d
            : d.id === "feed"
              ? { x: cows[0].position.x * 10, y: cows[0].position.z * 10 }
              : { x: 1390, y: 967 };
        S.player.x = target.x;
        S.player.y = target.y;
        VillageLife.interact(S.player, true);
        for (let i = 0; i < 30; i++) VillageLife.update(0.05);
        return {
          id: d.id,
          done: d.done,
          loads: VillageLife.state.loads,
          carry: VillageLife.carry,
          saved: VillageLife.save().ok,
        };
      });
      assert.deepEqual(result, {
        id,
        done: true,
        loads: 3,
        carry: null,
        saved: true,
      });
      await reload();
      assert.equal(await p.evaluate(() => VillageLife.state.daily.done), true);
    }
    // Old in-flight sacks are safe even if an older release already replaced the favour.
    assert.equal(
      await p.evaluate(() => {
        VillageLife.state.daily = null;
        VillageLife.state.carry = "grain";
        S.player.x = 1390;
        S.player.y = 967;
        VillageLife.interact(S.player, true);
        for (let i = 0; i < 30; i++) VillageLife.update(0.05);
        return VillageLife.state.loads === 3 && VillageLife.save().ok;
      }),
      true,
    );
    const backup = await p.evaluate(() => VillageStore.exportValue());
    const attack = structuredClone(backup);
    attack.state.daily = {
      day: attack.sim.day,
      id: "water",
      done: false,
      x: 1040,
      y: 897,
      who: '<img src="missing" onerror="window.auditMarkupExecuted=true">',
    };
    await p.evaluate(() => closeScreen());
    await p.evaluate(() => document.getElementById("settingsButton").click());
    await p.locator("#importVillage").setInputFiles({
      name: "crafted.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(attack)),
    });
    await p.waitForFunction(() =>
      /not a valid/.test(document.getElementById("importStatus").textContent),
    );
    assert.equal(await p.evaluate(() => !!window.auditMarkupExecuted), false);
    assert.equal(await p.locator("#restoreReady").count(), 0);
    assert.equal(
      await p.evaluate((b) => {
        b.sim.rank = 1.5;
        return VillageStore.validate(b);
      }, backup),
      false,
    );
    assert.equal(
      await p.evaluate((b) => {
        b.sim.age = 99;
        return VillageStore.validate(b);
      }, backup),
      false,
    );
    assert.equal(
      await p.evaluate((b) => {
        b.state.daily = { id: "water" };
        return VillageStore.validate(b);
      }, backup),
      false,
    );
    // Valid imports still work; runtime-only fields never overwrite the simulation.
    backup.sim.asleep = true;
    backup.sim.dayLen = 1;
    await p.locator("#importVillage").setInputFiles({
      name: "valid.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await p.locator("#restoreReady").click();
    await p.locator("#beginVillage").click();
    assert.deepEqual(await p.evaluate(() => [S.asleep, S.dayLen]), [
      false,
      480,
    ]);
    // Accounts and dusk completions survive the same reload path.
    const accounts = await p.evaluate(() => {
      S.day = 6;
      S.phase = "day";
      dawn();
      closeScreen();
      S.finishedAtDusk = 2;
      VillageLife.save();
      return JSON.stringify(S.lastDawn);
    });
    await reload();
    assert.equal(await p.evaluate(() => JSON.stringify(S.lastDawn)), accounts);
    assert.equal(await p.evaluate(() => S.finishedAtDusk), 2);
    // Check selected project details, not just the absence of horizontal overflow.
    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [390, 844],
      [667, 375],
    ]) {
      await p.setViewportSize({ width, height });
      await p.evaluate(() => {
        S.phase = "day";
        S.coins = 100;
        S.mandateLost = 0;
        openPlan();
        planApi.select(PLOTS.find((x) => x.id === "well"));
      });
      const bounds = await p.evaluate(() => {
        const side = document.querySelector(".side").getBoundingClientRect();
        const button = document.querySelector("#sideB").getBoundingClientRect();
        return {
          side: side.width,
          button: button.width,
          within: side.x >= 0 && side.right <= innerWidth,
        };
      });
      assert.ok(
        bounds.side >= 240 && bounds.button >= 44 && bounds.within,
        JSON.stringify(bounds),
      );
      await p.locator("#sideB").scrollIntoViewIfNeeded();
      await p.screenshot({ path: `qa/fixed-planner-${width}.png` });
      await p.evaluate(() => closeScreen());
    }
    // Advance a daytime errand across dusk using the simulation's phase boundary.
    const clock = await p.evaluate(() => {
      S.paused = true;
      S.phase = "day";
      S.t = 470;
      VillageLife.state.story = {
        stage: "route",
        route: "safe",
        project: null,
        day: null,
      };
      let t = VillageStory.target();
      S.player.x = t.x;
      S.player.y = t.y;
      VillageLife.interact(S.player, true);
      const crossed = [S.phase, S.t, VillageLife.state.story.stage];
      VillageLife.state.story.stage = "route";
      S.t = 149;
      VillageLife.interact(S.player, true);
      return { crossed, night: [S.phase, S.t, VillageLife.state.story.stage] };
    });
    assert.deepEqual(clock, {
      crossed: ["night", 80, "deliver"],
      night: ["night", 149, "route"],
    });
    assert.match(
      await p.evaluate(() => {
        S.sabhaDone = false;
        return VillageLife.target().name;
      }),
      /Sabha/,
    );
    await p.evaluate(() => {
      S.phase = "day";
      S.mandateLost = S.day;
      S.coins = 80;
      VillageLife.state.story.stage = "meeting";
      VillageStory.open();
    });
    assert.equal(await p.locator("#chooseLane").isDisabled(), true);
    assert.equal(
      await p.evaluate(() => {
        document.getElementById("chooseLane").onclick();
        return S.coins;
      }),
      80,
    );
    await p.locator("#storyBack").click();
    // Sabha dialogue remains interruptible and voting can be resumed after leaving.
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => {
      S.phase = "night";
      S.t = 15;
      S.sabhaDone = false;
      S.mandateLost = 0;
      enterRoom(PANCH);
    });
    await p.waitForFunction(() => S.scene === "interior" && !S.transition);
    await p.evaluate(() => nightSabha());
    assert.equal(await p.evaluate(() => S.paused), false);
    await p.waitForFunction(
      () =>
        !document.getElementById("speechBubble").classList.contains("hidden"),
    );
    const before = await p.evaluate(() => S.inside.x);
    await p.evaluate(() => {
      S.keys.d = true;
      for (let i = 0; i < 10; i++) tick(0.05);
      S.keys = {};
    });
    assert.notEqual(await p.evaluate(() => S.inside.x), before);
    await p.evaluate(() =>
      S.room.hotspots.find((h) => h.key === "clerk").act(),
    );
    assert.equal(await p.evaluate(() => S.talking.who.n), "Bansi Lal");
    // A new speaker collapses choices once; their ongoing speech cannot lock voting.
    await p.evaluate(() => draw());
    await p.locator("#sabhaVoteToggle").click();
    await p.evaluate(() => {
      draw();
      draw();
    });
    assert.equal(
      await p.locator("#sabhaPanel details").getAttribute("open"),
      "",
    );
    await p.locator("#sabhaClose").click();
    assert.equal(
      await p.evaluate(() => S.talking.who.n),
      "Bansi Lal",
      "Closing the meeting must preserve unrelated speech",
    );
    await p.evaluate(() => nightSabha());
    await p.locator("#sabhaListen").click();
    await p.screenshot({ path: "qa/fixed-sabha-phone.png" });
    await p.setViewportSize({ width: 667, height: 375 });
    await p.locator("#sabhaListen").click();
    await p.waitForFunction(() => {
      const panel = document
        .getElementById("sabhaPanel")
        .getBoundingClientRect();
      return ["speechBubble", "act", "jumpBtn"].every((id) => {
        const r = document.getElementById(id).getBoundingClientRect();
        return (
          r.right <= panel.left ||
          r.left >= panel.right ||
          r.bottom <= panel.top ||
          r.top >= panel.bottom
        );
      });
    });
    await p.screenshot({ path: "qa/fixed-sabha-landscape.png" });
    await p.locator("#sabhaVoteToggle").click();
    await p.locator("#sabhaPanel .vote").first().click();
    await p.locator("#sabhaCount").click();
    await p.locator("#sabhaFinish").click();
    assert.equal(await p.evaluate(() => S.sabhaDone), true);
    assert.equal(await p.evaluate(() => S.paused), false);
    assert.deepEqual(errors, []);
    console.log(
      "Audit fixes PASS: overnight deliveries, safe imports, accounts, phone planning, time, permissions and live Sabha",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
