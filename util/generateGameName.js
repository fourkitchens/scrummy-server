const config = require('config');

/**
 * generateGameName
 *   Returns a generated game name.
 *
 * @param {Array} existingGameNames
 *   Existing game names.
 * @return {String}
 *   A generated game name.
 */
function generateGameName(existingGameNames) {
  let result;
  let i = 0;
  while (!result || existingGameNames.includes(result)) {
    result = i++ < 5
      ? config.words[Math.floor(Math.random() * config.words.length)]
      : result = Math.floor(Math.random() * 100000);
  }
  return result;
}

module.exports = generateGameName;
