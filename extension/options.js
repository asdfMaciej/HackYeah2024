// Saves options to chrome.storage
const saveOptions = () => {
    const api_key = document.getElementById('openai_api_key').value;
  
    chrome.storage.sync.set(
      { api_key: api_key},
      () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
          status.textContent = '';
        }, 750);
      }
    );
  };
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  const restoreOptions = () => {
    chrome.storage.sync.get(
      { api_key: null},
      (items) => {
        console.log("api key: " + items.api_key);
        document.querySelector("#openai_api_key_status").innerHTML = items.api_key ? "Ustawiono klucz API OpenAI, możesz korzystać ze wtyczki!" : "Ustaw klucz API OpenAI!";
      }
    );
  };
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);