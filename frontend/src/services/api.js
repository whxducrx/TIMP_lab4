import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await api.post('/api/auth/refresh', { refreshToken });
                    const newAccessToken = response.data.accessToken;
                    localStorage.setItem('accessToken', newAccessToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }

        if (error.response && error.response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export const register = async (username, email, password, firstName, lastName, patronymic = '') => {
    try {
        const response = await api.post('/api/auth/register', {
            username,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            patronymic: patronymic || null,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const login = async (username, password) => {
    try {
        const response = await api.post('/api/auth/login', {
            username,
            password,
        });
        
        const { accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
};

export const isAuth = () => {
    return !!localStorage.getItem('accessToken');
};

export const getProfile = async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
};

export const updateProfile = async (firstName, lastName, patronymic, email) => {
    const response = await api.put('/api/auth/profile', {
        first_name: firstName,
        last_name: lastName,
        patronymic: patronymic || null,
        email,
    });
    return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
    const response = await api.post('/api/auth/change-password', {
        oldPassword,
        newPassword,
    });
    return response.data;
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const getAllIncidents = async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
        page,
        limit,
        ...filters,
    });
    const response = await api.get(`/api/incidents?${params.toString()}`);
    return response.data;
};

export const getIncidentById = async (id) => {
    const response = await api.get(`/api/incidents/${id}`);
    return response.data;
};

export const addIncident = async (incident) => {
    const response = await api.post(`/api/incidents`, incident);
    return response.data;
};

export const putIncident = async (id, incident) => {
    const response = await api.put(`/api/incidents/${id}`, incident);
    return response.data;
};

export const deleteIncident = async (id) => {
    const response = await api.delete(`/api/incidents/${id}`);
    return response.data;
};

export const addComment = async (incidentId, content) => {
    const response = await api.post(`/api/incidents/${incidentId}/comments`, {
        content,
    });
    return response.data;
};

export const getAllVessels = async () => {
    const response = await api.get('/api/vessels');
    return response.data;
};

export const getVesselById = async (id) => {
    const response = await api.get(`/api/vessels/${id}`);
    return response.data;
};

export const addVessel = async (vessel) => {
    const response = await api.post('/api/vessels', vessel);
    return response.data;
};

export const updateVessel = async (id, vessel) => {
    const response = await api.put(`/api/vessels/${id}`, vessel);
    return response.data;
};

export const deleteVessel = async (id) => {
    const response = await api.delete(`/api/vessels/${id}`);
    return response.data;
};

export const getPositions = async () => {
    const response = await api.get('/api/positions');
    return response.data;
};

export const addPosition = async (name, description = '') => {
    const response = await api.post('/api/positions', { name, description });
    return response.data;
};

export const getVesselCrew = async (vesselId) => {
    const response = await api.get(`/api/crew/${vesselId}`);
    return response.data;
};

export const getCrewMember = async (id) => {
    const response = await api.get(`/api/crew/member/${id}`);
    return response.data;
};

export const addCrewMember = async (crewMember) => {
    const response = await api.post('/api/crew', crewMember);
    return response.data;
};

export const updateCrewMember = async (id, crewMember) => {
    const response = await api.put(`/api/crew/${id}`, crewMember);
    return response.data;
};

export const deleteCrewMember = async (id) => {
    const response = await api.delete(`/api/crew/${id}`);
    return response.data;
};

export const getAllUsers = async (page = 1, limit = 10, role = null) => {
    const params = new URLSearchParams({ page, limit });
    if (role) params.append('role', role);
    const response = await api.get(`/api/admin/users?${params.toString()}`);
    return response.data;
};

export const getUserById = async (id) => {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
};

export const changeUserRole = async (id, role) => {
    const response = await api.put(`/api/admin/users/${id}/role`, { role });
    return response.data;
};

export const deactivateUser = async (id) => {
    const response = await api.put(`/api/admin/users/${id}/deactivate`);
    return response.data;
};

export const activateUser = async (id) => {
    const response = await api.put(`/api/admin/users/${id}/activate`);
    return response.data;
};

export default api;