import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8081/api/v1',
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