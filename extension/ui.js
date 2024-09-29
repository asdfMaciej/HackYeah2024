document.addEventListener('DOMContentLoaded', function () {
  let textarea = document.getElementById('user-input');
  // add enter trigger on textarea
  textarea.addEventListener('keyup', function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      const user_input = document.querySelector("#user-input").value;
      generateResponse(user_input);
      document.querySelector("#user-input").value = 'Processing...';
      document.querySelector("#user-input").placeholder = '';
      document.querySelector("#user-input").disabled = true;

      addUserMessage(user_input);
    }
  });

  /*
  document.getElementById("test").addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: 'TEST_BUTTON' });
  });
  */
});

function addUserMessage(message) {
  let messageBox = document.createElement('div');
  // Convert nl2br
  message = message.replace(/\n/g, '<br>');
  messageBox.className = 'message user';
  messageBox.innerHTML = message;

  document.getElementById('chat').appendChild(messageBox);
  document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}

function addBotMessage(message) {
  let messageBox = document.createElement('div');
  message = message.replace(/\n/g, '<br>');
  messageBox.className = 'message bot';
  messageBox.innerHTML = message;
  document.getElementById('chat').appendChild(messageBox);

  document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}

function generateResponse(user_input) {
  // Send a message to the background script
  chrome.runtime.sendMessage({ type: 'BUTTON_CLICKED', user_input: user_input }, function (response) {
    console.log('response from bg script', response.message); // Response from background script
    addBotMessage(response.message);
    document.querySelector("#user-input").disabled = false;
    document.querySelector("#user-input").value = '';
  });
}