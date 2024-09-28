API_URL = 'http://localhost:5000';


var API_KEY = null;
const restoreOptions = () => {
  chrome.storage.sync.get(
    { api_key: null },
    (items) => {
      API_KEY = items.api_key;
    }
  );
};


(async function () {
  restoreOptions(); // GET API key
  chrome.runtime.sendMessage({ action: 'setBadge', text: `...`, color: '#C6A0F6' });
})();
