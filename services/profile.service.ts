import { User } from '@/types';
import { apiClient, ApiResponse } from '@/utils/api';

export interface UpdateProfileRequest {
    fullName: string;
    phone: string;
    address?: string; // App-side addition for text address
    avatar?: any; // Blob/File
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export const profileService = {
    /**
     * Get user profile
     * GET /api/v1/profile
     */
    async getProfile(): Promise<ApiResponse<User>> {
        return apiClient.get<User>('/profile');
    },

    /**
     * Update user profile
     * POST /api/v1/profile
     * Consumes: multipart/form-data
     */
    async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<User>> {
        const formData = new FormData();
        formData.append('fullName', data.fullName);
        formData.append('phone', data.phone);
        // Address is not supported in this endpoint according to latest specs

        if (data.avatar) {
            // React Native FormData format for files
            const fileData = {
                uri: data.avatar.uri,
                name: data.avatar.name || 'avatar.jpg',
                type: data.avatar.type || 'image/jpeg',
            } as any;
            formData.append('avatar', fileData);
        }

        // Use postFormData to handle multipart/form-data correctly
        return apiClient.postFormData<User>('/profile', formData);
    },

    /**
     * Change password
     * POST /api/v1/profile/change-password
     */
    async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
        return apiClient.post<void>('/profile/change-password', data);
    }
};
