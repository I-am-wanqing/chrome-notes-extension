// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToNotes',
    title: '添加到笔记',
    contexts: ['selection']
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToNotes' && info.selectionText) {
    const currentUrl = tab.url;
    const noteWithUrl = `${currentUrl}\n\n${info.selectionText}`;
    
    // 获取现有笔记
    chrome.storage.sync.get(['notes'], (result) => {
      const notes = result.notes || [];
      
      // 创建新笔记
      const note = {
        id: Date.now(),
        text: noteWithUrl,
        date: new Date().toISOString()
      };
      
      // 将新笔记添加到列表开头
      notes.unshift(note);
      
      // 保存更新后的笔记列表
      chrome.storage.sync.set({ notes }, () => {
        if (chrome.runtime.lastError) {
          console.error('保存笔记时出错:', chrome.runtime.lastError);
          return;
        }
        console.log('笔记保存成功');
      });
    });
  }
});