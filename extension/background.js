var API_KEY = null;
const restoreOptions = () => {
    chrome.storage.sync.get(
        { api_key: null },
        (items) => {
            API_KEY = items.api_key;
            console.log("OpenAI api key loaded!");
        }
    );
};


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('received message: ', message);
    if (message.action === 'setBadge') {
        chrome.action.setBadgeText({ text: message.text });
        chrome.action.setBadgeBackgroundColor({ color: message.color });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'BUTTON_CLICKED') {
        const user_msg = message.user_input || "";
        console.log('Button was clicked in the popup!');

        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                sendResponse({ screenshotUrl: null });
                return;
            }

            fetchChatCompletion(API_KEY, 'gpt-4o', "Repeat the user message back to himself", null, null).then((response) => {
                sendResponse({ message: response });

                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: (msg_txt) => alert(msg_txt),
                        args: [response]
                    });
                });
            });
        });


    }
    return true; // Keep the message channel open for the asynchronous response
});


// Fetch data from the OpenAI Chat Completion API
async function fetchChatCompletion(apiKey, apiModel, system_prompt, user_prompt = null, user_image = null) {
    let messages = [];
    messages.push({ "role": "system", "content": system_prompt });
    let user_msg = { "role": "user", "content": [] };
    if (user_prompt) {
        user_msg.content.push({ type: "text", "text": user_prompt });
    }
    if (user_image) {
        user_msg.content.push({ type: "image_url", "image_url": { "url": user_image } });
    }
    messages.push(user_msg);
    console.log('attempting to fetch openai api');
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                "messages": messages,
                "model": apiModel,
            })
        });

        if (!response.ok) {
            console.log('error!');
            if (response.status === 401) {
                // Unauthorized - Incorrect API key
                throw new Error("Looks like your API key is incorrect. Please check your API key and try again.");
            } else {
                throw new Error(`Failed to fetch. Status code: ${response.status}`);
            }
        }

        let json = await response.json();
        return json.choices[0].message.content;
    } catch (error) {
        // Send a response to the popup script
        chrome.runtime.sendMessage({ error: error.message });

        console.error(error);
    }
}

(async function () {
    restoreOptions();
})();