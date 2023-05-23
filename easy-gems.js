const panels = {
  default: 'eg-default-panel',
};

const template = document.createElement('div');
template.classList.add('eg-panel');
template.innerHTML = 
    `<div id="${panels.default}">
        <button id="eg-selection-on" class="btn_large btn_green_white_innerfade"><span>Select items</span></button>
    </div>`;

const inventoryTab = document.getElementById('tabcontent_inventory');
inventoryTab.insertBefore(template, inventoryTab.children[0]);

function activatePanel(id) {
  document.querySelectorAll('.eg-panel div').forEach((x) => { x.style.display = x.id === id ? 'flex' : 'none'; });
}

function inventoryTabChanged() {
  if (g_bViewingOwnProfile && g_ActiveInventory.m_appid === 753) {
    activatePanel(panels.default);
  } else {
    activatePanel('');
  }
}

window.addEventListener('hashchange', () => inventoryTabChanged());
window.addEventListener('load', () => inventoryTabChanged());
