import en from '@/locales/en.json';
import vi from '@/locales/vi.json';

type Translations = Record<string, any>;

const translations: Record<string, Translations> = { vi, en };

let currentLocale = 'vi';

function getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((acc, key) => {
        if (acc && typeof acc === 'object' && key in acc) {
            return acc[key];
        }
        return undefined;
    }, obj);
}

const i18n = {
    get locale() {
        return currentLocale;
    },
    set locale(lang: string) {
        currentLocale = lang;
    },
    t(key: string, options?: Record<string, any>): string {
        const translation = getNestedValue(translations[currentLocale], key)
            ?? getNestedValue(translations['vi'], key)
            ?? key;

        if (typeof translation !== 'string') return key;

        if (!options) return translation;

        // Replace {{variable}} patterns
        return translation.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
            return options[varName] !== undefined ? String(options[varName]) : `{{${varName}}}`;
        });
    },
};

export default i18n;
