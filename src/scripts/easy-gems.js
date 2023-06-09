const modeIds = {
  default: 'eg-default-panel',
  disabled: '',
  selection: 'eg-selection-panel',
  conversion: 'eg-conversion-panel',
};

const buttons = {
  convert: 'eg-convert',
  selectionOn: 'eg-selection-on',
  selectionOff: 'eg-selection-off',
  selectAll: 'eg-select-all',
  deselectAll: 'eg-deselect-all',
};

const steamAppId = 753;

const conversion = {
  total: 0,
  processed: 0,

  textFieldId: 'eg-processed',
};

let totalGems = 0;
let activeMode = modeIds.default;

const template = document.createElement('div');
template.classList.add('eg-panel');
template.innerHTML = 
    `<div id="${modeIds.default}" style="display: none;">
        <button id="${buttons.selectionOn}" class="btn_large btn_green_white_innerfade"><span>Select items</span></button>
    </div>
    <div id="${modeIds.selection}" style="display: none;">
        <button id="${buttons.convert}" class="btn_large btn_green_white_innerfade"><span>Convert to gems</span></button>
        <button id="${buttons.selectAll}" class="btn_large btn_darkblue_white_innerfade"><span>Select All</span></button>
        <button id="${buttons.deselectAll}" class="btn_large btn_grey_white_innerfade"><span>Deselect All</span></button>
        <div class="eg-counter">
          <img class="eg-total-gems-img" src="https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxH5rd9eDAjcFyv45SRYAFMIcKL_PArgVSL403ulRUWEndVKv6gpycBVglIFRRtOPwewYz1qCdcGQb6IrhzdHZwPbwNeKAzj0D65Un0uqQpMLlhlPNIsEiPQ/https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxH5rd9eDAjcFyv45SRYAFMIcKL_PArgVSL403ulRUWEndVKv6gpycBVglIFRRtOPwewYz1qCdcGQb6IrhzdHZwPbwNeKAzj0D65Un0uqQpMLlhlPNIsEiPQ/330x192">
          <span id="eg-total-gems">${totalGems}</span>
        </div>
        <button id="${buttons.selectionOff}" class="btn_large btn_grey_white_innerfade"><span>Cacnel</span></button>
    </div>
    <div id="${modeIds.conversion}" style="display: none;">
      <img src="https://community.akamai.steamstatic.com/public/images/login/throbber.gif">
      <span id="${conversion.textFieldId}"></span>
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

function addTotalGems(value) {
  totalGems += value;
  document.getElementById('eg-total-gems').textContent = totalGems;
}

const gemsValueAttribute = 'eg-gems-value';

function setValue(item, value) {
  item.setAttribute(gemsValueAttribute, value);
}

function getValue(item) {
  return +item.getAttribute(gemsValueAttribute);
}

function hasValue(item) {
  return !!item.getAttribute(gemsValueAttribute);
}

function deselectItem(item) {
  if (!hasValue(item)) {
    return;
  }

  item.classList.remove(itemSelectedClass);

  addTotalGems(-getValue(item));

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

  params.push(`sessionid=${g_sessionID}`);

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

  const value = getValue(item);

  addTotalGems(value);

  item.style.background = `url(${item.querySelector('img').src})`;
  item.querySelector('a').textContent = `+${value}`;
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

function reset() {
  document.querySelectorAll('.eg-selected').forEach((x) => deselectItem(x));

  conversion.total = 0;
  conversion.processed = 0;
  totalGems = 0;
}

const itemLoadedClass = 'eg-loaded';

function addEventToNewItems() {
  const newItems = document.querySelectorAll(`.item.app753:not(.${itemLoadedClass})`);

  [].slice.call(newItems).forEach((item, idx) => {
    item.classList.add(itemLoadedClass);

    item.addEventListener('click', () => {
      if (activeMode === modeIds.selection) {
        handleItemClick(item);
      }
    });
  });
}

function refresh() {
  document.getElementById(conversion.textFieldId).textContent = `${conversion.processed}/${conversion.total} processed.`;
}

function startConversion(items) {
  conversion.total = items.length;
  conversion.processed = 0;

  refresh();

  items.forEach((x) => itemToGems(x));
}

function itemProcessed() {
  conversion.processed++;

  refresh();

  if (conversion.processed === conversion.total) {
    window.location.reload();
  }
}

function itemToGems(item) {
  if (!hasValue(item)) {
    return;
  }

  const assetId = item.id.split('_')[2];

  itemInfoByAssetId(assetId)
    .then((itemInfo) => {
      itemInfo.goo_value_expected = getValue(item);
      grindIntoGems(itemInfo).then((x) => {
        item.classList.add('eg-item-processed');
      }).finally(() => {
        itemProcessed();
      });
    }).catch((err) => {});
}

function changeMode(modeId) {
  activeMode = modeId;

  switch (activeMode) {
    case modeIds.default:
      reset();

      break;

    case modeIds.selection:
      addEventToNewItems();
      break;

    case modeIds.conversion:
      const items = document.querySelectorAll('.eg-selected');

      if (items.length < 1) {
        return;
      }

      startConversion(items);

      break;

    default:
      break;
  }

  document.querySelectorAll('.eg-panel > div').forEach((x) => { x.style.display = x.id === modeId ? 'flex' : 'none'; });
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

const activePageItems = '.inventory_ctn > .inventory_page:not([style*="display: none"]) .item.app753';

document.getElementById(buttons.selectionOn).addEventListener('click', (e) => changeMode(modeIds.selection));
document.getElementById(buttons.convert).addEventListener('click', (e) => changeMode(modeIds.conversion));
document.getElementById(buttons.selectionOff).addEventListener('click', (e) => changeMode(modeIds.default));
document.getElementById(buttons.selectAll).addEventListener('click', (e) => {
  document.querySelectorAll(`${activePageItems}:not(.eg-selected)`).forEach((x) => setTimeout(selectItem(x), 200));
});
document.getElementById(buttons.deselectAll).addEventListener('click', (e) => {
  document.querySelectorAll(`${activePageItems}.eg-selected`).forEach((x) => deselectItem(x));
});

window.addEventListener('hashchange', () => inventoryTabChanged());
window.addEventListener('load', () => inventoryTabChanged());
