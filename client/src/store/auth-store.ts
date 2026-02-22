import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import api from '../lib/api';

interface User {
    id: string;
    fullName: string;
    email: string;
    username: string;
    tier: "Free" | "Premium";
    profession?: string;
    isOnboarded: boolean;
    avatar?: string;
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
    email: string;
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
    checkAuth: () => Promise<void>;
    completeOnboarding: (data: { fullName: string; username: string; profession: string }) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (data: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,   // true until checkAuth resolves — prevents premature redirects
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<LoginOrSignupResponse>('/users/login', credentials);
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
                    await api.post<LoginOrSignupResponse>('/users/register', userData);
                    set({ isLoading: false });
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
                    await api.post('/users/logout');
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

            checkAuth: async () => {
                set({ isLoading: true });
                try {
                    const response = await api.get<{ user: User }>('/users/me');
                    set({
                        user: response.data.user,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null // Don't set error on checkAuth to avoid flashing error messages on load
                    });
                }
            },

            completeOnboarding: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await api.post<{ user: User }>('/users/onboarding', data);
                    set({
                        user: response.data.user,
                        isLoading: false
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            forgotPassword: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await api.post('/users/forgot-password', { email });
                    set({ isLoading: false });
                } catch (error) {
                    let errorMessage = 'Failed to send OTP';
                    if (error instanceof AxiosError) {
                        errorMessage = error.response?.data?.message || errorMessage;
                    }
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            resetPassword: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    await api.post('/users/reset-password', data);
                    set({ isLoading: false });
                } catch (error) {
                    let errorMessage = 'Failed to reset password';
                    if (error instanceof AxiosError) {
                        errorMessage = error.response?.data?.message || errorMessage;
                    }
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
