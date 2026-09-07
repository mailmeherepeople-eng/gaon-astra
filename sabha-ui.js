/* Sabha dialogue is ordinary speech. Only the vote needs a compact choice panel. */
(() => {
  const panel = document.createElement("aside");
  panel.id = "sabhaPanel";
  panel.className = "sabha-panel hidden";
  panel.setAttribute("aria-label", "Night Sabha voting");
  document.body.appendChild(panel);
  let speechReserve = 0;
  const measure = () => {
    if (panel.offsetHeight)
      speechReserve =
        panel.offsetHeight + parseFloat(getComputedStyle(panel).bottom) + 12;
  };
  new ResizeObserver(measure).observe(panel);
  addEventListener("resize", measure);
  let day = 0,
    entries = [],
    next = 0,
    dismissed = true,
    ownTalk = null,
    observedTalk = null;
  function valid() {
    return day === S.day && S.phase === "night" && !S.sabhaDone;
  }
  function close() {
    dismissed = true;
    panel.classList.add("hidden");
    if (S.talking === ownTalk) S.talking = null;
  }
  function hearNext() {
    if (!entries.length || !valid()) return;
    const choices = panel.querySelector("details");
    if (choices) choices.open = false;
    const entry = entries[next++ % entries.length];
    let anchor = null;
    if (S.scene === "interior" && S.room?.building.id === "panchayat") {
      const position = S.room.sabhaSeats?.[entries.indexOf(entry)];
      if (position)
        anchor = { x: position.x, y: position.y + 1.65, z: position.z };
    }
    const who = S.villagers.find((v) => v.n === entry.n) || entry;
    speak(who, entry.line, anchor, true);
    ownTalk = S.talking;
  }
  function present(html, collapsed = false) {
    dismissed = false;
    panel.innerHTML = `<div class="sabha-head"><strong>Night Sabha</strong><button id="sabhaListen">Hear next</button><button id="sabhaClose" aria-label="Leave the Sabha discussion">×</button></div><details ${collapsed ? "" : "open"}><summary id="sabhaVoteToggle">Vote & results</summary><div class="sabha-content">${html}</div></details>`;
    panel.classList.remove("hidden");
    panel.querySelector("#sabhaClose").onclick = close;
    panel.querySelector("#sabhaListen").onclick = hearNext;
    // Looking and moving continue; clicking a choice must not capture the mouse.
    if (document.pointerLockElement) document.exitPointerLock();
  }
  window.VillageSabha = {
    get speechReserve() {
      return panel.classList.contains("hidden") ? 0 : speechReserve;
    },
    element: panel,
    present,
    close,
    start(speakers) {
      day = S.day;
      entries = speakers;
      next = 0;
      hearNext();
    },
    resume() {
      if (!valid() || !panel.children.length) return false;
      dismissed = false;
      panel.classList.remove("hidden");
      if (document.pointerLockElement) document.exitPointerLock();
      return true;
    },
  };
  GameSystems.beforeRender.push(() => {
    if (!valid()) {
      close();
      return;
    }
    const elsewhere =
      S.scene !== "interior" || S.room?.building.id !== "panchayat";
    if (S.talking && S.talking !== observedTalk && S.talking !== ownTalk) {
      const choices = panel.querySelector("details");
      if (choices) choices.open = false;
    }
    observedTalk = S.talking;
    panel.classList.toggle(
      "hidden",
      dismissed || S.paused || S.asleep || elsewhere,
    );
    if (promptKey?.startsWith("seat"))
      promptEl.classList.toggle("hidden", !dismissed && !elsewhere);
    // A speaker's room coordinates must not follow the player outside the hall.
    if (elsewhere && S.talking === ownTalk) S.talking = null;
  });
})();
