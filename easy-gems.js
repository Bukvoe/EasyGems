const modeIds = {
  default: 'eg-default-panel',
  disabled: '',
  selection: 'eg-selection-panel',
};

const buttons = {
  selectionOn: 'eg-selection-on',
  selectionOff: 'eg-selection-off',
};

const steamAppId = 753;

const template = document.createElement('div');
template.classList.add('eg-panel');
template.innerHTML = `<div id="${modeIds.default}">
        <button id="${buttons.selectionOn}" class="btn_large btn_green_white_innerfade"><span>Select items</span></button>
    </div>
    <div id="${modeIds.selection}">
        <button id="${buttons.selectionOff}" class="btn_large btn_grey_white_innerfade"><span>Cacnel</span></button>
    </div>`;

const inventoryTab = document.getElementById('tabcontent_inventory');
inventoryTab.insertBefore(template, inventoryTab.children[0]);

const itemLoadedClass = 'eg-loaded';

function addEventToNewItems() {
  const newItems = document.querySelectorAll(`.item.app753:not(.${itemLoadedClass})`);

  [].slice.call(newItems).forEach((item, idx) => {
    item.classList.add(itemLoadedClass);

    item.addEventListener('click', () => {
      console.log('Item selected');
    });
  });
}

function changeMode(modeId) {
  switch (modeId) {
    case modeIds.default:
      break;

    case modeIds.selection:
      addEventToNewItems();
      break;

    default:
      break;
  }

  document.querySelectorAll('.eg-panel div').forEach((x) => { x.style.display = x.id === modeId ? 'flex' : 'none'; });
}

let lastActiveInventory = null;

function inventoryTabChanged() {
  if (!g_bViewingOwnProfile || g_ActiveInventory.m_appid !== steamAppId) {
    changeMode(modeIds.disabled);
  } else if (lastActiveInventory !== steamAppId) {
    changeMode(modeIds.default);
  }

  lastActiveInventory = g_ActiveInventory.m_appid;
}

document.getElementById(buttons.selectionOn).addEventListener('click', (e) => changeMode(modeIds.selection));
document.getElementById(buttons.selectionOff).addEventListener('click', (e) => changeMode(modeIds.default));

window.addEventListener('hashchange', () => inventoryTabChanged());
window.addEventListener('load', () => inventoryTabChanged());
