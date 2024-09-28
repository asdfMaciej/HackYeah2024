document.addEventListener('DOMContentLoaded', function () {
    let button = document.getElementById('call-openai');
  
    button.addEventListener('click', function () {
      // Send a message to the background script
      chrome.runtime.sendMessage({ type: 'BUTTON_CLICKED' }, function (response) {
        console.log(response.message); // Response from background script
      });
    });
  });