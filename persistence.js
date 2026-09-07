/* Village persistence owns validation, recovery and save results. Journal is separate. */
(() => {
  const key = "gaon-astra-village-v2",
    backupKey = key + "-backup";
  let lastSaved = null,
    latest = null;
  function validate(p) {
    if (p?.v !== 2 || !p.state || !p.sim) return false;
    const s = p.sim,
      state = p.state;
    if (
      !Array.isArray(state.done) ||
      state.done.some(
        (id) => !["water", "feed", "garden", "truck", "litter"].includes(id),
      )
    )
      return false;
    if (!["water", "grain", "fodder", "litter", null].includes(state.carry))
      return false;
    if (
      ![state.litter, state.loads, state.selected].every(Number.isFinite) ||
      state.litter < 0 ||
      state.litter > 3 ||
      state.loads < 0 ||
      state.loads > 3
    )
      return false;
    if (
      ![
        "day",
        "t",
        "coins",
        "treasury",
        "pop",
        "happy",
        "approval",
        "rank",
        "grain",
        "milk",
        "wood",
        "flour",
        "chairs",
        "age",
        "night",
      ].every((k) => Number.isFinite(s[k]))
    )
      return false;
    if (
      s.day < 1 ||
      s.happy <= 0 ||
      s.rank < 0 ||
      s.rank > 4 ||
      !["day", "night"].includes(s.phase)
    )
      return false;
    if (
      !s.player ||
      !Number.isFinite(s.player.x) ||
      !Number.isFinite(s.player.y)
    )
      return false;
    if (
      !s.res ||
      typeof s.res !== "object" ||
      !Array.isArray(s.policies) ||
      s.policies.some((id) => !POLICIES.some((p) => p.id === id))
    )
      return false;
    if (
      Object.values(s.res).some(
        (r) =>
          r &&
          !NAMES.some((n) => n.n === r.n) &&
          !["Devi Lal", NPC_SARPANCH].includes(r.n),
      )
    )
      return false;
    if (
      Object.values(s.res).some(
        (r) => r && typeof r.job === "string" && /[<>]/.test(r.job),
      )
    )
      return false;
    if (
      !Array.isArray(s.reported) ||
      s.reported.some((v) => typeof v !== "string")
    )
      return false;
    if (
      !["buildings", "problems", "petitions"].every((k) => Array.isArray(s[k]))
    )
      return false;
    if (
      !s.buildings.some((b) => b.id === "home") ||
      !s.buildings.some((b) => b.id === "panchayat")
    )
      return false;
    if (s.petitions.some((p) => !B[p.id] || !Number.isFinite(p.days)))
      return false;
    if (
      s.problems.some(
        (p) => !["thief", "flood", "plastic", "sick", "dispute"].includes(p.k),
      )
    )
      return false;
    if (state.story) {
      const v = state.story;
      if (
        ![
          "ready",
          "route",
          "deliver",
          "meeting",
          "tomorrow",
          "complete",
        ].includes(v.stage) ||
        ![null, "short", "safe"].includes(v.route) ||
        ![null, "lane", "water"].includes(v.project) ||
        (v.project && !Number.isFinite(v.day))
      )
        return false;
    }
    return s.buildings.every(
      (b) => B[b.id] && Number.isFinite(b.x) && Number.isFinite(b.y),
    );
  }
  function parse(raw) {
    try {
      const p = JSON.parse(raw);
      return validate(p) ? p : null;
    } catch {
      return null;
    }
  }
  function read() {
    try {
      return (
        parse(localStorage.getItem(key)) ||
        parse(localStorage.getItem(backupKey))
      );
    } catch {
      return null;
    }
  }
  function write(value) {
    try {
      if (!validate(value))
        return {
          ok: false,
          message: "Save could not be validated. Your previous save is safe.",
        };
      latest = JSON.parse(JSON.stringify(value));
      const previous = localStorage.getItem(key);
      if (parse(previous)) localStorage.setItem(backupKey, previous);
      localStorage.setItem(key, JSON.stringify(value));
      lastSaved = Date.now();
      return { ok: true, message: "Village saved on this browser." };
    } catch {
      return {
        ok: false,
        message: "Could not save on this browser. Export a backup in Settings.",
      };
    }
  }
  function clear() {
    localStorage.removeItem(key);
    localStorage.removeItem(backupKey);
  }
  window.VillageStore = {
    read,
    write,
    validate,
    parse,
    clear,
    exportValue: () => latest || read(),
    get lastSaved() {
      return lastSaved;
    },
    key,
  };
  let failed = false;
  window.GameRecovery = {
    get failed() {
      return failed;
    },
    fail(error) {
      if (failed) return;
      failed = true;
      S.paused = true;
      resetTouch();
      S.keys = {};
      acting = false;
      actEdge = false;
      console.error("Game paused after an unexpected error", error);
      screen(
        '<h2>The village needs a moment.</h2><p role="alert">An unexpected error paused the game. Your last good save has been kept.</p><button id="recoverGame">Reload your saved village</button>',
      );
      document.getElementById("recoverGame").onclick = () => location.reload();
    },
  };
})();
