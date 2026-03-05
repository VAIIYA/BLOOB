const fs = require('fs');

// Fix main.js
let mainJs = fs.readFileSync('main.js', 'utf8');
mainJs = mainJs.replace(/document\.querySelector\("#`\.keybind-btn\[data-action="\${\s*listeningFor\s*}"\]`\)/g, "document.querySelector(`.keybind-btn[data-action=\"${listeningFor}\"]`)");
fs.writeFileSync('main.js', mainJs);

// Fix index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/href="css\//g, 'href="/css/');
indexHtml = indexHtml.replace(/src="js\//g, 'src="/js/');
indexHtml = indexHtml.replace(/src="images\//g, 'src="/images/');
indexHtml = indexHtml.replace(/href="images\//g, 'href="/images/');
indexHtml = indexHtml.replace(/src="res\//g, 'src="/res/');
indexHtml = indexHtml.replace(/href="res\//g, 'href="/res/');
fs.writeFileSync('index.html', indexHtml);
