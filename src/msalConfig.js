// Konfigurasi MSAL untuk Microsoft Login

export const msalConfig = {
  auth: {
    clientId: "188be485-1d9c-4fca-b1a2-e3877a2a772a", // Client ID dari Azure
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage", // Persist MSAL token across tabs & browser restart
    storeAuthStateInCookie: false,
  },
};
