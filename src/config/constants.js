export const ENVIRONMENTS = {
  STAGING: "staging",
  PRODUCTION: "production",
};
export const ENVIRONMENT_MODE = ENVIRONMENTS.STAGING;

export const BASE_URLS = {
  staging: {
    REACT_APP_API_BASE_URL: "https://api.viewmedia.boltplus.tv",
    CHANNEL_ID: '684299ab5dbaac954c3d8a12'
  },
  production: {
    REACT_APP_API_BASE_URL: "https://api.viewmedia.boltplus.tv",
  },
};
