const getFormattedEntityName = require('./getFormattedEntityName');

/**
 * getUniqueFormattedEntityName
 *   Formats name for use in the app if it is unique.
 *
 * @param {String} name
 *   The user provided or machine generated name.
 * @param {String} names
 *   Existing names.
 * @return {String|Boolean}
 *   The formatted name or False;
 */
function getUniqueFormattedEntityName(name, names) {
  const formattedName = getFormattedEntityName(name);
  return name && !names.includes(formattedName) && formattedName;
}

module.exports = getUniqueFormattedEntityName;
