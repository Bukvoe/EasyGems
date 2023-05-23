const panels = {
  default: 'eg-default-panel',
  selection: 'eg-selection-panel',
};

const buttons = {
  selectionOn: 'eg-selection-on',
  selectionOff: 'eg-selection-off',
};

const steamAppId = 753;

const template = document.createElement('div');
template.classList.add('eg-panel');
template.innerHTML = 
    `<div id="${panels.default}">
        <button id="${buttons.selectionOn}" class="btn_large btn_green_white_innerfade"><span>Select items</span></button>
    </div>
    <div id="${panels.selection}">
        <button id="${buttons.selectionOff}" class="btn_large btn_grey_white_innerfade"><span>Cacnel</span></button>
    </div>`;

const inventoryTab = document.getElementById('tabcontent_inventory');
inventoryTab.insertBefore(template, inventoryTab.children[0]);

function activatePanel(id) {
  document.querySelectorAll('.eg-panel div').forEach((x) => { x.style.display = x.id === id ? 'flex' : 'none'; });
}

let lastActiveInventory = null;

function inventoryTabChanged() {
  if (!g_bViewingOwnProfile || g_ActiveInventory.m_appid !== steamAppId) {
    activatePanel('');
  } else if (lastActiveInventory !== steamAppId) {
    activatePanel(panels.default);
  }

  lastActiveInventory = g_ActiveInventory.m_appid;
}

document.getElementById(buttons.selectionOn).addEventListener('click', (e) => activatePanel(panels.selection));
document.getElementById(buttons.selectionOff).addEventListener('click', (e) => activatePanel(panels.default));

window.addEventListener('hashchange', () => inventoryTabChanged());
window.addEventListener('load', () => inventoryTabChanged());
