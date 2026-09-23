export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://repox-ai-powered-github-repository.onrender.com"
).replace(/\/+$/, "");
