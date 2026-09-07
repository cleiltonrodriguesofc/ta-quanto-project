import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from '../locales/pt-BR.json';

/**
 * TaQuanto é um app 100% em português (pt-BR).
 * O idioma é fixo — não detecta o locale do dispositivo.
 * O arquivo en-US.json é mantido apenas como referência/backup.
 */
const initI18n = async () => {
    await i18next
        .use(initReactI18next)
        .init({
            resources: {
                'pt-BR': { translation: ptBR },
            },
            lng: 'pt-BR',
            fallbackLng: 'pt-BR',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18next;
