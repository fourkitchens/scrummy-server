const { words } = require('config');
const test = require('ava');
const gameNameGenerator = require('../../util/gameNameGenerator');

test('Generates a game name from config words', (t) => {
  t.plan(5);
  const gNG = gameNameGenerator();
  t.truthy(words.includes(gNG.next().value));
  t.truthy(words.includes(gNG.next().value));
  t.truthy(words.includes(gNG.next().value));
  t.truthy(words.includes(gNG.next().value));
  t.truthy(words.includes(gNG.next().value));
});

test('Generates a number for game name when all names are taken', (t) => {
  t.plan(1);
  const gNG = gameNameGenerator();
  words.forEach(() => gNG.next());
  t.is(typeof gNG.next().value, 'number');
});
