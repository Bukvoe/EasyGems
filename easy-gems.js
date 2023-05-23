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

let activeMode = modeIds.default;

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

const itemSelectedClass = 'eg-selected';

function isConvertible(assetId) {
  const asset = g_ActiveInventory.m_rgAssets[assetId];
  const ownerActions = asset?.description.owner_actions;

  if (!ownerActions) {
    return false;
  }

  const convertAction = ownerActions.find((x) => x.link.includes('GetGooValue'));

  return !!convertAction;
}

const gemsValueAttribute = 'eg-gems-value';

function setValue(item, value) {
  item.setAttribute(gemsValueAttribute, value);
}

function getValue(item) {
  return item.getAttribute(gemsValueAttribute);
}

function hasValue(item) {
  return !!item.getAttribute(gemsValueAttribute);
}

function deselectItem(item) {
  if (!hasValue(item)) {
    return;
  }

  item.classList.remove(itemSelectedClass);

  item.querySelector('a').textContent = '';
}

async function itemInfoByAssetId(assetId) {
  const asset = g_ActiveInventory.m_rgAssets[assetId];
  const ownerActions = asset.description.owner_actions;
  const { link } = ownerActions.find((x) => x.link.includes('GetGooValue'));
  const appid = link.match(/GetGooValue\(.*,.*, *'?([0-9]+)'? *,.*,.*/)[1];

  return {
    appid,
    contextid: asset.contextid,
    assetid: asset.assetid,
  };
}

async function getGemsValue(itemInfo) {
  const params = new URLSearchParams(itemInfo);
  params.append('sessionid', g_sessionID);

  return fetch(`${g_strProfileURL}/ajaxgetgoovalue/?${params.toString()}`, {
    method: 'GET',
  })
    .then((response) => {
      if (!response.ok) {
        resolve(0);
      }

      return response.json();
    })
    .then((item) => item.goo_value)
    .catch((err) => 0);
}

async function grindIntoGems(itemInfo) {
  let params = [];

  for (const x in itemInfo) {
    const key = encodeURIComponent(x);
    const value = encodeURIComponent(itemInfo[x]);

    params.push(`${key}=${value}`);
  }

  params.sessionid = g_sessionID;

  params = params.join('&');

  const response = await fetch(`${g_strProfileURL}/ajaxgrindintogoo/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: params,
  });

  return response;
}

function applySelection(item) {
  item.classList.add(itemSelectedClass);

  const itemCost = getValue(item);
  item.style.background = `url(${item.querySelector('img').src})`;
  item.querySelector('a').textContent = `+${itemCost}`;
}

function selectItem(item) {
  const assetId = item.id.split('_')[2];

  if (!isConvertible(assetId)) {
    return;
  }

  if (hasValue(item)) {
    applySelection(item);

    return;
  }

  itemInfoByAssetId(assetId)
    .then((itemInfo) => {
      getGemsValue(itemInfo).then((value) => {
        if (value < 1) {
          return;
        }

        setValue(item, value);
        applySelection(item);
      });
    });
}

function handleItemClick(item) {
  item.classList.contains(itemSelectedClass) ? deselectItem(item) : selectItem(item);
}

const itemLoadedClass = 'eg-loaded';

function addEventToNewItems() {
  const newItems = document.querySelectorAll(`.item.app753:not(.${itemLoadedClass})`);

  [].slice.call(newItems).forEach((item, idx) => {
    item.classList.add(itemLoadedClass);

    item.addEventListener('click', () => {
      handleItemClick(item);
    });
  });
}

function changeMode(modeId) {
  activeMode = modeId;

  switch (activeMode) {
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

const observer = new MutationObserver((mutationList) => {
  if (activeMode === modeIds.selection
        && mutationList[0].addedNodes.length > 0
        && mutationList[0].addedNodes[0].className === 'inventory_page') {
    addEventToNewItems();
  }
});

observer.observe(document.querySelector('.inventory_ctn'), { childList: true, subtree: true });

document.getElementById(buttons.selectionOn).addEventListener('click', (e) => changeMode(modeIds.selection));
document.getElementById(buttons.selectionOff).addEventListener('click', (e) => changeMode(modeIds.default));

window.addEventListener('hashchange', () => inventoryTabChanged());
window.addEventListener('load', () => inventoryTabChanged());
