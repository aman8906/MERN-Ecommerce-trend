import axios from "axios";
import { backendUrl } from "./App";

/** axios helper that attaches the admin token and logs out when the session expired */
export const adminApi = (token, setToken) => {
  const api = axios.create({ baseURL: backendUrl + "/api", headers: { token } });
  api.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err.response?.status === 401 && setToken) setToken("");
      return Promise.reject(err);
    }
  );
  return api;
};

export const errMsg = (e) => e.response?.data?.message || e.message || "Something went wrong";
