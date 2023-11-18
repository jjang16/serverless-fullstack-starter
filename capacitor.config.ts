import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.serverless_fullstack_starter.app',
  appName: 'serverless-fullstack-starter',
  webDir: 'capacitor-web-dir',
  loggingBehavior: `debug`,
  ios: {
    appendUserAgent: `capacitor-ios`,
    webContentsDebuggingEnabled: true,
  },
  android: {
    appendUserAgent: `capacitor-android`,
    webContentsDebuggingEnabled: true,
  },
  server: {
    /*
      replace hostname & url for dev / staging / prod
    */
    hostname: `localhost:3000`,
    url: `http://localhost:3000`,
  },
  plugins: {
    SplashScreen: {
      // https://capacitorjs.com/docs/apis/splash-screen
      launchAutoHide: true,
      backgroundColor: `#FFFFFF`,
      // spinner
      // showSpinner: true,
    },
    Keyboard: {
      //      "resize": "body",
      resizeOnFullScreen: true,
    },
  },
}

export default config
