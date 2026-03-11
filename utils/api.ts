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

            const contentType = response.headers.get("content-type");
            let responseData;

            if (contentType && contentType.indexOf("application/json") !== -1) {
                responseData = await response.json();
            } else {
                const textData = await response.text();
                return {
                    success: false,
                    error: `Unexpected response format. Status: ${response.status}`,
                    message: textData.substring(0, 150), // Show part of the HTML/text
                };
            }

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

    async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    // For multipart/form-data (file uploads)
    private async requestFormData<T>(endpoint: string, formData: FormData, method: 'POST' | 'PATCH' = 'POST'): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: formData,
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const textData = await response.text();
                return {
                    success: false,
                    error: `Unexpected response format. Status: ${response.status}`,
                };
            }

            if (!response.ok) {
                console.error(`❌ API ${method} FormData Error Details:`, {
                    status: response.status,
                    statusText: response.statusText,
                    data
                });
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

    async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        return this.requestFormData<T>(endpoint, formData, 'POST');
    }

    async patchFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        return this.requestFormData<T>(endpoint, formData, 'PATCH');
    }
}

export const apiClient = new ApiClient();
export type { ApiResponse };

