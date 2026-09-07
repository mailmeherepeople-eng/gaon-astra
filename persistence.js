/* Village persistence owns validation, recovery and save results. Journal is separate. */
(() => {
  const key = "gaon-astra-village-v2",
    backupKey = key + "-backup";
  let lastSaved = null,
    latest = null;
  // The same allowlist governs serialization and restoration. Runtime objects,
  // functions, camera state and scene references can never be imported.
  const fields = [
    "day",
    "t",
    "phase",
    "coins",
    "treasury",
    "grain",
    "milk",
    "wood",
    "flour",
    "chairs",
    "pop",
    "happy",
    "approval",
    "rank",
    "age",
    "policies",
    "petitions",
    "buildings",
    "res",
    "homeId",
    "collected",
    "lastElection",
    "subsidy",
    "resolution",
    "problems",
    "sabhaDone",
    "awake",
    "dayThiefDone",
    "reported",
    "night",
    "mandateLost",
    "lastDawn",
    "finishedAtDusk",
  ];
  const record = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const integer = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const knownName = (n) =>
    NAMES.some((v) => v.n === n) || ["Devi Lal", NPC_SARPANCH].includes(n);
  const point = (v) =>
    record(v) &&
    Number.isFinite(v.x) &&
    Number.isFinite(v.y) &&
    v.x >= 0 &&
    v.x <= W &&
    v.y >= 0 &&
    v.y <= H;
  const resolution = (v) =>
    v == null ||
    ["watch", "drain", "cleanup", "doctor", "patwari", "nothing"].includes(v) ||
    (typeof v === "string" &&
      v.startsWith("fund:") &&
      Object.hasOwn(B, v.slice(5)));
  function safeData(v, depth = 0) {
    if (depth > 12) return false;
    if (v == null || typeof v === "boolean") return true;
    if (typeof v === "number") return Number.isFinite(v) && Math.abs(v) <= 1e9;
    if (typeof v === "string") return v.length <= 2000 && !/[<>]/.test(v);
    if (Array.isArray(v))
      return v.length <= 256 && v.every((x) => safeData(x, depth + 1));
    if (!record(v) || Object.keys(v).length > 256) return false;
    return Object.entries(v).every(
      ([k, x]) =>
        !["__proto__", "constructor", "prototype"].includes(k) &&
        !/[<>]/.test(k) &&
        safeData(x, depth + 1),
    );
  }
  function validSummary(v) {
    if (v == null) return true; // Saves made before accounts existed remain compatible.
    if (!record(v)) return false;
    const numbers = [
      "day",
      "happyBefore",
      "happyAfter",
      "approvalBefore",
      "approvalAfter",
      "grain",
      "milk",
      "wood",
      "flour",
      "chairs",
      "eat",
      "spoiled",
      "income",
      "jobs",
      "workers",
      "finished",
    ];
    return (
      numbers.every((k) => Number.isFinite(v[k])) &&
      ["notes", "happyReasons", "approvalReasons"].every(
        (k) => Array.isArray(v[k]) && v[k].every((s) => typeof s === "string"),
      ) &&
      Array.isArray(v.sales) &&
      v.sales.every(
        (s) =>
          record(s) &&
          ["grain", "milk", "wood", "flour", "chairs"].includes(s.k) &&
          Number.isFinite(s.amt) &&
          Number.isFinite(s.got),
      ) &&
      resolution(v.resolution) &&
      (v.age == null ||
        AGES.some((a) => a.n === v.age.n && a.unlock === v.age.unlock))
    );
  }
  function validate(p) {
    if (p?.v !== 2 || !record(p.state) || !record(p.sim) || !safeData(p))
      return false;
    const s = p.sim,
      state = p.state;
    if (
      Object.keys(state).some(
        (k) =>
          ![
            "done",
            "carry",
            "litter",
            "loads",
            "selected",
            "daily",
            "story",
            "told",
          ].includes(k),
      )
    )
      return false;
    if (
      !integer(s.rank, 0, RANKS.length - 1) ||
      !integer(s.age, 0, AGES.length - 1) ||
      !integer(s.day, 1, 1e9) ||
      !integer(s.pop, 0, 256) ||
      !integer(state.loads, 0, 3) ||
      !integer(state.litter, 0, 3) ||
      !integer(state.selected, 0, 4) ||
      !point(s.player) ||
      !["face", "jy", "vy"].every((k) => Number.isFinite(s.player[k]))
    )
      return false;
    if (
      !resolution(s.resolution) ||
      (s.subsidy != null && !Object.hasOwn(B, s.subsidy))
    )
      return false;
    if (s.homeId != null && !["home", "homeM", "homeS"].includes(s.homeId))
      return false;
    if (
      ["collected", "sabhaDone", "dayThiefDone"].some(
        (k) => s[k] !== undefined && typeof s[k] !== "boolean",
      )
    )
      return false;
    if (
      ["mandateLost", "finishedAtDusk"].some(
        (k) => s[k] !== undefined && !integer(s[k], 0, 1e9),
      )
    )
      return false;
    if (!validSummary(s.lastDawn)) return false;
    if (state.daily != null) {
      const d = state.daily;
      if (
        !point(d) ||
        !integer(d.day, 1, 1e9) ||
        !["water", "feed", "truck"].includes(d.id) ||
        !knownName(d.who) ||
        typeof d.done !== "boolean"
      )
        return false;
    }
    if (
      state.told != null &&
      (!record(state.told) ||
        Object.entries(state.told).some(
          ([n, count]) => !knownName(n) || !integer(count, 0, 1e9),
        ))
    )
      return false;
    if (
      !Array.isArray(state.done) ||
      new Set(state.done).size !== state.done.length ||
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
        (v.project && !integer(v.day, 1, 1e9)) ||
        (v.spilled !== undefined && typeof v.spilled !== "boolean")
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
    fields,
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
