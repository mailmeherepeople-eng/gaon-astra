/* Additive Gaon Astra layer: the original 3D simulation owns movement,
   building, interiors, economy, policy, elections and day/night events. */
let astraTime = 0;
const ASTRA_KEY = "gaon-astra-learning-v1";
let book = {
  read: [],
  correct: [],
  discovered: [],
  journal: [],
  drafts: {},
  marks: {},
};
try {
  const v = JSON.parse(localStorage.getItem(ASTRA_KEY));
  if (
    v &&
    Array.isArray(v.read) &&
    Array.isArray(v.correct) &&
    Array.isArray(v.discovered) &&
    Array.isArray(v.journal)
  )
    book = { ...book, ...v };
} catch {}
let bookSaveTimer;
function flushBook() {
  clearTimeout(bookSaveTimer);
  try {
    localStorage.setItem(ASTRA_KEY, JSON.stringify(book));
  } catch {
    logEl.textContent = "Journal could not be saved on this browser.";
  }
}
const saveBook = () => {
  clearTimeout(bookSaveTimer);
  bookSaveTimer = setTimeout(flushBook, 350);
};
addEventListener("pagehide", flushBook);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushBook();
});
const esc = (t) =>
  String(t).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const originalLog = log;
log = function (html) {
  originalLog(html);
  book.journal.push({ day: S.day, text: html.replace(/<[^>]*>/g, "") });
  book.journal = book.journal.slice(-80);
  saveBook();
};
const toolsBar = document.createElement("nav");
toolsBar.className = "astra-tools";
toolsBar.setAttribute("aria-label", "Village tools");
toolsBar.innerHTML =
  '<button id="journalButton">Field journal · J</button><button id="trailsButton">Village trails</button>';
document.body.appendChild(toolsBar);
const soundButton = document.createElement("button");
soundButton.id = "soundButton";
toolsBar.appendChild(soundButton);
function soundLabel() {
  soundButton.textContent = Gaon.audio.muted ? "Sound off" : "Sound on";
  soundButton.setAttribute("aria-pressed", String(!Gaon.audio.muted));
}
soundLabel();
soundButton.onclick = () => {
  Gaon.audio.toggle();
  soundLabel();
};
document.addEventListener("click", (e) => {
  if (e.target.closest("button") && e.target.id !== "soundButton")
    Gaon.audio.play("click");
});
document.addEventListener("visibilitychange", () => {
  if (Gaon.audio.context) {
    if (document.hidden) Gaon.audio.context.suspend();
    else Gaon.audio.context.resume();
  }
});
const mission = document.createElement("aside");
mission.className = "mission";
document.body.appendChild(mission);
let selectedChapter = 11,
  journalOpen = false,
  returnFocus = null;
