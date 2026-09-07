const { chromium } = require("./browser.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  const evidence = {};
  try {
    const p = await browser.newPage({ viewport: { width: 900, height: 400 } });
    await p.goto(process.env.ASTRA_URL || "http://127.0.0.1:8773");
    await p.reload();
    assert.equal(
      await p.evaluate(() => localStorage.getItem(VillageStore.key)),
      null,
      "Intro must not save",
    );
    await p.locator("#beginVillage").click();
    const distance = () =>
      p.evaluate(() => Math.hypot(S.player.x - 1140, S.player.y - 760));
    const beforeWalk = await distance();
    await p.keyboard.down("w");
    await p.waitForTimeout(600);
    await p.keyboard.up("w");
    assert.ok(
      (await distance()) < beforeWalk,
      "Normal walking should lead toward the first objective",
    );
    evidence.world = await p.evaluate(() => {
      showPrompt("test", "<h4>Nearby action</h4><button>Talk</button>");
      const rect = promptEl.getBoundingClientRect();
      const meshes = [];
      scene.traverse((m) => {
        if (m.isInstancedMesh) meshes.push(m);
      });
      return {
        garden: garden.visible,
        clipped: rect.x < 0 || rect.right > innerWidth,
        instances: meshes.length,
        culled: meshes.every(
          (m) => m.frustumCulled && m.boundingSphere?.radius > 0,
        ),
        revision: THREE.REVISION,
        names: S.villagers.map((v) => v.n),
      };
    });
    assert.ok(
      evidence.world.garden && !evidence.world.clipped && evidence.world.culled,
    );
    assert.ok(
      evidence.world.names.includes("Naresh") &&
        evidence.world.names.includes("Kamla Devi"),
    );
    await p.evaluate(() => {
      sleep(false);
      dawn();
    });
    assert.ok(await p.locator("#sleep").isHidden());
    await p.evaluate(() => {
      act(true);
      dispatchEvent(new PointerEvent("pointercancel"));
    });
    assert.equal(await p.evaluate(() => acting || actEdge), false);
    evidence.save = await p.evaluate(() => {
      const good = VillageLife.save();
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error("quota");
      };
      const failure = VillageLife.save();
      Storage.prototype.setItem = original;
      return { good, failure, exportable: !!VillageStore.exportValue() };
    });
    assert.equal(evidence.save.good.ok, true);
    assert.equal(evidence.save.failure.ok, false);
    assert.equal(evidence.save.exportable, true);
    await p.evaluate(() => {
      S.rank = 1;
      openPlan();
    });
    await p
      .locator("#plotSelect")
      .selectOption(
        await p.locator("#plotSelect option").nth(1).getAttribute("value"),
      );
    assert.notEqual(await p.locator("#sideT").textContent(), "Pick a plot");
    await p.locator("#leave").click();
    assert.equal(await p.evaluate(() => planApi), null);
    evidence.quality = await p.evaluate(() => {
      GraphicsQuality.set("high");
      const high = renderer.getPixelRatio();
      GraphicsQuality.set("low");
      const low = renderer.getPixelRatio(),
        shadows = renderer.shadowMap.enabled;
      GraphicsQuality.set("auto");
      for (let i = 0; i < 200; i++)
        GraphicsQuality.sample(40, performance.now() + 20000);
      const result = { high, low, shadows, level: GraphicsQuality.level };
      GraphicsQuality.set("low");
      return result;
    });
    assert.ok(
      evidence.quality.low <= evidence.quality.high &&
        !evidence.quality.shadows &&
        evidence.quality.level < 2,
    );
    // Both saved story branches use actual UI buttons and interaction entry points.
    for (const [route, project] of [
      ["Short", "Lane"],
      ["Safe", "Water"],
    ]) {
      await p.evaluate(() => {
        VillageLife.state.done = ["water"];
        VillageLife.state.carry = null;
        VillageLife.state.story = {
          stage: "ready",
          route: null,
          project: null,
          day: null,
        };
        S.rank = 1;
        S.coins = 80;
      });
      await p.locator("#storyButton").click();
      await p.locator("#route" + route).click();
      for (let i = 0; i < 2; i++)
        await p.evaluate(() => {
          const t = VillageStory.target();
          S.player.x = t.x;
          S.player.y = t.y;
          VillageLife.interact(S.player, true);
        });
      await p.locator("#storyButton").click();
      await p.locator("#choose" + project).click();
      assert.equal(await p.evaluate(() => S.coins), 60);
      await p.evaluate(() => {
        S.day++;
        VillageStory.update();
        const t = VillageStory.target();
        S.player.x = t.x;
        S.player.y = t.y;
        VillageLife.interact(S.player, true);
      });
      assert.equal(
        await p.evaluate(() => VillageLife.state.story.stage),
        "complete",
      );
    }
    // Repeated real pickup/feed actions should stop allocating carrying geometry after warm-up.
    evidence.carry = await p.evaluate(() => {
      VillageLife.state.story = {
        stage: "complete",
        route: null,
        project: null,
        day: null,
      };
      VillageLife.state.done = ["feed"];
      VillageLife.state.carry = null;
      const cycle = () => {
        S.player.x = 1230;
        S.player.y = 1030;
        VillageLife.interact(S.player, true);
        S.player.x = cows[0].position.x * 10;
        S.player.y = cows[0].position.z * 10;
        VillageLife.interact(S.player, true);
        draw();
      };
      cycle();
      const before = renderer.info.memory.geometries;
      for (let i = 0; i < 30; i++) cycle();
      return { before, after: renderer.info.memory.geometries };
    });
    assert.equal(evidence.carry.after, evidence.carry.before);
    await p.evaluate(() => {
      S.happy = 0;
      S.over = false;
      tick(0.01);
    });
    await p.locator("#again").click();
    await p.locator("#beginVillage").click();
    assert.equal(await p.locator("#again").count(), 0);
    assert.ok(await p.evaluate(() => S.happy > 0));
    await p.setViewportSize({ width: 568, height: 320 });
    await p.evaluate(() => {
      speak(S.villagers[0], Array(80).fill("Neighbour").join(" "), null, true);
    });
    await p.waitForTimeout(200);
    const bubble = await p.locator("#speechBubble").boundingBox();
    assert.ok(bubble.y >= 0 && bubble.y + bubble.height <= 320);
    await p.evaluate(() => {
      tick = () => {
        throw new Error("controlled failure");
      };
    });
    await p.waitForTimeout(300);
    assert.equal(await p.locator('[role="alert"]').count(), 1);
    assert.ok(await p.evaluate(() => GameRecovery.failed));
    await p.close();
    fs.mkdirSync("audits", { recursive: true });
    fs.writeFileSync(
      "audits/repair-results.json",
      JSON.stringify(evidence, null, 2),
    );
    console.log("Repair regressions PASS", evidence);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
