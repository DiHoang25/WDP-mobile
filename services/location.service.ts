import { ApiResponse } from '@/utils/api';

export interface Province {
    code: string;
    name: string;
}

export interface District {
    code: string;
    name: string;
}

export interface Ward {
    code: string;
    name: string;
}

export const locationService = {
    /**
     * Get list of all provinces in Vietnam
     */
    async getProvinces(): Promise<ApiResponse<Province[]>> {
        try {
            console.log('🔍 Fetching provinces (Open API)...');
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();

            const provinces = data.map((p: any) => ({
                code: p.code.toString(),
                name: p.name,
            }));

            console.log('✅ Provinces fetched:', provinces.length, 'items');
            return {
                success: true,
                data: provinces,
            };
        } catch (error: any) {
            console.error('❌ Error fetching provinces:', error);
            return {
                success: false,
                error: error.message || 'Không thể tải danh sách tỉnh thành',
            };
        }
    },

    /**
     * Get list of districts by province code
     */
    async getDistricts(provinceCode: string): Promise<ApiResponse<District[]>> {
        try {
            console.log('🔍 Fetching districts for province:', provinceCode);
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            const data = await response.json();

            const districts = (data.districts || []).map((d: any) => ({
                code: d.code.toString(),
                name: d.name,
            }));

            console.log('✅ Districts fetched:', districts.length, 'items');
            return {
                success: true,
                data: districts,
            };
        } catch (error: any) {
            console.error('❌ Error fetching districts:', error);
            return {
                success: false,
                error: error.message || 'Không thể tải danh sách quận huyện',
            };
        }
    },

    /**
     * Get list of wards by district code
     */
    async getWards(districtCode: string): Promise<ApiResponse<Ward[]>> {
        try {
            console.log('🔍 Fetching wards for district:', districtCode);
            const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            const data = await response.json();

            const wards = (data.wards || []).map((w: any) => ({
                code: w.code.toString(),
                name: w.name,
            }));

            console.log('✅ Wards fetched:', wards.length, 'items');
            return {
                success: true,
                data: wards,
            };
        } catch (error: any) {
            console.error('❌ Error fetching wards:', error);
            return {
                success: false,
                error: error.message || 'Không thể tải danh sách phường xã',
            };
        }
    }
};
