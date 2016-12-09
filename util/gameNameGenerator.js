const shuffle = require('lodash/shuffle');
const { words } = require('config');

/**
 * gameNameGenerator - Returns a generated game name
 *
 * @return {String} A generated game name
 */
function* gameNameGenerator() {
  const used = new Set();
  const availableWords = shuffle(words);
  while (this) {
    let result;
    while (!result || used.has(result)) {
      result = availableWords.length < 1
        ? Math.floor(Math.random() * 100000)
        : availableWords.pop();
    }
    used.add(result);
    yield result;
  }
}

module.exports = gameNameGenerator;