const baseClose = closeScreen;
closeScreen = function () {
  journalOpen = false;
  baseClose();
  S.keys = {};
  acting = false;
  actEdge = false;
  if (returnFocus) {
    returnFocus.focus();
    returnFocus = null;
  }
};
const baseScreen = screen;
screen = function (html, wide) {
  baseScreen(html, wide);
  const card = ov.firstElementChild;
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute(
    "aria-label",
    card.querySelector("h1,h2")?.textContent || "Village decision",
  );
  requestAnimationFrame(() => card.querySelector("button,textarea")?.focus());
};
function journalShell(content) {
  screen(
    `<div class="journal-head"><div><span class="eyebrow">LAKSHMANPUR / FIELD JOURNAL</span><h2>Your village, understood.</h2></div><button id="closeJournal" class="ghost">Back to village ×</button></div><div class="journal-layout"><nav class="chapter-nav" aria-label="Chapters">${ASTRA_CHAPTERS.map((c) => `<button data-ch="${c[0]}" class="${selectedChapter === c[0] ? "selected" : ""}">${c[0]} / ${c[1]}</button>`).join("")}<button data-ch="story">Village memories</button></nav><section class="lesson-copy">${content}</section></div>`,
    true,
  );
  journalOpen = true;
  document.getElementById("closeJournal").onclick = closeScreen;
  ov.querySelectorAll("[data-ch]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedChapter =
          b.dataset.ch === "story" ? "story" : Number(b.dataset.ch);
        openJournal();
      }),
  );
}
function openJournal() {
  if (!journalOpen) returnFocus = document.activeElement;
  if (selectedChapter === "story") {
    journalShell(
      `<h3>Things that happened here</h3><p class="source">Your recent village stories stay here after the toast disappears.</p>${
        book.journal
          .slice()
          .reverse()
          .map(
            (e) =>
              `<div class="journal-log"><span class="eyebrow">DAY ${e.day}</span><p>${esc(e.text)}</p></div>`,
          )
          .join("") || "<p>Your first village memory is waiting to happen.</p>"
      }`,
    );
    return;
  }
  const ch = ASTRA_CHAPTERS.find((c) => c[0] === selectedChapter),
    ls = ASTRA_LESSONS.filter((l) => l.ch === selectedChapter),
    done = ls.filter((l) => book.correct.includes(l.id)).length;
  journalShell(
    `<span class="eyebrow">CHAPTER ${ch[0]} · ${ch[2]}</span><h3>${ch[1]}</h3><p>Follow your curiosity. These notes connect village life to the textbook. Practice is optional and never blocks play.</p><div class="progress-track"><i style="width:${(done / ls.length) * 100}%"></i></div><p class="source">${done}/${ls.length} recall checks answered correctly · Reading and self-marked answers are tracked separately.</p><div class="lesson-grid">${ls.map((l) => `<button data-lesson="${l.id}"><small>${book.correct.includes(l.id) ? "✓ RECALL CHECKED" : book.read.includes(l.id) ? "READ · READY TO REVISIT" : "EXPLORE"}</small>${l.title}</button>`).join("")}</div><p class="source">Based on your supplied NCERT Exploring Society: India and Beyond, Class 6. The game covers chapters 9–14; geography, history and culture chapters are outside this game.</p>`,
  );
  ov.querySelectorAll("[data-lesson]").forEach(
    (b) => (b.onclick = () => openLesson(b.dataset.lesson)),
  );
}
function openLesson(id) {
  const l = ASTRA_LESSONS.find((l) => l.id === id);
  selectedChapter = l.ch;
  if (!book.read.includes(id)) {
    book.read.push(id);
    saveBook();
  }
  journalShell(
    `<span class="eyebrow">CHAPTER ${l.ch} / VILLAGE NOTE</span><h3>${l.title}</h3><p>${l.text}</p><div class="village-example"><b>Here in Lakshmanpur</b><p>${l.example}</p></div><p class="source">Source: supplied textbook, chapter ${l.ch}, ${ASTRA_CHAPTERS.find((c) => c[0] === l.ch)[2]}. Game coins, time, elections and population milestones are simplified play rules.</p><button id="recall">Try a quick recall check</button><button id="write" class="ghost">Practise a written answer</button><button id="chapterBack" class="ghost">All chapter notes</button>`,
  );
  document.getElementById("recall").onclick = () => recall(l);
  document.getElementById("write").onclick = () => writeAnswer(l);
  document.getElementById("chapterBack").onclick = openJournal;
}
function recall(l) {
  const choices = [
    { t: l.points[0], yes: true },
    ...l.wrong.map((t) => ({ t, yes: false })),
  ].sort(() => Math.random() - 0.5);
  journalShell(
    `<span class="eyebrow">RECALL / ${l.title}</span><h3>Which statement is accurate?</h3><div class="policies">${choices.map((c, i) => `<button class="pol" data-answer="${i}">${c.t}</button>`).join("")}</div><div id="feedback" aria-live="polite"></div><button id="noteBack" class="ghost">Return to explanation</button>`,
  );
  ov.querySelectorAll("[data-answer]").forEach(
    (b) =>
      (b.onclick = () => {
        const c = choices[Number(b.dataset.answer)];
        if (c.yes && !book.correct.includes(l.id)) {
          book.correct.push(l.id);
          saveBook();
        }
        document.getElementById("feedback").innerHTML =
          `<div class="answer-feedback ${c.yes ? "" : "wrong"}"><b>${c.yes ? "That’s right." : "Reconsider this one."}</b><p>${c.yes ? l.points.join(" ") : l.text}</p>${c.yes ? "" : "<small>You can try another answer. A wrong answer costs no coins.</small>"}</div>`;
      }),
  );
  document.getElementById("noteBack").onclick = () => openLesson(l.id);
}
function writeAnswer(l) {
  journalShell(
    `<span class="eyebrow">EXAM PRACTICE / SELF-MARKED</span><h3>${l.question}</h3><p>Try this without the note. Then compare your answer with the three marking points.</p><label for="written">Your answer</label><textarea id="written" placeholder="Explain in your own words…">${esc(book.drafts[l.id] || "")}</textarea><button id="reveal">Show marking points</button><div id="marking"></div><button id="noteBack" class="ghost">Back to note</button>`,
  );
  document.getElementById("written").oninput = (e) => {
    book.drafts[l.id] = e.target.value;
    saveBook();
  };
  document.getElementById("reveal").onclick = () => {
    document.getElementById("marking").innerHTML =
      `<div class="mark-points"><p>Tick only the points your answer included. This is your self-assessment, not automatic grading.</p>${l.points.map((p, i) => `<label><input type="checkbox" data-mark="${i}" ${(book.marks[l.id] || []).includes(i) ? "checked" : ""}> ${p}</label>`).join("")}</div>`;
    ov.querySelectorAll("[data-mark]").forEach(
      (x) =>
        (x.onchange = () => {
          book.marks[l.id] = [
            ...ov.querySelectorAll("[data-mark]:checked"),
          ].map((x) => Number(x.dataset.mark));
          saveBook();
        }),
    );
  };
  document.getElementById("noteBack").onclick = () => openLesson(l.id);
}
document.getElementById("journalButton").onclick = () => {
  if (!S.paused) openJournal();
};
addEventListener("keydown", (e) => {
  if (e.target.matches("textarea,input")) return;
  if (e.key.toLowerCase() === "j") {
    if (journalOpen) closeScreen();
    else if (!S.paused) openJournal();
  }
  if (e.key === "Escape" && journalOpen) closeScreen();
  if (e.key === "Tab" && S.paused) {
    const els = [
      ...ov.querySelectorAll("button,textarea,input,select,a[href]"),
    ].filter((e) => !e.disabled);
    if (!els.length) return;
    const first = els[0],
      last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Signs are drawn locally; all 3D assets remain available without a CDN.
function villageSign(text, w = 2.7) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f4e4ba";
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = "#a35135";
  ctx.lineWidth = 12;
  ctx.strokeRect(9, 9, 494, 174);
  ctx.fillStyle = "#344633";
  ctx.font = "bold 36px Georgia";
  ctx.textAlign = "center";
  text.split("|").forEach((t, i) => ctx.fillText(t, 256, 76 + i * 51));
  const g = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(w, w * 0.375, 0.1),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) }),
  );
  board.position.y = 1.9;
  g.add(board);
  g.add(box(0.12, 2.25, 0.12, M.trunk, 0, 1.125, 0));
  return g;
}
const sign = villageSign("ग्राम सभा | LAKSHMANPUR");
sign.position.set(121, groundY(121, 88), 88);
scene.add(sign);
SOLIDS.push({ x: 1210, z: 880, r: 7 });
const pumpSign = villageSign("पानी | WATER", 1.5);
pumpSign.position.set(115.4, groundY(115.4, 76), 76);
scene.add(pumpSign);
const garden = new THREE.Group();
garden.position.set(109, groundY(109, 81.5), 81.5);
garden.add(box(2.5, 0.12, 1.8, M.mud, 0, 0.08, 0));
for (let i = 0; i < 4; i++) {
  const tr = tree(0.24);
  tr.position.set(((i % 2) - 0.5) * 1.3, 0, (Math.floor(i / 2) - 0.5) * 0.9);
  garden.add(tr);
}
scene.add(garden);
const litter = new THREE.Group();
litter.position.set(139.5, groundY(139.5, 101), 101);
for (let i = 0; i < 8; i++) {
  const b = box(
    0.14,
    0.05,
    0.21,
    i % 2 ? M.cream : M.plastic,
    Math.sin(i * 3) * 0.8,
    0.08,
    Math.cos(i * 2) * 0.6,
  );
  b.rotation.y = i;
  litter.add(b);
}
scene.add(litter);
const sacks = new THREE.Group();
sacks.position.set(133, 1.1, 88);
for (let i = 0; i < 3; i++) {
  const a = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), M.straw);
  a.scale.y = 1.3;
  a.position.set((i - 1) * 0.55, 0.4, 0);
  sacks.add(a);
}
sacks.visible = false;
scene.add(sacks);
function surfaceTexture(kind) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.fillStyle = kind === "tile" ? "#efb28b" : "#fff7e8";
  x.fillRect(0, 0, 128, 128);
  if (kind === "tile") {
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 8; col++) {
        x.fillStyle = (row + col) % 3 ? "#c48462" : "#e7a17a";
        x.fillRect(col * 16 + (row % 2) * 8, row * 16, 14, 14);
        x.fillStyle = "#f5bc91";
        x.fillRect(col * 16 + (row % 2) * 8, row * 16, 2, 13);
      }
  } else {
    for (let i = 0; i < 1200; i++) {
      x.fillStyle = i % 2 ? "#bcae8d0c" : "#fffdfa22";
      x.fillRect((i * 37) % 128, (i * 61) % 128, 2, 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(kind === "tile" ? 3 : 2, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
M.khaprail.map = surfaceTexture("tile");
M.khaprail.needsUpdate = true;
const plaster = surfaceTexture("plaster");
for (const m of [M.wall, M.whitewash, M.ochre, M.bluewash, M.pink, M.cream]) {
  m.map = plaster;
  m.needsUpdate = true;
}
// Domestic detail: woven charpais, terracotta pots, white borders and cotton lines.
const makeBuilding = buildingMesh;
buildingMesh = function (id, b) {
  const g = makeBuilding(id, b);
  if (["house", "home", "homeM", "homeS"].includes(id)) {
    const seed = seedOf(b);
    g.add(box(3.9, 0.04, 0.55, M.whitewash, 0, 0.04, 3.2));
    for (let i = 0; i < 5; i++) {
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.06, 8),
        M.whitewash,
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set((i - 2) * 0.2, 0.06, 3.5);
      g.add(dot);
    }
    pot(g, 2.4, 2.4, 0.8);
    pot(g, 2.75, 2.3, 0.6);
    charpai(g, -3, 1.7, Math.PI / 2);
    for (const x of [-2.7, 2.7])
      g.add(box(0.07, 2.4, 0.07, M.trunk, x, 1.2, -2.7));
    g.add(box(5.4, 0.025, 0.025, M.cream, 0, 2.3, -2.7));
    for (let i = 0; i < 3; i++)
      g.add(
        box(
          0.7,
          0.8,
          0.035,
          M.cloths[(i + Math.floor(seed * 7)) % 8],
          i - 0.9,
          1.9,
          -2.7,
        ),
      );
  }
  return g;
};
// Recognisable cattle: muzzle, ears, hooves, hump, eyes and a small bell.
cows.forEach((c, i) => {
  c.add(box(0.34, 0.23, 0.48, M.cowBrown, 1.32, 1.05, 0));
  for (const z of [-0.29, 0.29]) {
    c.add(box(0.32, 0.12, 0.24, M.cowWhite, 0.98, 1.35, z));
    c.add(box(0.06, 0.06, 0.035, M.trunkDark, 1.17, 1.3, z * 0.8));
  }
  const hump = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 6),
    i < 2 ? M.cowWhite : M.cowBrown,
  );
  hump.position.set(0.45, 1.36, 0);
  c.add(hump);
  c.add(box(0.09, 0.14, 0.12, M.roofGold, 0.85, 0.65, 0));
  c.userData.legs = c.children.slice(4, 8);
});
const chickens = [];
for (let i = 0; i < 9; i++) {
  const g = new THREE.Group(),
    feather = i % 3 ? M.cream : M.cowBrown;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 9, 7), feather);
  body.scale.set(1, 1, 1.4);
  body.position.y = 0.36;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 8, 6), feather);
  head.position.set(0, 0.64, 0.24);
  g.add(head);
  g.add(box(0.07, 0.075, 0.16, M.roofGold, 0, 0.63, 0.37));
  g.add(box(0.08, 0.09, 0.15, M.pumpRed, 0, 0.79, 0.24));
  for (const x of [-0.1, 0.1]) {
    g.add(box(0.022, 0.2, 0.022, M.roofGold, x, 0.1, 0));
    g.add(box(0.028, 0.025, 0.12, M.roofGold, x, 0.02, 0.04));
    g.add(box(0.025, 0.03, 0.03, M.trunkDark, x, 0.67, 0.32));
  }
  const tail = box(0.14, 0.28, 0.06, feather, 0, 0.49, -0.29);
  tail.rotation.x = -0.5;
  g.add(tail);
  const x = 136 + (i % 3) * 1.3,
    z = 94 + Math.floor(i / 3) * 1.5;
  g.position.set(x, groundY(x, z), z);
  g.userData = { home: { x, z }, phase: i, chicken: true };
  scene.add(g);
  chickens.push(g);
}
function safeAnimal(x, z) {
  return (
    x > 4 &&
    x < 210 &&
    z > 4 &&
    z < 186 &&
    !S.buildings.some(
      (b) =>
        !["field", "road", "embank"].includes(b.id) &&
        Math.hypot(x - U(b.x), z - U(b.y)) < FOOT[b.id] + 0.8,
    ) &&
    !SOLIDS.some((o) => Math.hypot(x - o.x / 10, z - o.z / 10) < o.r / 10 + 0.4)
  );
}
function updateAstraWorld(dt) {
  astraTime += dt;
  const t = astraTime;
  pumpHandle.rotation.z = t < pumpUntil ? Math.sin(t * 9) * 0.5 : 0.5;
  pumpStream.visible = t < pumpUntil;
  if (Gaon.audio.context) {
    if (Gaon.audio.phase !== S.phase) {
      Gaon.audio.setPhase(S.phase);
      Gaon.audio.play(S.phase === "night" ? "dusk" : "dawn");
    }
    if (S.player.moving && dt) Gaon.audio.play("step");
  }
  if (S.scene === "village")
    for (const a of [...cows, ...chickens]) {
      const d = a.userData,
        h = d.home,
        hen = !!d.chicken;
      let tx = h.x + Math.sin(t * 0.13 + d.phase) * (hen ? 2.2 : 3),
        tz = h.z + Math.cos(t * 0.11 + d.phase) * (hen ? 2 : 2.5);
      const friendly = t < (d.friendlyUntil || 0);
      if (friendly) {
        tx = U(S.player.x);
        tz = U(S.player.y);
      }
      const dx = tx - a.position.x,
        dz = tz - a.position.z,
        len = Math.hypot(dx, dz),
        speed = hen ? 0.7 : 0.32;
      const moving = len > (friendly ? 1.4 : 0.18);
      if (moving && dt) {
        const nx = a.position.x + (dx / len) * speed * dt,
          nz = a.position.z + (dz / len) * speed * dt;
        if (safeAnimal(nx, nz)) {
          a.position.x = nx;
          a.position.z = nz;
          const wanted = Math.atan2(dx, dz),
            turn = Math.atan2(
              Math.sin(wanted - a.rotation.y),
              Math.cos(wanted - a.rotation.y),
            );
          a.rotation.y += turn * Math.min(1, dt * 3);
        }
      }
      a.position.y =
        groundY(a.position.x, a.position.z) +
        (hen && moving ? Math.abs(Math.sin(t * 12 + d.phase)) * 0.035 : 0);
      if (hen)
        a.children[1].rotation.x = friendly
          ? Math.sin(t * 9) * 0.35
          : Math.sin(t * 2) * 0.1;
      else {
      }
    }
  if (garden.userData.watered)
    garden.children.slice(1).forEach((g) => g.scale.setScalar(1.25));
  mission.style.display = S.paused || S.scene !== "village" ? "none" : "";
  toolsBar.style.visibility = S.paused ? "hidden" : "visible";
}
window.AstraDebug = {
  book,
  cows,
  chickens,
  playerMesh,
  vil,
  openJournal,
  openLesson,
  get garden() {
    return garden;
  },
  get litter() {
    return litter;
  },
  get pumpStream() {
    return pumpStream;
  },
};
