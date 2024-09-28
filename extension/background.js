chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('received message: ', message);
    if (message.action === 'setBadge') {
        chrome.action.setBadgeText({ text: message.text });
        chrome.action.setBadgeBackgroundColor({ color: message.color }); 
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'BUTTON_CLICKED') {
      console.log('Button was clicked in the popup!');
  
      // Perform any background actions here, e.g., interacting with tabs or modifying data
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => alert('Background script received the button click!')
        });
      });
  
      // Send a response back to the popup
      sendResponse({ message: 'Action performed in the background' });
    }
    return true; // Keep the message channel open for the asynchronous response
  });
  