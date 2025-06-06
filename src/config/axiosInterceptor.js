import axios from "axios";
import { BASE_URLS, ENVIRONMENT_MODE } from "./constants";

const baseUrl = BASE_URLS[ENVIRONMENT_MODE].REACT_APP_API_BASE_URL;

const authInterceptors = axios.create({
  baseURL: baseUrl,
  headers: {
    Accept: "application/json, text/plain, */*", 
    session: Date.now().toString(),
    device: "d520c7a8-421b-4563-b955-f5abc56b97ec",
    boltsrc: "boltplus-webapp/microsoft_windows/0.1.0",
  },
});

authInterceptors.interceptors.request.use(
  (config) => {
    const jsonToken = localStorage.getItem("@viewToken");
    if (jsonToken) {
      console.log(jsonToken);
      config.headers.Authorization = `Bearer ${jsonToken}`;
      config.headers.Accept = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

authInterceptors.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._dretry) {
      originalRequest._retry = true;
      const jsonToken = localStorage.getItem("@viewToken");

      if (jsonToken) {
        const parsedToken = jsonToken;

        const postData = {
          refreshToken: parsedToken,
        };
        authInterceptors
          .post(`${baseUrl}refresh`, postData, {
            headers: {
              "content-Type": "application/json",
            },
          })
          .then(async (res) => {
            if (res && res.data && res.data.accessToken) {
              const val = {
                accessToken: res.data.accessToken,

                refreshToken: parsedToken,
              };
              localStorage.setItem("@viewToken", JSON.stringify(val));
              originalRequest.headers.Authorization = `Bearer ${
                JSON.parse(localStorage.getItem("@viewToken"))
                  .accessToken
              }`;
              return axios(originalRequest);
            }
            return undefined;
          })
          .catch(() => {
            localStorage.removeItem("@viewToken");
            setTimeout(() => {
              window.location.assign("/login");
            }, 1500);
          });
      }
    } else if (error?.response?.status === 401) {
      localStorage.removeItem("@viewToken");
      setTimeout(() => {
        window.location.assign("/login");
      }, 1500);
    } else if (error?.response?.status === 403) {
      localStorage.removeItem("@viewToken");
      setTimeout(() => {
        window.location.assign("/login");
      }, 1500);
    } else if (error?.response?.status === 502) {
      localStorage.removeItem("@viewToken");
      setTimeout(() => {
        window.location.assign("/login");
      }, 1500);
    }
    return Promise.reject(error);
  }
);
export default authInterceptors;
