/* Phone tools are deliberately opened as a paused screen, keeping the world clear. */
(() => {
  const menu = document.createElement('button');
  menu.id = 'mobileMenu';
  menu.textContent = 'Menu';
  menu.setAttribute('aria-haspopup', 'dialog');
  document.body.appendChild(menu);
  menu.onclick = () => {
    if (S.paused) return;
    VillageLife.save();
    const stats = document.getElementById('hud').innerHTML;
    screen(`<div class="journal-head"><h2>Village menu</h2><button id="mobileResume">Resume ×</button></div><p class="tiny">Paused · Village saved</p><div class="menu-stats">${stats}</div><div class="menu-objective">${mission.innerHTML}</div><div id="mobileTools"></div><p class="tiny">Drag the left half to walk. Drag the right half to look. Use the action button near a neighbour or object.</p>`);
    document.getElementById('mobileResume').onclick = () => { closeScreen(); menu.focus(); };
    const container = document.getElementById('mobileTools');
    toolsBar.querySelectorAll('button').forEach(source => {
      if (source.id === 'pauseVillage') return;
      const button = document.createElement('button');
      button.textContent = source.textContent;
      button.dataset.tool = source.id;
      button.onclick = () => {
        if (source.id === 'soundButton') { source.click(); button.textContent = source.textContent; }
        else { closeScreen(); source.click(); }
      };
      container.appendChild(button);
    });
  };
})();
