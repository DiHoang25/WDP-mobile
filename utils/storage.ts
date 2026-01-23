import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_KEY = '@user';

export const storage = {
    /**
     * Save authentication token
     */
    async saveToken(token: string): Promise<void> {
        try {
            if (!token) {
                console.warn('Attempted to save empty token');
                return;
            }
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    },

    /**
     * Get authentication token
     */
    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    /**
     * Remove authentication token
     */
    async removeToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    },

    /**
     * Save refresh token
     */
    async saveRefreshToken(token: string): Promise<void> {
        try {
            if (!token) {
                console.warn('Attempted to save empty refresh token');
                return;
            }
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving refresh token:', error);
        }
    },

    /**
     * Get refresh token
     */
    async getRefreshToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    },

    /**
     * Remove refresh token
     */
    async removeRefreshToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Error removing refresh token:', error);
        }
    },

    /**
     * Save user data
     */
    async saveUser(user: any): Promise<void> {
        try {
            if (!user) {
                console.warn('Attempted to save empty user');
                return;
            }
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving user:', error);
        }
    },

    /**
     * Get user data
     */
    async getUser(): Promise<any | null> {
        try {
            const user = await AsyncStorage.getItem(USER_KEY);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    /**
     * Remove user data
     */
    async removeUser(): Promise<void> {
        try {
            await AsyncStorage.removeItem(USER_KEY);
        } catch (error) {
            console.error('Error removing user:', error);
        }
    },

    /**
     * Clear all auth data
     */
    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },
};
