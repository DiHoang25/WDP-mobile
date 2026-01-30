import { BusinessWasteType, ServiceArea } from '@/types';
import { ApiResponse, apiClient } from '@/utils/api';

export interface EnterpriseProfile {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    capacityKg: number;
    serviceAreas: ServiceArea[];
    wasteTypes: BusinessWasteType[];
}

export interface UpdateEnterpriseProfileRequest {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    capacityKg: number;
    serviceAreas: ServiceArea[];
    wasteTypes: BusinessWasteType[];
}

/**
 * Enterprise Service
 * Handles enterprise-specific operations including report assignment management
 */
export const enterpriseService = {
    /**
     * Get enterprise profile
     * GET /api/v1/enterprise/profile
     */
    async getProfile(): Promise<ApiResponse<EnterpriseProfile>> {
        return apiClient.get<EnterpriseProfile>('/enterprise/profile');
    },

    /**
     * Update enterprise profile
     * PUT /api/v1/enterprise/profile
     */
    async updateProfile(data: UpdateEnterpriseProfileRequest): Promise<ApiResponse<EnterpriseProfile>> {
        return apiClient.put<EnterpriseProfile>('/enterprise/profile', data);
    },
};
