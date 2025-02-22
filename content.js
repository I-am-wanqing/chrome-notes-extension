// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 保留消息监听功能以供未来扩展
  console.log('收到消息:', message);
});