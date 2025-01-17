// src/config.js
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
    console.warn('VITE_API_URL is not set');
}
export default API_URL || 'http://localhost:8000';
