// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyBHydQAcYi7KfGYFDhCZkHZ3fXBfoZ4Mag",
    authDomain: "sharestories-807a4.firebaseapp.com",
    databaseURL: "https://sharestories-807a4.firebaseio.com",
    projectId: "sharestories-807a4",
    storageBucket: "sharestories-807a4.appspot.com",
    messagingSenderId: "449623780134"
  },
  domainUrl: 'Sync Bookmarks',
  chromeExtn: 'chrome://extension/chromeExtn132165421651632',
  firefoxExtn: 'chrome://extension/firefoxExtn5315386656351655',
  msEdgeExtn: 'chrome://extension/msEdgeExtn545656565651656',
  appAsExtn: true
};
