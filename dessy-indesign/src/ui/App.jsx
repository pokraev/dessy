const { h } = require('preact');
const { useState } = require('preact/hooks');

function App() {
  const [status, setStatus] = useState('Ready');

  return (
    h('div', { style: { padding: '16px' } },
      h('h2', null, 'Dessy'),
      h('p', null, 'Status: ', status)
    )
  );
}

module.exports = { default: App };
