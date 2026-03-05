const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// The following IDs do not exist in the ripped HTML, we need to handle them carefully or mapping them.
// Let's first make sure we don't throw errors for non-existent UI elements.

const safetyWrapper = `
function safeEl(id) {
  return document.getElementById(id) || document.querySelector(id) || {
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {} },
    style: {},
    appendChild: () => {},
    value: '',
    textContent: '',
    innerHTML: '',
    focus: () => {},
    blur: () => {},
  };
}
`;

js = safetyWrapper + js;
js = js.replace(/document\.getElementById\(([^)]+)\)/g, 'safeEl($1)');
js = js.replace(/document\.querySelector\(([^)]+)\)/g, 'safeEl($1)');

fs.writeFileSync('main.js', js, 'utf8');
