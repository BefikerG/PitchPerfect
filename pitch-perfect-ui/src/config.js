// Central API base URL - reads from env var in Docker, falls back to localhost for local dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export default API_BASE;
