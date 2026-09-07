/* Startup failures must remain readable even before the simulation initializes. */
(() => {
  let shown = false;
  function report(error) {
    if (window.GameRecovery) {
      GameRecovery.fail(error);
      return;
    }
    if (shown) return;
    shown = true;
    const overlay = document.getElementById("overlay");
    overlay.classList.remove("hidden");
    overlay.innerHTML =
      '<div class="card" role="alert"><h2>The village could not open.</h2><p>This version needs a browser with WebGL 2 and hardware acceleration. Try updating your browser, or reload if the connection was interrupted.</p><button id="startupReload">Reload</button></div>';
    document.getElementById("startupReload").onclick = () => location.reload();
  }
  addEventListener("error", (event) => {
    if (event.error) report(event.error);
  });
  addEventListener("unhandledrejection", (event) => report(event.reason));
  document.getElementById("c").addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    report(new Error("Graphics context lost"));
  });
})();
