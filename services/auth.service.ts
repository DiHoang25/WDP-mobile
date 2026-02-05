import { User } from '@/types';
import { apiClient, ApiResponse } from '@/utils/api';

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

interface SignupRequest {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address?: string;
    latitude?: number;
    longitude?: number;
}

interface SignupResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

interface RefreshTokenRequest {
    refreshToken: string;
}

interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

export const authService = {
    /**
     * Login user
     * POST /api/v1/auth/login
     */
    async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
        console.log(email, password)
        const a = apiClient.post<LoginResponse>('/auth/login', {
            email,
            password,
        });
        console.log(a)
        return a
    },

    /**
     * Register new user
     * POST /api/v1/auth/signup
     */
    async signup(data: SignupRequest): Promise<ApiResponse<SignupResponse>> {
        return apiClient.post<SignupResponse>('/auth/signup', data);
    },

    /**
     * Refresh access token
     * POST /api/v1/auth/refresh-token
     */
    async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
        return apiClient.post<RefreshTokenResponse>('/auth/refresh-token', {
            refreshToken,
        });
    },

    /**
     * Logout (if backend has logout endpoint)
     */
    async logout(): Promise<void> {
        // Clear token from client
        apiClient.setToken(null);
    },
};
