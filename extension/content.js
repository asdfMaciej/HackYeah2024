API_URL = 'http://localhost:5000';


var API_KEY = null;
const restoreOptions = () => {
    chrome.storage.sync.get(
      { api_key: null},
      (items) => {
        API_KEY = items.api_key; 
	}
    );
  };

async function fetchFromAPI() {
	const tabURL = window.location.href;
	console.log('fetching rating for: ', tabURL);

	let response; 
	try {
		response = await fetch(`${API_URL}/check_url`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			//mode: 'no-cors',
			body: JSON.stringify({
				url: tabURL
			})
		});

		if (!response.ok) {
			throw new Error('Response not ok');
		}
	} catch {
		console.log('Failed to fetch rating');
		return 'Failed to fetch rating';
	};
	
	console.log('fetched from: ', response.url);

	const data = await response.json();
	console.log('received data: ', data);

	return data;
}

(async function() {
	restoreOptions(); // GET API key
	setTimeout(() => {console.log(API_KEY);}, 2000);
	chrome.runtime.sendMessage({ action: 'setBadge', text: `...`, color: '#C6A0F6'});

	let rating = 'No rating available';
	rating = await fetchFromAPI();

	chrome.runtime.sendMessage({ action: 'setBadge', text: `${rating.score}`, color: '#FF0000'});
})();
