const assert = require("node:assert/strict");
const crypto = require("node:crypto");
(async () => {
  const base = process.env.ASTRA_URL || "http://127.0.0.1:8773/";
  const html = await (await fetch(base)).text();
  const assets = [
    ...html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css))(?:\?v=([^" ]+))?"/g),
  ];
  assert.ok(assets.length >= 12, "Expected all local runtime assets");
  for (const [, file, version] of assets) {
    assert.match(version || "", /^[0-9a-f]{16}$/, "Unversioned asset: " + file);
    const response = await fetch(new URL(file + "?v=" + version, base));
    assert.ok(response.ok, file);
    const hash = crypto
      .createHash("sha256")
      .update(Buffer.from(await response.arrayBuffer()))
      .digest("hex")
      .slice(0, 16);
    assert.equal(hash, version, "Asset content/version mismatch: " + file);
  }
  console.log("Release asset versions PASS:", assets.length);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
