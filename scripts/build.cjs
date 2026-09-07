const fs = require("node:fs"),
  crypto = require("node:crypto");
const { buildSync } = require("esbuild");
// Vendor a pinned local renderer. No runtime CDN or external font dependency.
buildSync({
  stdin: { contents: "export * from 'three';", resolveDir: process.cwd() },
  bundle: true,
  format: "iife",
  globalName: "THREE",
  minify: true,
  legalComments: "inline",
  outfile: "vendor/three.min.js",
});
fs.copyFileSync("node_modules/three/LICENSE", "vendor/THREE-LICENSE.txt");
let html = fs.readFileSync("index.html", "utf8");
html = html.replace(
  /((?:src|href)=")([^"?]+\.(?:js|css))(?:\?v=[^" ]+)?"/g,
  (all, prefix, file) => {
    if (!fs.existsSync(file)) throw new Error("Missing release asset: " + file);
    const version = crypto
      .createHash("sha256")
      .update(fs.readFileSync(file))
      .digest("hex")
      .slice(0, 16);
    return `${prefix}${file}?v=${version}"`;
  },
);
fs.writeFileSync("index.html", html);
console.log("Pinned renderer, license and asset versions built.");
