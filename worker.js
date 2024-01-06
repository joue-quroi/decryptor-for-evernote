chrome.action.onClicked.addListener(async () => {
  const win = await chrome.windows.getCurrent();

  chrome.storage.local.get({
    width: 900,
    height: 600
  }, prefs => {
    const left = win.left + Math.round((win.width - prefs.width) / 2);
    const top = win.top + Math.round((win.height - prefs.height) / 2);

    chrome.windows.create({
      url: '/data/window/index.html',
      width: prefs.width,
      height: prefs.height,
      left,
      top,
      type: 'popup'
    });
  });
});
