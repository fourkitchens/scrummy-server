const config = require('config');
const test = require('ava');
const WebSocket = require('ws');
require('../app.js');

test.beforeEach(async t => {
  await new Promise(resolve => {
    t.context.ws = new WebSocket(`ws://localhost:${config.get('port')}`);
    t.context.ws.on('open', () => {
      resolve();
    });
  });
});

test.afterEach.always(async t => {
  if (t.context.ws.connected) {
    await t.context.ws.disconnect();
  }
});

test.cb('echoes', t => {
  t.plan(1);
  const message = 'Hello World!';
  t.context.ws.send(message);
  t.context.ws.on('message', data => {
    t.is(data, message);
    t.end();
  });
});
