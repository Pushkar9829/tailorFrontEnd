const base = (import.meta.env.VITE_API_URL || "https://tailorbackend-gskr.onrender.com").replace(/\/$/, "");

function api(path) {
  return `${base}${path}`;
}

export { api };
