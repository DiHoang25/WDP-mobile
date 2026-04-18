import { ApiResponse, apiClient } from '@/utils/api';

export interface WasteItem {
    wasteType: string;
    weightKg: number;
}

export interface CreateReportRequest {
    address: string;
    latitude: number;
    longitude: number;
    provinceCode: string;
    districtCode: string;
    wardCode?: string;
    description?: string;
    wasteItems: WasteItem[];
    files?: Array<string | { uri: string; name?: string; mimeType?: string }>; // Image URIs or picker assets
}

export const wasteService = {
    /**
     * Create waste report
     * POST /api/v1/citizen/reports
     */
    async createReport(data: CreateReportRequest): Promise<ApiResponse<any>> {
        const formData = new FormData();

        formData.append('address', data.address);
        formData.append('latitude', data.latitude.toString());
        formData.append('longitude', data.longitude.toString());
        formData.append('provinceCode', data.provinceCode);
        formData.append('districtCode', data.districtCode);
        if (data.wardCode) formData.append('wardCode', data.wardCode);
        if (data.description) formData.append('description', data.description);

        // wasteItems must be a JSON string according to Swagger
        formData.append('wasteItems', JSON.stringify(data.wasteItems));

        if (data.files && data.files.length > 0) {
            console.log('[wasteService] preparing files for upload:', data.files.length);
            data.files.forEach((file, index) => {
                const fileUri = typeof file === 'string' ? file : file.uri;
                const fallbackName = `image_${index}.jpg`;
                const filename = typeof file === 'string'
                    ? fileUri.split('/').pop() || fallbackName
                    : file.name || fileUri.split('/').pop() || fallbackName;
                const mimeType = typeof file === 'string'
                    ? undefined
                    : file.mimeType;
                const match = /\.(\w+)$/.exec(filename || '');
                const type = mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

                console.log('[wasteService] append file:', {
                    index,
                    uri: fileUri,
                    filename,
                    type,
                });

                // For React Native FormData
                formData.append('files', {
                    uri: fileUri,
                    name: filename,
                    type,
                } as any);
            });
        } else {
            console.log('[wasteService] no files to upload');
        }

        console.log('📦 FormData wasteItems:', formData.get('wasteItems'));
        return apiClient.postFormData<any>('/citizen/reports', formData);
    },

    /**
     * Get report history
     * GET /api/v1/citizen/reports
     */
    async getHistory(status?: string): Promise<ApiResponse<any>> {
        const query = status ? `?status=${status}` : '';
        return apiClient.get<any>(`/citizen/reports${query}`);
    },

    /**
     * Get report by ID
     * GET /api/v1/citizen/reports/:id
     */
    async getReportById(reportId: number): Promise<ApiResponse<any>> {
        return apiClient.get<any>(`/citizen/reports/${reportId}`);
    },

    /**
     * Cancel waste report
     * DELETE /api/v1/citizen/reports/:id/cancel
     */
    async cancelReport(reportId: number, cancelReason: string): Promise<ApiResponse<any>> {
        return apiClient.delete<any>(`/citizen/reports/${reportId}/cancel`, { cancelReason });
    }
};
