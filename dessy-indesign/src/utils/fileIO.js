const uxp = require('uxp');
const storage = uxp.storage;

async function openXlsxPicker() {
  const file = await storage.localFileSystem.getFileForOpening({
    allowMultiple: false,
    types: ['xlsx']
  });
  return file; // UXP File Entry object, or null if user cancelled
}

async function readFileAsArrayBuffer(fileEntry) {
  const bytes = await fileEntry.read({ format: storage.formats.binary });
  return bytes; // ArrayBuffer — pass to SheetJS in Phase 2
}

module.exports = { openXlsxPicker, readFileAsArrayBuffer };
