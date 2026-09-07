const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  try {
    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [375, 667],
      [390, 844],
      [412, 915],
      [667, 375],
      [844, 390],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(process.env.ASTRA_URL || "http://127.0.0.1:8773");
      await page.locator("#beginVillage").click();
      await page.waitForTimeout(250);
      assert.equal(await page.locator(".astra-tools").isVisible(), false);
      assert.equal(await page.locator("#mobileMenu").isVisible(), true);
      const top = await page.locator(".mission").boundingBox();
      assert.ok(top.y + top.height < height * 0.22);
      await page.evaluate(() => {
        S.player.x = 1130;
        S.player.y = 770;
        S.talking = null;
      });
      await page.waitForTimeout(250);
      const prompt = await page.locator("#prompt").boundingBox();
      assert.ok(prompt, "Pump prompt visible");
      for (const id of ["stick", "act", "jumpBtn"]) {
        const box = await page.locator("#" + id).boundingBox();
        assert.ok(box && box.width >= 44 && box.height >= 44);
        assert.ok(
          box.x >= 0 &&
            box.y >= 0 &&
            box.x + box.width <= width &&
            box.y + box.height <= height,
        );
        assert.ok(
          !(
            box.x < prompt.x + prompt.width &&
            box.x + box.width > prompt.x &&
            box.y < prompt.y + prompt.height &&
            box.y + box.height > prompt.y
          ),
          "Prompt overlaps " + id,
        );
      }
      // Actual touch action at the pump must complete, without a keyboard.
      await page.locator("#act").tap();
      await page.waitForTimeout(3100);
      assert.equal(await page.evaluate(() => VillageLife.carry), "water");
      await page.locator("#mobileMenu").tap();
      assert.equal(await page.evaluate(() => S.paused), true);
      await page.locator('[data-tool="trailsButton"]').tap();
      await page.locator("#jobsClose").tap();
      await page.locator("#mobileMenu").tap();
      await page.locator('[data-tool="journalButton"]').tap();
      await page.locator("#closeJournal").tap();
      // Pausing while dragging clears the movement vector before resuming.
      await page.evaluate(() => {
        document.getElementById("c").dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            pointerId: 91,
            pointerType: "touch",
            clientX: 70,
            clientY: 200,
          }),
        );
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            pointerId: 91,
            pointerType: "touch",
            clientX: 90,
            clientY: 180,
          }),
        );
      });
      assert.ok(await page.evaluate(() => Math.hypot(stickV.x, stickV.y) > 0));
      await page.locator("#mobileMenu").tap();
      await page.locator("#mobileResume").tap();
      assert.equal(
        await page.evaluate(() => Math.hypot(stickV.x, stickV.y)),
        0,
      );
      await page.evaluate(() => {
        S.rank = 1;
      });
      await page.waitForTimeout(200);
      await page.locator("#mobileMenu").tap();
      assert.ok(
        (await page.locator(".menu-stats").textContent()).includes(
          "works budget",
        ),
      );
      await page.locator("#mobileResume").tap();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.screenshot({ path: `qa/phone-${width}x${height}.png` });
      assert.deepEqual(errors, []);
      console.log(`Mobile PASS ${width}x${height}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
