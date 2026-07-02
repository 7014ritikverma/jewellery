import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || "http://localhost:5000").replace(
  /\/+$/,
  "",
);

// Every axios call in the app can now use a relative URL such as /api/products.
// Set VITE_API_BASE_URL once in Vercel to point all requests at the Render API.
axios.defaults.baseURL = API_BASE_URL;

