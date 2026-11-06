import axios from 'axios';

export const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,   // envía la cookie de sesión
    withXSRFToken: true,     // envía X-XSRF-TOKEN en cada petición
    headers: {
        Accept: 'application/json', // fuerza errores en JSON, nunca redirects HTML
        'X-Requested-With': 'XMLHttpRequest',
    },
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            window.location.href = '/login'; // sesión expirada
        }
        if (status === 419) {
            window.location.reload(); // token CSRF vencido
        }

        return Promise.reject(error);
    },
);
