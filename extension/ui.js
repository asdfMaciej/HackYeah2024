document.addEventListener('DOMContentLoaded', function () {
  let button = document.getElementById('call-openai');

  button.addEventListener('click', function () {
    // Send a message to the background script
    chrome.runtime.sendMessage({ type: 'BUTTON_CLICKED', user_input: document.querySelector("#user-input").value }, function (response) {
      console.log('response from bg script', response.message); // Response from background script
    });
  });

  document.getElementById("test").addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: 'TEST_BUTTON' });
  });
});