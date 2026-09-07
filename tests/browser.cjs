/* CI has no physical GPU. Functional checks run Low; local checks also cover High. */
const { chromium: original } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const chromium = {
  launch: async (options) => {
    const browser = await original.launch({
      ...options,
      args: process.env.CI
        ? [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            "--disable-dev-shm-usage",
          ]
        : options.args,
    });
    const context = browser.newContext.bind(browser);
    const debug = (page) => {
      if (!process.env.CI) return;
      page.setDefaultTimeout(90000);
      page.on("pageerror", (error) =>
        console.error("Browser error:", error.message),
      );
      page.on("console", (message) => {
        if (message.type() === "error")
          console.error("Browser console:", message.text());
      });
    };
    browser.newContext = async (options) => {
      const value = await context(options);
      value.on("page", debug);
      if (process.env.ASTRA_TEST_QUALITY)
        await value.addInitScript((quality) => {
          try {
            localStorage.setItem("gaon-astra-quality", quality);
          } catch {}
        }, process.env.ASTRA_TEST_QUALITY);
      return value;
    };
    // newPage is a convenience API that may bypass the public newContext method.
    const page = browser.newPage.bind(browser);
    browser.newPage = async (options) => {
      const value = await page(options);
      debug(value);
      if (process.env.ASTRA_TEST_QUALITY)
        await value.addInitScript((quality) => {
          try {
            localStorage.setItem("gaon-astra-quality", quality);
          } catch {}
        }, process.env.ASTRA_TEST_QUALITY);
      return value;
    };
    return browser;
  },
};
module.exports = { chromium };
