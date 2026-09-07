/* Elected-day loop, daily favours, the accounts, elections with stakes, story risks and UI copy. */
const { chromium } = require("./browser.cjs");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.ASTRA_URL || "http://127.0.0.1:8773");
    await p.locator("#beginVillage").click();
    // The toolbar keeps four tools; sound lives in Settings.
    const tools = await p.evaluate(() =>
      [...toolsBar.querySelectorAll("button")].map((b) => b.id),
    );
    assert.deepEqual(tools, [
      "journalButton",
      "trailsButton",
      "pauseVillage",
      "settingsButton",
    ]);
    await p.locator("#settingsButton").click();
    assert.equal(await p.locator("#soundButton").count(), 1);
    await p.locator("#settingsBack").click();
    // The pump shows no dead button while carrying.
    await p.evaluate(() => {
      VillageLife.state.carry = "water";
      S.player.x = 1130;
      S.player.y = 770;
      tick(0.05);
    });
    assert.equal(await p.locator("#prompt button").count(), 0);
    // Reward speech anchors at the player, not at a distant actor.
    await p.evaluate(() => {
      S.player.x = 1040;
      S.player.y = 895;
      VillageLife.interact(S.player, true);
    });
    const anchorGap = await p.evaluate(() =>
      S.talking?.anchor
        ? Math.hypot(
            S.talking.anchor.x - U(S.player.x),
            S.talking.anchor.z - U(S.player.y),
          )
        : null,
    );
    assert.ok(anchorGap !== null && anchorGap < 1, "anchor " + anchorGap);
    // Meera offers her errand in the world once Naresh has water.
    await p.evaluate(() => {
      S.talking = null;
      const m = S.villagers.find((v) => v.n === "Meera Devi");
      m.x = 1600;
      m.y = 1200;
      m.tx = m.x;
      m.ty = m.y;
      m.wait = 60;
      S.player.x = 1600;
      S.player.y = 1210;
      tick(0.05);
    });
    assert.ok((await p.locator("#prompt").innerText()).includes("Meera"));
    // The short crossing can spill; the clear lane costs daylight.
    await p.evaluate(() => VillageStory.open());
    await p.locator("#routeShort").click();
    await p.evaluate(() => {
      const t = VillageStory.target();
      S.player.x = t.x;
      S.player.y = t.y;
      VillageLife.interact(S.player, true);
    });
    assert.equal(await p.evaluate(() => VillageLife.busy), true);
    await p.evaluate(() => {
      S.player.x += 40;
      for (let i = 0; i < 3; i++) VillageLife.update(0.05);
    });
    assert.equal(await p.evaluate(() => VillageLife.state.story.route), "safe");
    assert.equal(
      await p.evaluate(() => VillageLife.state.story.stage),
      "route",
    );
    const tBefore = await p.evaluate(() => S.t);
    await p.evaluate(() => {
      const t = VillageStory.target();
      S.player.x = t.x;
      S.player.y = t.y;
      VillageLife.interact(S.player, true);
    });
    assert.equal(
      await p.evaluate(() => VillageLife.state.story.stage),
      "deliver",
    );
    assert.ok((await p.evaluate(() => S.t)) > tBefore);
    // The story card lives in Neighbour jobs.
    await p.evaluate(() => {
      S.talking = null;
    });
    await p.locator("#trailsButton").click();
    assert.equal(await p.locator("#storyButton").count(), 1);
    await p.locator("#jobsClose").click();
    // Remembered lines rotate instead of repeating forever.
    const lines = await p.evaluate(() => {
      const n = S.villagers.find((v) => v.n === "Naresh");
      return [talkLine(n), talkLine(n), talkLine(n)];
    });
    assert.ok(lines[0].includes("first bucket") && lines[1] !== lines[0]);
    // The election count derives from favours and names who voted.
    await p.evaluate(() => {
      VillageLife.state.done = ["water", "litter", "feed", "truck", "garden"];
      VillageLife.state.story = {
        stage: "complete",
        route: null,
        project: null,
        day: null,
      };
      VillageLife.election();
    });
    const ballot = await p.locator("#overlay").innerText();
    assert.ok(ballot.includes("Naresh") && ballot.includes("Devi Lal"));
    await p.locator("#voteResult").click();
    assert.ok((await p.locator("#overlay").innerText()).includes("12 of 15"));
    await p.locator("#memberGo").click();
    assert.equal(await p.evaluate(() => S.rank), 1);
    // The objective follows the elected day: budget, map, site, Sabha, home.
    const name = () => p.evaluate(() => VillageLife.target().name);
    assert.ok((await name()).includes("Collect the budget"));
    await p.evaluate(() => {
      S.collected = true;
      S.coins = 60;
    });
    assert.ok((await name()).includes("Plan a project"));
    await p.evaluate(() => {
      S.buildings.push({
        ...PLOTS.find((x) => x.id === "well"),
        hp: 1,
        under: true,
        start: S.day,
      });
    });
    assert.ok((await name()).includes("Watch the well"));
    await p.evaluate(() => {
      S.t = S.dayLen - 0.01;
      tick(0.05);
    });
    assert.equal(await p.evaluate(() => S.phase), "night");
    assert.ok((await name()).includes("Sabha"));
    // Night one has something gentle to find, and the Sabha discusses it.
    assert.ok(
      await p.evaluate(() =>
        S.problems.some((q) => q.k === "plastic" && q.gentle),
      ),
    );
    await p.evaluate(() => enterRoom(PANCH));
    await p.waitForFunction(() => S.scene === "interior" && !S.transition);
    await p.evaluate(() => nightSabha());
    await p.locator("#sabhaVoteToggle").click();
    assert.ok(
      (await p.locator("#sabhaPanel").innerText()).includes("Clean-up"),
    );
    await p.locator(".vote").first().click();
    await p.locator("#sabhaCount").click();
    assert.ok(
      (await p.locator("#sabhaPanel").innerText()).includes("stood with you"),
    );
    await p.locator("#sabhaFinish").click();
    const afterSabha = await name();
    assert.ok(afterSabha.includes("Home") || afterSabha.includes("Report"));
    // Sleep to dawn: the morning accounts explain income, happiness and approval.
    await p.evaluate(() => {
      sleep(false);
      S.t = S.nightLen - 0.01;
      tick(0.05);
    });
    const accounts = await p.locator("#overlay").innerText();
    assert.ok(
      accounts.includes("village accounts") &&
        accounts.includes("Approval") &&
        accounts.includes("treasury"),
      accounts.slice(0, 200),
    );
    await p.locator("#dawnOk").click();
    // A neighbour asks a small favour every day once the five are done.
    assert.ok(
      await p.evaluate(
        () => VillageLife.state.daily && !VillageLife.state.daily.done,
      ),
    );
    // Losing a re-election costs the day's plan.
    await p.evaluate(() => {
      S.approval = 30;
      S.day = 4;
      S.lastElection = 0;
      S.coins = 80;
      election(() => openPlan());
    });
    assert.ok(
      (await p.locator("#overlay").innerText()).includes("did not renew"),
    );
    await p.locator("#ok").click();
    assert.ok(
      (await p.locator("#overlay").innerText()).includes("No plan from you"),
    );
    await p.locator("#lifeBack").click();
    // The planner is wider, has a legend and a hover name.
    await p.evaluate(() => {
      S.mandateLost = 0;
      openPlan();
    });
    assert.ok(
      await p.evaluate(
        () =>
          !!document.querySelector(".plan-card") &&
          !!document.querySelector(".legend") &&
          !!document.getElementById("plotTip"),
      ),
    );
    await p.locator("#leave").click();
    // Art and draw calls: the banyan wears the neem language, trunks are merged.
    const art = await p.evaluate(() => {
      const banyan = scene.children.find((o) =>
        o.children.some((c) => c.name === "Banyan canopy"),
      );
      let cylinders = 0;
      WorldArt.corner.traverse((o) => {
        if (
          o.isMesh &&
          !o.isInstancedMesh &&
          o.geometry.type === "CylinderGeometry"
        )
          cylinders++;
      });
      return { banyan: !!banyan && banyan.visible, cylinders };
    });
    assert.ok(art.banyan && art.cylinders < 400, JSON.stringify(art));
    // HUD numbers explain themselves.
    assert.ok(
      await p.evaluate(() =>
        [...document.querySelectorAll("#hud .pill")].every(
          (el) => el.title.length > 10,
        ),
      ),
    );
    assert.deepEqual(errors, []);
    console.log("Gameplay PASS");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
