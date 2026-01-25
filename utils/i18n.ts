import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ptBR from '../locales/pt-BR.json';
import enUS from '../locales/en-US.json';

const resources = {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
};

const initI18n = async () => {
    const locales = Localization.getLocales();
    const deviceLanguage = locales[0]?.languageTag || 'pt-BR';

    // Fallback to pt-BR if language not supported, or if it's just 'pt'
    const languageToUse = deviceLanguage.startsWith('en') ? 'en-US' : 'pt-BR';

    await i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: languageToUse,
            fallbackLng: 'pt-BR',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18n;
