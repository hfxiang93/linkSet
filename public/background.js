chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: 'linkset:add',
      title: '添加到 LinkSet',
      contexts: ['page', 'link']
    });
  } catch (e) {
    // ignore
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.linkUrl || info.pageUrl || (tab && tab.url) || '';
  if (!url || !/^https?:/i.test(url)) return;
  const title = info.selectionText || (tab && tab.title) || url;
  const item = {
    id: (self.crypto && self.crypto.randomUUID) ? self.crypto.randomUUID() : String(Date.now()),
    name: title,
    url,
    path: []
  };
  chrome.storage.local.get('linkset:inbox', (res) => {
    const inbox = Array.isArray(res['linkset:inbox']) ? res['linkset:inbox'] : [];
    inbox.push(item);
    chrome.storage.local.set({ 'linkset:inbox': inbox });
  });
});
