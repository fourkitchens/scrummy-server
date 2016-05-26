const test = require('ava');
const addTwoNumbers = require('../index.js');

test('ready to test', t => {
  t.is(addTwoNumbers(1, 1), 2);
});
