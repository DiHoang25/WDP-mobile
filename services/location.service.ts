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
    },

    /**
     * Clean up an address string for geocoding:
     * - Remove postal codes, "Việt Nam", duplicate segments
     * - Trim overly specific building/unit details
     */
    _cleanAddressForGeocode(address: string): string {
        let cleaned = address
            .replace(/,?\s*\d{5,6}\s*/g, '') // Remove postal codes like 71216
            .replace(/,?\s*Vi[eệ]t\s*Nam\s*/gi, '') // Remove "Việt Nam" / "Viet Nam"
            .replace(/\s+/g, ' ')
            .trim();

        // Remove duplicate segments (e.g. "Phường X, Quận Y, TP Z, Phường X, Quận Y, TP Z")
        const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const part of parts) {
            const normalized = part.toLowerCase().replace(/\s+/g, ' ');
            if (!seen.has(normalized)) {
                seen.add(normalized);
                unique.push(part);
            }
        }
        return unique.join(', ');
    },

    /**
     * Convert address text to coordinates using OpenStreetMap Nominatim.
     * Optionally accepts pinned coordinates to bias the search area (viewbox).
     * Uses progressive simplification: tries the full query first,
     * then drops the first segment (usually the most specific part like building name).
     */
    async geocodeAddress(
        address: string,
        pinnedLat?: number,
        pinnedLon?: number
    ): Promise<ApiResponse<{ latitude: number, longitude: number }>> {
        try {
            const cleaned = this._cleanAddressForGeocode(address);
            console.log('🔍 Geocoding cleaned address:', cleaned);

            // Build viewbox if pinned coordinates are available (~5km radius)
            let viewboxParam = '';
            if (pinnedLat !== undefined && pinnedLon !== undefined) {
                const delta = 0.045; // ~5km
                viewboxParam = `&viewbox=${pinnedLon - delta},${pinnedLat + delta},${pinnedLon + delta},${pinnedLat - delta}&bounded=0`;
            }

            // Try progressive queries: full → drop first segment → drop two segments
            const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
            const queries = [
                cleaned,
                parts.length > 2 ? parts.slice(1).join(', ') : null, // Drop most-specific segment (e.g. "Tòa S9.02")
                parts.length > 3 ? parts.slice(2).join(', ') : null, // Drop two most-specific segments
            ].filter(Boolean) as string[];

            for (const query of queries) {
                console.log('🔍 Trying geocode query:', query);
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn${viewboxParam}`,
                    {
                        headers: {
                            'User-Agent': 'ECONNET-App/1.0',
                            'Accept-Language': 'vi-VN,vi;q=0.9',
                        }
                    }
                );
                const data = await response.json();

                if (data && data.length > 0) {
                    console.log('✅ Geocode hit for query:', query);
                    return {
                        success: true,
                        data: {
                            latitude: parseFloat(data[0].lat),
                            longitude: parseFloat(data[0].lon),
                        }
                    };
                }
            }

            return {
                success: false,
                error: 'Không tìm thấy tọa độ cho địa chỉ này',
            };
        } catch (error: any) {
            console.error('❌ Error geocoding address:', error);
            return {
                success: false,
                error: error.message || 'Lỗi khi định vị địa chỉ',
            };
        }
    },

    /**
     * Calculate Haversine distance between two points in km
     */
    haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};
