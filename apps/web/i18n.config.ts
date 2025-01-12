import {useLocale} from "@repo/commons/src/utils/uses";

export default defineI18nConfig(async () => {
    const messages: any = {};
    const localeStore = useLocale()
    for (const locale of localeStore.locales) {
        messages[locale] = (await import(`./assets/i18n/${locale}.json`)).default;
    }
    return localeStore.getConfig(messages)
});