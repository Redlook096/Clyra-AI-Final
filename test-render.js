require('esbuild-register');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const App = require('./src/App.tsx').default;

try {
  ReactDOMServer.renderToString(React.createElement(App));
  console.log("Render successful!");
} catch (e) {
  console.error("Render failed:", e);
}
