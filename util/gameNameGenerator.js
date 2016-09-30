const { words } = require('config');

/**
 * gameNameGenerator
 *   Returns a generated game name.
 *
 * @return {String}
 *   A generated game name.
 */
function* gameNameGenerator() {
  const used = new Set();
  const availableWords = words.slice(0);
  while (this) {
    let result;
    while (!result || used.has(result)) {
      const i = Math.floor(Math.random() * availableWords.length);
      result = availableWords.length < 1
        ? Math.floor(Math.random() * 100000)
        : availableWords.splice(i, i + 1)[0];
    }
    used.add(result);
    yield result;
  }
}

module.exports = gameNameGenerator;
