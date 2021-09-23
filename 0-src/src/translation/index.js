const defaultLocale = 'en';
let localeData = {};

function setLocaleData(data) {
    localeData = data;
}

function formatMessage(getLocale, message) {
    let _locale = getLocale();
    if (typeof message === 'string') 
        return (localeData[_locale] || localeData[defaultLocale] || {})[message] || '';

    if (typeof message !== 'object' && message.id) 
        throw new Error(`Error in translation: id cannot be empty.`);
    
    if (localeData[_locale] && localeData[_locale][message.id])
        return localeData[_locale][message.id];

    return message.default || (localeData[defaultLocale] || {})[message] || '';
}

export {
    formatMessage,
    setLocaleData
}