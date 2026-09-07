const { chromium } = require("./browser.cjs");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  const results = [];
  try {
    for (const mobile of [true, false]) {
      const page = await browser.newPage({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
        hasTouch: mobile,
        isMobile: mobile,
        deviceScaleFactor: mobile ? 3 : 1,
      });
      await page.goto(process.env.ASTRA_URL || "http://127.0.0.1:8773");
      await page.locator("#beginVillage").click();
      await page.evaluate(
        (mobile) => GraphicsQuality.set(mobile ? "low" : "high"),
        mobile,
      );
      for (const scenario of [
        "start",
        "pump",
        "crowded",
        "night",
        "interior",
      ]) {
        await page.evaluate((scenario) => {
          if (S.scene === "interior") leaveRoom(true);
          S.phase = scenario === "night" ? "night" : "day";
          S.t = scenario === "night" ? 50 : 120;
          S.keys = {};
          if (scenario === "start") {
            S.player.x = 1130;
            S.player.y = 840;
            cam.yaw = Math.atan2(-10, 80);
            cam.dist = 9;
            cam.pitch = 0.45;
          }
          if (scenario === "pump") {
            S.player.x = 1110;
            S.player.y = 805;
            cam.dist = 7;
            cam.pitch = 0.3;
            cam.yaw = 0;
          }
          if (scenario === "crowded" || scenario === "night") {
            S.player.x = 1250;
            S.player.y = 1000;
            cam.dist = 12;
            cam.pitch = 0.45;
            cam.yaw = 0;
            S.villagers.forEach((v, i) => {
              v.x = 1200 + i * 7;
              v.y = 970;
              v.tx = v.x;
              v.ty = v.y;
              v.wait = 60;
            });
          }
          if (scenario === "interior") enterRoom(HOME);
        }, scenario);
        await page.waitForTimeout(900);
        const sample = await page.evaluate(
          () =>
            new Promise((resolve) => {
              let last = performance.now();
              const frames = [],
                calls = [],
                triangles = [];
              function record(now) {
                frames.push(now - last);
                last = now;
                calls.push(renderer.info.render.calls);
                triangles.push(renderer.info.render.triangles);
                if (frames.length < 90) requestAnimationFrame(record);
                else {
                  frames.shift();
                  frames.sort((a, b) => a - b);
                  calls.sort((a, b) => a - b);
                  triangles.sort((a, b) => a - b);
                  resolve({
                    medianMs: frames[Math.floor(frames.length * 0.5)],
                    p95Ms: frames[Math.floor(frames.length * 0.95)],
                    calls: calls[45],
                    triangles: triangles[45],
                    geometries: renderer.info.memory.geometries,
                    dpr: renderer.getPixelRatio(),
                    revision: THREE.REVISION,
                    quality: GraphicsQuality.mode,
                    camera: {
                      distance: cam.dist,
                      pitch: cam.pitch,
                      yaw: cam.yaw,
                    },
                  });
                }
              }
              requestAnimationFrame(record);
            }),
        );
        results.push({
          profile: mobile ? "phone emulation" : "desktop",
          scenario,
          ...sample,
        });
        if (scenario === "start" || scenario === "night")
          await page.screenshot({
            path: `qa/repaired-${mobile ? "phone" : "desktop"}-${scenario}.png`,
          });
        console.log(results.at(-1));
      }
      await page.close();
    }
  } finally {
    fs.writeFileSync(
      "audits/benchmark-results.json",
      JSON.stringify(
        {
          date: new Date().toISOString(),
          browser: browser.version(),
          note: "Headless desktop browser, not physical-phone frame times. 900 ms warm-up per scenario, 90 RAF samples.",
          results,
        },
        null,
        2,
      ),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
