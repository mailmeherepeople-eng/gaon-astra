const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  try {
    for (const [width, height] of [
      [390, 844],
      [667, 375],
      [1440, 1000],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        hasTouch: width < 1000,
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(process.env.ASTRA_URL || "http://127.0.0.1:8773");
      await page.locator("#beginVillage").click();
      await page.evaluate(() => {
        const v = S.villagers[0];
        v.x = 1110;
        v.y = 805;
        S.player.x = 1110;
        S.player.y = 824;
        cam.yaw = 0;
        cam.pitch = 0.3;
        cam.dist = 7;
        startTalk(v);
      });
      await page.waitForTimeout(400);
      assert.ok(await page.locator("#speechBubble").isVisible());
      assert.equal(await page.locator("#prompt .say").count(), 0);
      const box = await page.locator("#speechBubble").boundingBox();
      assert.ok(
        box.x >= 0 &&
          box.x + box.width <= width &&
          box.y >= 0 &&
          box.y + box.height < height - 125,
      );
      assert.equal(
        await page.locator("#speechBubble p").textContent(),
        await page.evaluate(() => S.talking.line),
      );
      await page.screenshot({ path: `qa/speech-${width}x${height}.png` });
      await page.evaluate(() => {
        S.talking = null;
        VillageLife.state.carry = "water";
        S.player.x = 1040;
        S.player.y = 895;
        VillageLife.interact(S.player, true);
      });
      await page.waitForTimeout(150);
      assert.ok(
        (await page.locator("#speechBubble p").textContent()).includes(
          "Clean water",
        ),
      );
      assert.equal(await page.locator("#prompt .say").count(), 0);
      // Use the real interaction path without clearing or expiring the active line.
      await page.evaluate(() => {
        S.player.x = 1130;
        S.player.y = 770;
        S.talking.keepReading = true;
        S.talking.t = 30;
      });
      await page.waitForTimeout(150);
      assert.ok(await page.locator("#speechBubble").isVisible());
      if (width < 1000) await page.locator("#act").tap();
      else await page.keyboard.press("e");
      await page.waitForTimeout(2700);
      assert.equal(await page.evaluate(() => VillageLife.carry), "water");
      assert.ok(await page.evaluate(() => S.talking.t > 0));
      // A different nearby villager can replace a still-active speech bubble.
      await page.evaluate(() => {
        S.player.x = 1700;
        S.player.y = 1200;
        S.villagers.forEach((v) => {
          v.x = 1900;
          v.y = 1300;
          v.tx = v.x;
          v.ty = v.y;
          v.wait = 60;
        });
        const v = S.villagers[1];
        v.x = 1700;
        v.y = 1190;
        v.tx = v.x;
        v.ty = v.y;
      });
      await page.waitForTimeout(150);
      await page.locator("#hsb").click();
      await page.waitForTimeout(150);
      assert.equal(
        await page.evaluate(() => S.talking.who === S.villagers[1]),
        true,
      );
      await page.evaluate(() => enterRoom(PANCH));
      await page.waitForTimeout(700);
      await page.evaluate(() =>
        S.room.hotspots.find((h) => h.key === "clerk").act(),
      );
      await page.waitForTimeout(200);
      assert.ok(await page.locator("#speechBubble").isVisible());
      assert.equal(
        await page.locator("#speechBubble strong").textContent(),
        "Bansi Lal",
      );
      // Interior interactions also remain available during a clerk's speech.
      await page.evaluate(() => {
        S.inside.x = 0;
        S.inside.z = S.room.D / 2 - 0.8;
      });
      await page.waitForTimeout(150);
      assert.equal(await page.locator("#hsb").textContent(), "Leave");
      await page.locator("#hsb").click();
      await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => S.scene), "village");
      await page.evaluate(() =>
        speak(S.villagers[0], "A short line.", null, true),
      );
      await page.evaluate(() => {
        S.talking.t = 0.01;
      });
      await page.waitForTimeout(150);
      assert.ok(!(await page.locator("#speechBubble").isVisible()));
      await page.evaluate(() => {
        leaveRoom(true);
        enterRoom(
          S.buildings.find(
            (b) =>
              b !== HOME &&
              residentOf(b) &&
              ["home", "house", "homeM", "homeS"].includes(b.id),
          ),
        );
      });
      await page.waitForTimeout(750);
      await page.evaluate(() =>
        S.room.hotspots.find((h) => h.key === "talk").act(),
      );
      await page.waitForTimeout(250);
      assert.ok(await page.locator("#speechBubble").isVisible());
      assert.ok(await page.evaluate(() => S.talking.t > 0));
      await page.evaluate(() => screen("<h2>Paused</h2>"));
      await page.waitForTimeout(100);
      assert.ok(!(await page.locator("#speechBubble").isVisible()));
      assert.deepEqual(errors, []);
      await page.close();
      console.log("Speech PASS", width, height);
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
