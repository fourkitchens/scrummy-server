const test = require('ava');
const getFormattedEntityName = require('../../util/getFormattedEntityName');

test('getFormattedEntityName: Returns False when no nickname is provided', t => {
  t.plan(2);
  t.falsy(getFormattedEntityName());
  t.falsy(getFormattedEntityName(''));
});

test('getFormattedEntityName: Removes unwanted puncuation and converts to lower case', t => {
  t.plan(3);
  t.is(getFormattedEntityName('Taylor Smith #512'), 'taylor smith 512');
  t.is(getFormattedEntityName('Taylor_Smith-512'), 'taylor_smith-512');
  t.is(getFormattedEntityName('$$$Taylor$$$Smith$$$512$$$'), 'taylorsmith512');
});
