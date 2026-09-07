/* Render quality, aggregate instance bounds and shared actor contact shadows. */
(() => {
  const T = THREE,
    qualityKey = "gaon-astra-quality";
  let mode = "auto";
  try {
    mode = localStorage.getItem(qualityKey) || mode;
  } catch {}
  if (!["auto", "low", "high"].includes(mode)) mode = "auto";
  let level = mobileGraphics ? 0 : 2,
    samples = [],
    nextDecision = performance.now() + 12000;
  const profiles = [
    { dpr: 1, shadow: 0 },
    { dpr: 1.25, shadow: 1024 },
    { dpr: 1.5, shadow: 2048 },
  ];
  const bounded = new WeakSet();
  function boundInstances(root) {
    root.traverse((m) => {
      if (!m.isInstancedMesh || bounded.has(m)) return;
      // Geometry may be shared by identical tree clones. Unioning bounds is conservative
      // for every owner and does not duplicate GPU buffers (r128 reads geometry bounds).
      const g = m.geometry,
        base =
          g.userData.instanceBaseSphere ||
          (() => {
            g.computeBoundingSphere();
            return g.boundingSphere.clone();
          })();
      g.userData.instanceBaseSphere = base;
      const box = new T.Box3(),
        matrix = new T.Matrix4(),
        sphere = new T.Sphere(),
        lo = new T.Vector3(),
        hi = new T.Vector3();
      for (let i = 0; i < m.count; i++) {
        m.getMatrixAt(i, matrix);
        sphere.copy(base).applyMatrix4(matrix);
        lo.copy(sphere.center).addScalar(-sphere.radius);
        hi.copy(sphere.center).addScalar(sphere.radius);
        box.expandByPoint(lo);
        box.expandByPoint(hi);
      }
      if (g.userData.instanceBox) box.union(g.userData.instanceBox);
      g.userData.instanceBox = box;
      g.boundingSphere = box.getBoundingSphere(new T.Sphere());
      // Also assign object bounds for newer Three.js revisions.
      m.boundingSphere = g.boundingSphere.clone();
      m.boundingBox = box.clone();
      m.frustumCulled = true;
      bounded.add(m);
    });
  }
  boundInstances(scene);
  function apply() {
    const p = profiles[level];
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, p.dpr));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = !!p.shadow;
    // Concentrate the shadow budget around the player instead of a 180 m square.
    const reach = level === 2 ? 32 : 24;
    Object.assign(sun.shadow.camera, {
      left: -reach,
      right: reach,
      top: reach,
      bottom: -reach,
    });
    sun.shadow.camera.updateProjectionMatrix();
    for (const root of [
      scene,
      ...(typeof ROOMS !== "undefined"
        ? [...ROOMS.values()].map((r) => r.scene)
        : []),
    ])
      root.traverse((o) => {
        if (!o.shadow) return;
        if (o.shadow.map) {
          o.shadow.map.dispose();
          o.shadow.map = null;
        }
        o.shadow.mapSize.set(p.shadow || 512, p.shadow || 512);
        o.shadow.needsUpdate = true;
      });
    renderer.shadowMap.needsUpdate = true;
  }
  function set(next) {
    mode = next;
    level = mode === "low" ? 0 : mode === "high" ? 2 : mobileGraphics ? 0 : 2;
    samples = [];
    nextDecision = performance.now() + 12000;
    try {
      localStorage.setItem(qualityKey, mode);
    } catch {}
    apply();
  }
  function sample(ms, now) {
    if (mode !== "auto" || S.paused || document.hidden || ms <= 0 || ms > 250) {
      samples = [];
      return;
    }
    samples.push(ms);
    if (samples.length > 180) samples.shift();
    if (now < nextDecision || samples.length < 120) return;
    const sorted = [...samples].sort((a, b) => a - b),
      p75 = sorted[Math.floor(sorted.length * 0.75)];
    if (p75 > 24 && level > 0) {
      level--;
      apply();
    }
    // Deliberately only step down during a session. Auto can be reset in Settings.
    samples = [];
    nextDecision = now + 15000;
  }
  window.GraphicsQuality = {
    set,
    sample,
    boundInstances,
    get mode() {
      return mode;
    },
    get level() {
      return level;
    },
  };
  set(mode);
  addEventListener("resize", apply);
  // New construction and growing populations are bounded when first synchronized.
  const oldBuilding = buildingMesh;
  buildingMesh = function (...args) {
    const g = oldBuilding(...args);
    boundInstances(g);
    return g;
  };
  const blobGeometry = new T.PlaneGeometry(1, 1),
    blobMaterial = WorldArt.P.shadow;
  const blobs = new WeakMap();
  function contact(actor, width = 1) {
    let blob = blobs.get(actor);
    if (!blob) {
      blob = new T.Mesh(blobGeometry, blobMaterial.clone());
      blob.rotation.x = -Math.PI / 2;
      blob.renderOrder = 2;
      scene.add(blob);
      blobs.set(actor, blob);
    }
    const interiorPlayer = actor === playerMesh && S.scene === "interior";
    const parent = interiorPlayer ? S.room.scene : scene;
    if (blob.parent !== parent) parent.add(blob);
    blob.visible =
      (S.scene === "village" || interiorPlayer) &&
      actor.visible &&
      !renderer.shadowMap.enabled;
    if (blob.visible) {
      const p = actor.position,
        y = interiorPlayer ? 0 : groundY(p.x, p.z);
      blob.position.set(p.x, y + (interiorPlayer ? 0.04 : 0.13), p.z);
      const lift = Math.max(0, p.y - y);
      blob.scale.setScalar(width / (1 + lift * 0.25));
      blob.material.opacity = 1 / (1 + lift * 0.8);
    }
  }
  GameSystems.beforeRender.push(function updateContacts() {
    contact(playerMesh, 1.15);
    vil.forEach((m) => contact(m, 1));
    cows.forEach((m) => contact(m, 2));
    chickens.forEach((m) => contact(m, 0.5));
  });
  function settings() {
    const result = VillageLife.save();
    screen(
      `<div class="journal-head"><h2>Settings & saves</h2><button id="settingsBack">Resume ×</button></div><p role="status">${esc(result.message)}</p><label for="qualitySelect">Graphics quality</label><select id="qualitySelect"><option value="auto">Auto · adapts to performance</option><option value="low">Low · lighter graphics</option><option value="high">High · richer shadows</option></select><label for="cameraZoom">Camera distance</label><input id="cameraZoom" type="range" min="4" max="35" value="${Math.min(cam.dist, 35)}"><button id="runSetting" class="ghost">${S.autoRun ? "Walk" : "Run"} while moving</button><button id="exportVillage" class="ghost">Export village backup</button><label for="importVillage">Restore a village backup (replaces this village)</label><input id="importVillage" type="file" accept="application/json,.json"><p id="importStatus" role="status"></p><p class="source">Use your browser zoom to enlarge text. On touchscreens, drag left to move and right to look. The journal keeps recent conversations.</p>`,
      true,
    );
    document.getElementById("settingsBack").onclick = closeScreen;
    const select = document.getElementById("qualitySelect");
    select.value = mode;
    select.onchange = () => set(select.value);
    document.getElementById("cameraZoom").oninput = (e) => {
      cam.dist = +e.target.value;
      cam.pitch = Math.max(cam.pitch, pitchMin(cam.dist));
    };
    document.getElementById("runSetting").onclick = (e) => {
      S.autoRun = !S.autoRun;
      e.target.textContent = (S.autoRun ? "Walk" : "Run") + " while moving";
    };
    document.getElementById("exportVillage").onclick = () => {
      VillageLife.save();
      const value = VillageStore.exportValue();
      if (!value) {
        document.getElementById("importStatus").textContent =
          "No village is available yet.";
        return;
      }
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(value, null, 2)], {
          type: "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "gaon-astra-village.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    document.getElementById("importVillage").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2000000) {
        document.getElementById("importStatus").textContent =
          "This backup is too large.";
        return;
      }
      const value = VillageStore.parse(await file.text());
      if (!value) {
        document.getElementById("importStatus").textContent =
          "This is not a valid village backup.";
        return;
      }
      const result = VillageStore.write(value);
      document.getElementById("importStatus").textContent = result.message;
      if (result.ok) {
        S.over = true;
        screen(
          '<h2>Your backup is ready.</h2><p>Reload to continue from the restored village. Your journal has been kept.</p><button id="restoreReady">Continue restored village</button>',
        );
        document.getElementById("restoreReady").onclick = () =>
          location.reload();
      }
    };
  }
  const button = document.createElement("button");
  button.id = "settingsButton";
  button.textContent = "Settings & saves";
  button.onclick = settings;
  toolsBar.appendChild(button);
})();
