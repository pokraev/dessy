const { h } = require('preact');
const { useState } = require('preact/hooks');
const { openXlsxPicker } = require('../utils/fileIO');

function App() {
  const [status, setStatus] = useState('Ready');

  async function testFilePicker() {
    try {
      const file = await openXlsxPicker();
      if (file) {
        setStatus('Selected: ' + file.name);
      } else {
        setStatus('No file selected (cancelled)');
      }
    } catch (err) {
      console.error('File picker error:', err);
      setStatus('Error: ' + err.message);
    }
  }

  function testInDesignDOM() {
    try {
      const { app } = require('indesign');
      if (app.documents.length === 0) {
        setStatus('No document open');
        return;
      }
      const doc = app.documents.item(0);
      const pageCount = doc.pages.length;
      const firstPageName = doc.pages.item(0).name;
      setStatus('Doc: ' + doc.name + ' (' + pageCount + ' pages, first: ' + firstPageName + ')');
    } catch (err) {
      console.error('InDesign DOM error:', err);
      setStatus('Error: ' + err.message);
    }
  }

  return (
    h('div', { style: { padding: '16px' } },
      h('h2', null, 'Dessy'),
      h('p', null, 'Status: ', status),
      h('sp-button', { onclick: testInDesignDOM }, 'Test InDesign DOM'),
      h('sp-button', { onclick: testFilePicker, style: { marginTop: '8px' } }, 'Test File Picker')
    )
  );
}

module.exports = { default: App };
