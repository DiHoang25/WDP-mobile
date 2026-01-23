import Constants from 'expo-constants';

export const config = {
    apiUrl: Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.9:8000/api/v1',
};
