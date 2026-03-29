import type { UXP_Config } from "vite-uxp-plugin";

const config: UXP_Config = {
  manifest: {
    id: "com.dessy.indesign",
    name: "Dessy",
    version: "1.0.0",
    manifestVersion: 5,
    main: "index.html",
    host: [
      {
        app: "ID",
        minVersion: "18.5.0"
      }
    ],
    entrypoints: [
      {
        type: "panel",
        id: "dessy-panel",
        label: { default: "Dessy" },
        minimumSize: { width: 300, height: 400 },
        preferredDockedSize: { width: 400, height: 600 }
      }
    ],
    requiredPermissions: {
      localFileSystem: "request"
    }
  },
  hotReloadPort: 8574,
  webviewUi: false,
  webviewReloadPort: 8573,
  copyZipAssets: []
};

export default config;
