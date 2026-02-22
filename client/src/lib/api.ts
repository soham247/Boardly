import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

// Track whether a refresh is already in progress to avoid multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 responses that aren't already retried
        // and aren't the refresh-token or login/register endpoints themselves
        const isAuthEndpoint =
            originalRequest.url?.includes('/refresh-token') ||
            originalRequest.url?.includes('/login') ||
            originalRequest.url?.includes('/register') ||
            originalRequest.url?.includes('/users/me');  // checkAuth — should fail silently

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                // Another request is already refreshing — queue this one
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(
                    `${api.defaults.baseURL}/users/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                processQueue(null);
                // Retry the original request — cookies are now updated by the browser
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // Refresh failed — force logout
                forceLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Force logout: clear persisted auth state and redirect to login.
 * This is called when the refresh token itself is expired/invalid.
 */
function forceLogout() {
    // Clear the zustand persisted state from localStorage
    localStorage.removeItem('auth-storage');
    // Redirect to login page
    window.location.href = '/signin';
}

export const createWorkspace = async (data: { name: string; slug: string }) => {
    return await api.post('/workspaces', data);
};

export const getWorkspaces = async () => {
    return await api.get('/workspaces');
};

export const getWorkspaceById = async (workspaceId: string) => {
    return await api.get(`/workspaces/${workspaceId}`);
};

export const createBoard = async (data: {
    name: string;
    description?: string;
    workspaceId: string;
    members?: { userId: string, role: string }[];
}) => {
    return await api.post('/boards', data);
};

export const updateBoard = async (boardId: string, data: {
    name?: string;
    description?: string;
    members?: { userId: string, role: string }[];
}) => {
    return await api.patch(`/boards/${boardId}`, data);
};

export const searchUsers = async (query: string) => {
    return await api.get(`/users/search?q=${query}`);
};

export const getBoards = async (workspaceId: string) => {
    return await api.get(`/boards/workspace/${workspaceId}`);
};

export const getBoardById = async (boardId: string) => {
    return await api.get(`/boards/${boardId}`);
};

export const deleteBoard = async (boardId: string) => {
    return await api.delete(`/boards/${boardId}`);
};

export const getTasks = async (boardId: string) => {
    return await api.get(`/tasks/board/${boardId}`);
};

export const createTask = async (data: {
    title: string;
    description?: string;
    boardId: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
}) => {
    return await api.post('/tasks', data);
};

export const updateTask = async (taskId: string, data: {
    title?: string;
    description?: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
}) => {
    return await api.patch(`/tasks/${taskId}`, data);
};

export const deleteTask = async (taskId: string) => {
    return await api.delete(`/tasks/${taskId}`);
};

export default api;
