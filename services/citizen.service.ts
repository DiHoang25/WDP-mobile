import { ApiResponse, apiClient } from '@/utils/api';
import { config } from '@/utils/config';

/**
 * Citizen Service
 * Handles citizen-specific interactions with reports
 */
export const citizenService = {
    /**
     * Citizen confirms presence at collection point
     * PATCH /citizen/reports/{reportId}/confirm-presence
     * NOTE: Endpoint is defined WITHOUT /api/v1 prefix → must call absolute URL.
     */
    async confirmPresence(reportId: number): Promise<ApiResponse<any>> {
        const baseWithoutApi = config.apiUrl.replace(/\/api\/v1\/?$/, '');
        const fullUrl = `${baseWithoutApi}/citizen/reports/${reportId}/confirm-presence`;

        console.log(`📡 [citizenService] PATCH (ABSOLUTE) -> ${fullUrl}`);
        const response = await apiClient.patch<any>(fullUrl, {});
        console.log(`📡 [citizenService] Response:`, JSON.stringify(response));
        return response;
    },

    /**
     * Citizen reports own absence
     * PATCH /api/v1/citizen/reports/{reportId}/report-absent
     */
    async reportAbsent(reportId: number): Promise<ApiResponse<any>> {
        // NOTE: This endpoint is defined at the root level without `/api/v1` prefix.
        // Our config.apiUrl already includes `/api/v1`, so we build an absolute URL
        // by stripping that suffix and calling the full URL directly.
        const baseWithoutApi = config.apiUrl.replace(/\/api\/v1\/?$/, '');
        const fullUrl = `${baseWithoutApi}/citizen/reports/${reportId}/report-absent`;

        console.log(`📡 [citizenService] PATCH (ABSOLUTE) -> ${fullUrl}`);
        const response = await apiClient.patch<any>(fullUrl, {});
        console.log(`📡 [citizenService] Response:`, JSON.stringify(response));
        return response;
    },
};
