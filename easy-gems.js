function inventoryTabChanged() {
  if (g_bViewingOwnProfile && g_ActiveInventory.m_appid === 753) {
    console.log('Easy Gems');
  }
}

window.addEventListener('hashchange', () => inventoryTabChanged());
window.addEventListener('load', () => inventoryTabChanged());
