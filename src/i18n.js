/**
 * @fileOverview Editor internationalization (i18n) private functions and properties.
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 */

/**
 * @type String|null
 */
var currentLocale = null;

/**
 * @type Object
 */
var locales = {};

/**
 * @type Object
 */
var localeNames = {};

/**
 *
 * @static
 * @param {String} name
 * @param {String} nativeName
 * @param {Object} strings
 */
function registerLocale(name, nativeName, strings) {
    // <strict>
    if (locales[name]) {
        handleError(_('Locale "{{localeName}}" has already been registered, and will be overwritten', {localeName: name}));
    }
    // </strict>

    locales[name] = strings;
    localeNames[name] = nativeName;
    if (!currentLocale) {
        currentLocale = name;
    }
}

/**
 * @param {String} key
 */
function setLocale(key) {
    if (currentLocale !== key) {
        // <debug>
        debug('Changing locale', key);
        // </debug>

        currentLocale = key;
        Raptor.eachInstance(function() {
            this.reinit();
        });
    }
}

/**
 * Return the localised string for the current locale if present, else the
 * localised string for the first available locale, failing that return the
 * string.
 *
 * @param  {string} string
 * @return {string}
 */
function getLocalizedString(string) {
    if (typeof locales[currentLocale] !== 'undefined' &&
            typeof locales[currentLocale][string] !== 'undefined') {
        return locales[currentLocale][string];
    }

    for (var localeName in localeNames) {
        if (typeof locales[localeName][string] !== 'undefined') {
            return locales[localeName][string];
        }
    }

    return string;
}

/**
 * Internationalisation function. Translates a string with tagged variable
 * references to the current locale.
 *
 * <p>
 * Variable references should be surrounded with double curly braces {{ }}
 *      e.g. "This string has a variable: {{my.variable}} which will not be translated"
 * </p>
 *
 * @static
 * @param {String} string
 * @param {Object} variables
 */
function _(string, variables) {
    // Get the current locale translated string
    string = getLocalizedString(string);

    // Convert the variables
    if (!variables) {
        // <debug>
        if (debugLevel >= MID) {
            debug('Missing locale string: ' + string);
        }
        // </debug>
        return string;
    } else {
        for (var key in variables) {
            string = string.replace('{{' + key + '}}', variables[key]);
        }
        return string;
    }
}
