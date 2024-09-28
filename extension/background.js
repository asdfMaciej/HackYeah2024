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

        /*
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                sendResponse({ screenshotUrl: null });
                return;
            }

            // w dataUrl mamy obrazek - obecnie unused
        });*/

        chrome.windows.getCurrent(w => {
            chrome.tabs.query({ active: true, windowId: w.id }, function (tabs) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: getAllLinks, // Function to inject
                    args: [] // Pass the CSS selector of the element
                }).then((links_html_response) => {
                    let links_html = links_html_response[0].result;
                    system_prompt = `The user needs to: "${user_msg}".
        What element should he click?
        
        1. Explain where the element is located on the page.
        2. Write a CSS selector.

        The CSS selector should be unique and refer only to the provided HTML elements.
        Do not use :contains. In order of preference, preferably use ID or href attributes. 
        
        You will receive a HTML webpage in the user message.`;

                    console.log('attempting to prompt with', system_prompt, links_html);

                    fetchChatCompletion(API_KEY, 'gpt-4o-2024-08-06', system_prompt, links_html, null).then((response) => {
                        sendResponse({ message: response });


                        // response to json
                        response = JSON.parse(response);

                        console.log('Moj CSS selector to ' + response.css_selector);
                        console.log(response);
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            chrome.scripting.executeScript({
                                target: { tabId: tabs[0].id },
                                function: triggerClickOnElement,
                                args: [response.css_selector]
                            });
                        });
                    });
                });
            });
        });


    }

    if (message.type === 'TEST_BUTTON') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: getAllLinks, // Function to inject
                args: [] // Pass the CSS selector of the element
            }).then((response) => {
                console.log('Response from content script DUPA123:', response[0].result);
            });
        });
    }
    return true; // Keep the message channel open for the asynchronous response
});

function triggerClickOnElement(selector) {
    let element = null;
    try {
        element = document.querySelector(selector);
    } catch (error) {
        console.error('Error while selecting element:', error);
        return;
    }
    if (element) {
        element.click(); // Trigger the click event
        console.log('Element clicked:', element);
    } else {
        console.error('Element not found:', selector);
    }
}

function getAllLinks() {
    const links = Array.from(document.querySelectorAll('a, [role=link]'));
    const buttons = Array.from(document.querySelectorAll('button, [role=button]'));
    const inputs = Array.from(document.querySelectorAll('input'));
    const selects = Array.from(document.querySelectorAll('select'));

    // Join all the elements into a single array
    const elements = links.concat(buttons).concat(inputs).concat(selects);
    // Iterate over all elements and combine all outer HTMLs
    let html = '';
    elements.forEach((element) => {
        // Log the element's tag name and text content
        console.log(element.outerHTML);
        html += `\n\n[${element.tagName}]\n`;
        if (element.title) {
            html += `Title: ${element.textContent}\n`;
        }
        if (element.textContent) {
            html += `Text: ${element.textContent}\n`;
        }
        if (element.href) {
            html += `Href: ${element.href}\n`;
        }
        if (element.id) {
            html += `ID: ${element.id}\n`;
        }
        html += `HTML: \n` + element.outerHTML;
    });

    console.log(html);
    return html;
}


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
                "temperature": 0.2,
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "css_selector",
                        "strict": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "chain_of_thought": {
                                    "type": "string"
                                },
                                "css_selector": {
                                    "type": "string"
                                }
                            },
                            "required": ["chain_of_thought", "css_selector"],
                            "additionalProperties": false
                        }
                    }
                }
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
        console.error('openai error:', error);
        // Send a response to the popup script
        chrome.runtime.sendMessage({ error: error.message });

        console.error(error);
    }
}

(async function () {
    restoreOptions();
})();