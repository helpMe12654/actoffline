import App from './App'

// Берем React и ReactDOM из глобальных переменных (окна браузера),
// куда их положили script-теги из index.html
const React = window.React
const ReactDOM = window.ReactDOM

ReactDOM.render(React.createElement(App), document.getElementById('root'))