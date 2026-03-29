import { storage } from 'uxp';

export async function openXlsxPicker() {
  const file = await storage.localFileSystem.getFileForOpening({
    allowMultiple: false,
    types: ['xlsx']
  });
  return file; // UXP File Entry object, or null if user cancelled
}

export async function readFileAsArrayBuffer(fileEntry) {
  const bytes = await fileEntry.read({ format: storage.formats.binary });
  return bytes; // ArrayBuffer — pass to SheetJS in Phase 2
}
