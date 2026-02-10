import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios, { AxiosError } from 'axios';

interface User {
    id: string;
    fullName: string;
    email: string;
    username: string;
}

interface LoginOrSignupResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    message: string;
}

interface LoginCredentials {
    email?: string;
    username?: string;
    password?: string;
}

interface SignupCredentials {
    fullName: string;
    email: string;
    username: string;
    password: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (data: LoginCredentials) => Promise<void>;
    signup: (data: SignupCredentials) => Promise<void>;
    logout: () => Promise<void>;
}

// Create an axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/users',
    withCredentials: true,
});

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<LoginOrSignupResponse>('/login', credentials);
                    set({
                        user: response.data.user,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    let errorMessage = 'Login failed';
                    if (error instanceof AxiosError) {
                        errorMessage = error.response?.data?.message || errorMessage;
                    }
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    throw error;
                }
            },

            signup: async (userData) => {
                set({ isLoading: true, error: null });
                try {
                    await api.post<LoginOrSignupResponse>('/register', userData);
                    set({ isLoading: false });
                    // Optionally log them in automatically or redirect to login
                } catch (error) {
                    let errorMessage = 'Signup failed';
                    if (error instanceof AxiosError) {
                        errorMessage = error.response?.data?.message || errorMessage;
                    }
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoading: true, error: null });
                try {
                    await api.post('/logout');
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false
                    });
                } catch (error) {
                    console.error("Logout failed", error);
                    // Force logout on client even if server fails
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false
                    });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
