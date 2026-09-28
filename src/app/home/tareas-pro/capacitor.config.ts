/// <reference types="@capacitor/status-bar" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'tareas-pro',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#ffffffff'
    }
  }
};

export default config;