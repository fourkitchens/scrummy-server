const test = require('ava');
const getUniqueFormattedEntityName = require('../../util/getUniqueFormattedEntityName');

test('Returns False when no name is provided', t => {
  t.plan(2);
  t.falsy(getUniqueFormattedEntityName());
  t.falsy(getUniqueFormattedEntityName('', ['taylor']));
});

test('Returns False when name is in use', t => {
  t.plan(1);
  t.falsy(getUniqueFormattedEntityName('TaYlOr', ['taylor']));
});

test('Removes unwanted puncuation and converts to lower case', t => {
  t.plan(1);
  t.is(getUniqueFormattedEntityName('Taylor Smith #512', []), 'taylor smith 512');
});
