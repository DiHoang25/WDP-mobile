import { config } from './config';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Helper to safely format error messages
function formatErrorMessage(error: any): string {
    if (!error) return 'An error occurred';
    if (typeof error === 'string') return error;
    if (Array.isArray(error)) {
        return error.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(', ');
    }
    if (typeof error === 'object') {
        return error.message || JSON.stringify(error);
    }
    return String(error);
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor() {
        this.baseUrl = config.apiUrl;
    }

    setToken(token: string | null) {
        this.token = token;
    }

    getToken() {
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const responseData = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: formatErrorMessage(responseData.message || responseData.error || 'Request failed'),
                    message: formatErrorMessage(responseData.message),
                    data: responseData.data || responseData,
                };
            }

            // Unwrap data if it follows the standard { success, data, message } format
            return {
                success: responseData.success ?? true,
                data: responseData.data !== undefined ? responseData.data : responseData,
                message: responseData.message,
            };
        } catch (error: any) {
            console.error('API Error:', error);
            return {
                success: false,
                error: error.message || 'Network error',
            };
        }
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // For multipart/form-data (file uploads)
    async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: formatErrorMessage(data.message || data.error || 'Request failed'),
                };
            }

            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Network error',
            };
        }
    }
}

export const apiClient = new ApiClient();
export type { ApiResponse };

