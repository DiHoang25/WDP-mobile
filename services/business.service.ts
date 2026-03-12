import { BusinessRegistrationRequest, SubscriptionPlan } from '@/types';
import { ApiResponse, apiClient } from '@/utils/api';

export const businessService = {
    /**
     * Get list of subscription plans
     * GET /api/v1/business/subscription-plans
     */
    async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
        return apiClient.get<SubscriptionPlan[]>('/enterprise/plans');
    },

    /**
     * Register business
     * POST /api/v1/enterprise/register
     */
    async registerBusiness(data: BusinessRegistrationRequest): Promise<ApiResponse<any>> {
        return apiClient.post<any>('/enterprise/register', data);
    },

    /**
     * Get payment details by referenceCode
     * GET /api/v1/enterprise/payment/{referenceCode}
     */
    async getPayment(referenceCode: string): Promise<ApiResponse<any>> {
        return apiClient.get<any>(`/enterprise/payment/${referenceCode}`);
    },

    /**
     * Cancel payment by referenceCode
     * DELETE /api/v1/enterprise/payment/${referenceCode}/cancel
     */
    async cancelPayment(referenceCode: string): Promise<ApiResponse<any>> {
        return apiClient.delete<any>(`/enterprise/payment/${referenceCode}/cancel`);
    },

    /**
     * Test payment success by referenceCode
     * POST /api/v1/enterprise/webhook/sepay/test/{referenceCode}
     */
    async testPaymentSuccess(referenceCode: string): Promise<ApiResponse<any>> {
        return apiClient.post<any>(`/enterprise/webhook/sepay/test/${referenceCode}`);
    },

    /**
     * Get current subscription info
     * GET /api/v1/enterprise/subscription
     */
    async getSubscription(): Promise<ApiResponse<any>> {
        return apiClient.get<any>('/enterprise/subscription');
    },

    /**
     * Renew subscription (when EXPIRED or about to expire)
     * POST /api/v1/enterprise/subscription/renew
     */
    async renewSubscription(planId: number): Promise<ApiResponse<any>> {
        return apiClient.post<any>('/enterprise/subscription/renew', { planId });
    },

    /**
     * Get transaction history
     * GET /api/v1/enterprise/transactions
     */
    async getTransactions(): Promise<ApiResponse<any>> {
        return apiClient.get<any>('/enterprise/transactions');
    }
};
