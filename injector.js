const node = document.getElementsByTagName('head')[0];
const script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.runtime.getURL('easy-gems.js'));
node.appendChild(script);
