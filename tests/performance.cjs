const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  try {
    for (const mobile of [true, false]) {
      const page = await browser.newPage({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
        deviceScaleFactor: mobile ? 3 : 1,
        isMobile: mobile,
        hasTouch: mobile,
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(process.env.ASTRA_URL || "http://127.0.0.1:8773");
      await page.locator("#beginVillage").click();
      await page.evaluate(() => {
        S.player.x = 1110;
        S.player.y = 805;
        cam.dist = 7;
        cam.pitch = 0.3;
        cam.yaw = 0;
      });
      await page.waitForTimeout(1000);
      const metrics = await page.evaluate(async () => {
        let mutations = 0,
          pathCalculations = 0;
        const original = pathLinks;
        pathLinks = function () {
          pathCalculations++;
          return original();
        };
        const observer = new MutationObserver(
          (records) => (mutations += records.length),
        );
        for (const el of [
          document.getElementById("hud"),
          document.querySelector(".mission"),
        ])
          observer.observe(el, { childList: true, subtree: true });
        await new Promise((resolve) => setTimeout(resolve, 3000));
        observer.disconnect();
        pathLinks = original;
        return {
          mobile: mobileGraphics,
          dpr: renderer.getPixelRatio(),
          shadows: renderer.shadowMap.enabled,
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          mutations,
          pathCalculations,
        };
      });
      assert.equal(metrics.mobile, mobile);
      assert.equal(metrics.shadows, !mobile);
      if (mobile) {
        assert.ok(metrics.dpr <= 1.25);
        assert.ok(metrics.triangles < 850000);
      }
      assert.ok(metrics.mutations < 40, JSON.stringify(metrics));
      assert.equal(metrics.pathCalculations, 0);
      // A completed building must invalidate cached lanes, including after loading saves.
      assert.ok(
        await page.evaluate(() => {
          const before = pathBuildingsKey;
          S.buildings.push({ id: "well", x: 950, y: 1000, hp: 3 });
          rebuildPaths();
          return before !== pathBuildingsKey && pathsGroup.children.length > 0;
        }),
      );
      await page.screenshot({
        path: mobile
          ? "qa/performance-phone.png"
          : "qa/performance-desktop.png",
      });
      await page.evaluate(() => screen("<h2>Paused</h2>"));
      await page.waitForTimeout(300);
      const frames = await page.evaluate(() => frameNo);
      await page.waitForTimeout(1100);
      assert.ok(
        await page.evaluate((n) => frameNo - n <= 6, frames),
        "Paused world rendered too often",
      );
      await page.evaluate(() => closeScreen());
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => S.paused), false);
      assert.deepEqual(errors, []);
      console.log("Performance PASS", metrics);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
