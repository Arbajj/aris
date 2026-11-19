import axios from "axios";

const KEY = "aris_token";

export function getToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function applyToken() {
  const t = getToken();
  if (t) axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  else delete axios.defaults.headers.common["Authorization"];
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage band ho toh bhi app na toote */
  }
  applyToken();
}
