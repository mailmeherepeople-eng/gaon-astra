const { chromium } = require("./browser.cjs");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  const page = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.ASTRA_URL || "http://127.0.0.1:8773");
  await page.locator("#beginVillage").click();
  async function act(x, y, wait = 300) {
    await page.evaluate(
      ([x, y]) => {
        S.talking = null;
        S.player.x = x;
        S.player.y = y;
        S.keys = {};
      },
      [x, y],
    );
    await page.waitForTimeout(150);
    await page.keyboard.press("e");
    await page.waitForTimeout(wait);
  }
  await page.evaluate(() => openPlan());
  assert.equal(await page.locator("#sideB").count(), 0);
  assert.equal(await page.evaluate(() => S.coins), 0);
  await page.locator("#lifeBack").click();
  await page.evaluate(() =>
    roomFor(PANCH)
      .hotspots.find((h) => h.key === "chest")
      .act(),
  );
  assert.equal(await page.evaluate(() => S.coins), 0);
  await page.locator("#lifeBack").click();
  await act(1130, 770, 3200);
  assert.equal(await page.evaluate(() => VillageLife.carry), "water");
  await act(1040, 901);
  assert.equal(
    await page.evaluate(() => VillageLife.state.done.includes("water")),
    true,
  );
  await act(1395, 1010, 1500);
  await act(1415, 1018, 1500);
  await act(1404, 1035, 1500);
  await act(1370, 1045);
  assert.equal(
    await page.evaluate(() => VillageLife.state.done.includes("litter")),
    true,
  );
  await act(1230, 1030);
  let cow = await page.evaluate(() => [
    cows[0].position.x * 10,
    cows[0].position.z * 10,
  ]);
  await act(...cow);
  assert.equal(
    await page.evaluate(() => VillageLife.state.done.includes("feed")),
    true,
  );
  for (let i = 0; i < 3; i++) {
    await act(1350, 980, 1400);
    await act(1390, 967, 1700);
  }
  await act(1130, 770, 3200);
  await act(1090, 815, 2300);
  assert.equal(await page.evaluate(() => VillageLife.state.done.length), 5);
  assert.equal(await page.evaluate(() => S.rank), 0);
  await page.evaluate(() => VillageLife.election());
  await page.locator("#voteResult").click();
  assert.equal(await page.evaluate(() => S.rank), 1);
  await page.locator("#memberGo").click();
  await page.evaluate(() => visitPanchayat());
  assert.equal(await page.evaluate(() => S.coins), 80);
  await page.evaluate(() => planApi.select(PLOTS.find((p) => p.id === "well")));
  await page.locator("#sideB").click();
  assert.equal(
    await page.evaluate(() =>
      S.buildings.some((b) => b.id === "well" && b.under),
    ),
    true,
  );
  console.log("JOBS + ELECTION + CONSTRUCTION PASS");
  await page.evaluate(() => {
    closeScreen();
    VillageLife.save();
  });
  await page.reload();
  await page.locator("#beginVillage").click();
  assert.equal(await page.evaluate(() => S.rank), 1);
  assert.equal(await page.evaluate(() => VillageLife.state.done.length), 5);
  console.log("SAVE PASS");
  await page.evaluate(() => enterRoom(HOME));
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    cam.dist = 14;
    cam.yaw = 0.9;
    cam.pitch = 0.8;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "qa/elected-interior.png" });
  console.log(
    await page.evaluate(() => ({
      room: S.room.name,
      cam: camera.position.toArray(),
      hidden: S.room.cutaway.filter((o) => !o.visible).length,
    })),
  );
  assert.deepEqual(errors, []);
  await b.close();
  console.log("NO JS ERRORS");
})();
