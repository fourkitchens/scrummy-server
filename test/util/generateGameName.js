const config = require('config');
const test = require('ava');
const generateGameName = require('../../util/generateGameName');

test('generateGameName: Generates a game name from config words', t => {
  t.plan(5);
  const allWords = config.get('words');
  t.truthy(allWords.includes(generateGameName([])));
  t.truthy(allWords.includes(generateGameName([])));
  t.truthy(allWords.includes(generateGameName([])));
  t.truthy(allWords.includes(generateGameName([])));
  t.truthy(allWords.includes(generateGameName([])));
});

test('generateGameName: Generates a number for game name when all names are taken', t => {
  t.plan(5);
  const allWords = config.get('words');
  t.is(typeof generateGameName(allWords), 'number');
  t.is(typeof generateGameName(allWords), 'number');
  t.is(typeof generateGameName(allWords), 'number');
  t.is(typeof generateGameName(allWords), 'number');
  t.is(typeof generateGameName(allWords), 'number');
});
