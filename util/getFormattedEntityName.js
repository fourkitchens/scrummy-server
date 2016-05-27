/**
 * getFormattedEntityName
 *   Formats name for use in the app.
 *
 * @param {String} name
 *   The user provided or machine generated name.
 * @return {String|Boolean}
 *   The formatted name or False;
 */
function getFormattedEntityName(name) {
  return name && name.toLowerCase().replace(/[^\d\w-\s]+/gi, '');
}

module.exports = getFormattedEntityName;
