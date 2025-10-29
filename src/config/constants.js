export const ENVIRONMENTS = {
  STAGING: "staging",
  PRODUCTION: "production",
};
export const ENVIRONMENT_MODE = ENVIRONMENTS.STAGING;

export const BASE_URLS = {
  staging: {
    REACT_APP_API_BASE_URL: "https://api.sawamedia.boltplus.tv",
    CHANNEL_ID: "69020d030658129c200f2844",
  },
  production: {
    REACT_APP_API_BASE_URL: "https://api.sawamedia.boltplus.tv",
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
