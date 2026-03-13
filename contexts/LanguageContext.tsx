import i18n from '@/utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const LANGUAGE_KEY = 'app_language';

type Language = 'vi' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (scope: string, options?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'vi',
    setLanguage: async () => { },
    t: (scope: string) => scope,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('vi');

    useEffect(() => {
        // Load saved language preference
        AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
            if (saved === 'en' || saved === 'vi') {
                setLanguageState(saved);
                i18n.locale = saved;
            }
        });
    }, []);

    const setLanguage = useCallback(async (lang: Language) => {
        setLanguageState(lang);
        i18n.locale = lang;
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    }, []);

    const t = useCallback((scope: string, options?: Record<string, any>) => {
        return i18n.t(scope, options);
    }, [language]); // re-creates when language changes to trigger re-renders

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
