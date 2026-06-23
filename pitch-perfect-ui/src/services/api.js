import axios from 'axios';
import API_BASE from '../config';

const API = axios.create({
    baseURL: `${API_BASE}/api/v1`,
});

// Automatically attach JWT token to every request if it exists in storage
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;