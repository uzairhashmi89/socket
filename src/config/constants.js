export const ENVIRONMENTS = {
  STAGING: "staging",
  PRODUCTION: "production",
};
export const ENVIRONMENT_MODE = ENVIRONMENTS.STAGING;

export const BASE_URLS = {
  staging: {
    REACT_APP_API_BASE_URL: "https://api.viewmedia.boltplus.tv",
    CHANNEL_ID: "684299ab5dbaac954c3d8a12",
  },
  production: {
    REACT_APP_API_BASE_URL: "https://api.viewmedia.boltplus.tv",
  },
};

export const scrollToBottom = (scrollableContainerRef, firstMessageRef) => {
  if (scrollableContainerRef.current) {
    const scrollableElement = scrollableContainerRef.current;
    const isNearBottom = scrollableElement.scrollTop < 100;

    if (isNearBottom) {
      if (firstMessageRef.current) {
        firstMessageRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        scrollableElement.scrollTop = 0;
      }
    }
  }
};
