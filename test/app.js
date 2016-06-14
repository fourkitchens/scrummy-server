const config = require('config');
const test = require('ava');
const WebSocket = require('ws');
const Scrummy = require('../app.js');

const avengers = [
  'Hank Pym',
  'Janet van Dyne',
  'Tony Stark',
  'Bruce Banner',
  'Thor Odinson',
  'Richard Milhouse',
];

test.beforeEach(async t => {
  t.context.app = new Scrummy;
  t.context.sockets = [];
  const promises = [];
  for (let i = 0; i < 8; i++) {
    t.context.sockets.push(new WebSocket(`ws://localhost:${config.get('port')}`));
    promises.push(new Promise(resolve => t.context.sockets[i].on('open', resolve)));
  }
  await Promise.all(promises, resolve => resolve());
});

test.afterEach.always(async t => {
  t.context.app.shutdown();
  t.context.sockets.forEach(socket => {
    if (socket.connected) {
      socket.close();
    }
  });
  delete t.context.app;
});

test.serial.cb('Can start a new game', t => {
  t.plan(3);
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    game: '',
    nickname: 'Taylor',
  }));
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    t.deepEqual(data.points, config.get('points'));
    t.truthy(config.get('words').includes(data.game));
    t.is(data.users[0].nickname, 'taylor');
    t.end();
  });
});

test.serial.cb('Accepts multiple users in a single room', t => {
  t.plan(6);
  avengers.forEach((nickname, index) => {
    t.context.sockets[index].send(JSON.stringify({
      type: 'signIn',
      game: 'Avengers',
      nickname,
    }));
  });
  t.context.sockets[5].on('message', response => {
    const data = JSON.parse(response);
    if (data.type === 'someoneSignedIn') {
      const lowerCaseAvengers = avengers.map(avenger => avenger.toLowerCase());
      data.users.map(user => user.nickname).forEach(nickname => {
        t.truthy(lowerCaseAvengers.includes(nickname));
      });
      t.end();
    }
  });
});

test.serial.cb('Supports multiple rooms independently', t => {
  t.plan(14);
  avengers.forEach((nickname, index) => t.context.sockets[index].send(JSON.stringify({
    type: 'signIn',
    game: 'Avengers',
    nickname,
  })));
  t.context.sockets[7].send(JSON.stringify({
    type: 'signIn',
    game: 'Characters I Will Never Like',
    nickname: 'Spiderman',
  }));
  t.context.sockets[7].on('message', response => {
    const data = JSON.parse(response);
    const bucket = t.context.app.bucket;
    if (data.type === 'someoneSignedIn') {
      t.is(bucket['characters i will never like'].users[0].nickname, 'spiderman');
      t.is(bucket['characters i will never like'].users[0].game, 'characters i will never like');
      const lowerCaseAvengers = avengers.map(avenger => avenger.toLowerCase());
      bucket.avengers.users.map(user => user.nickname).forEach(nickname => {
        t.truthy(lowerCaseAvengers.includes(nickname));
      });
      bucket.avengers.users.map(user => user.game).forEach(game => {
        t.is(game, 'avengers');
      });
      t.end();
    }
  });
});

test.serial.cb('Won\'t let a duplicate nickname in', t => {
  t.plan(1);
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    game: 'asdf',
    nickname: 'Taylor',
  }));
  t.context.sockets[1].send(JSON.stringify({
    type: 'signIn',
    game: 'asdf',
    nickname: 'Taylor',
  }));
  t.context.sockets[1].on('message', response => {
    const data = JSON.parse(response);
    t.is(data.message, 'This username is unavailable; please pick another.');
    t.end();
  });
});

test.serial.cb('Responds politely when the message is junk', t => {
  t.plan(1);
  t.context.sockets[0].send(JSON.stringify({
    type: 'HAHAHAHAHEYTHERE',
  }));
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    t.is(data.message, 'HAHAHAHAHEYTHERE is not a message type Scrummy is prepared for!');
    t.end();
  });
});

test.serial.cb('Allows user to vote', t => {
  t.plan(1);
  let game;
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    if (data.game) {
      game = data.game;
    }
    if (data.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        game: data.game,
        nickname: data.nickname,
        vote: 1,
      }));
    }
    if (data.type === 'someoneVoted') {
      if (t.context.app.bucket[game].votes.taylor === 1) {
        t.pass();
        t.end();
      } else {
        t.fail();
        t.end();
      }
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    nickname: 'Taylor',
  }));
});

test.serial.cb('Fails on reveal if there are no votes for the given game', t => {
  t.plan(1);
  let nickname;
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    if (data.nickname) {
      nickname = data.nickname;
    }
    if (data.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reveal',
        game: data.game,
        nickname: data.nickname,
      }));
    }
    if (data.type === 'error') {
      t.is(data.message, `${nickname} has no votes to reveal!`);
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    nickname: 'Taylor',
  }));
});

test.serial.cb('Fails on reveal if game doesn\'t exist', t => {
  t.plan(1);
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    if (data.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reveal',
        game: 'notagame',
        nickname: data.nickname,
      }));
    }
    if (data.type === 'error') {
      t.is(data.message, 'notagame does not exist!');
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    nickname: 'Taylor',
  }));
});

test.serial.cb('Allows user to reveal votes', t => {
  t.plan(1);
  let game;
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    if (data.game) {
      game = data.game;
    }
    if (data.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        game,
        nickname: data.nickname,
        vote: 1,
      }));
    }
    if (data.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reveal',
        game,
        nickname: data.nickname,
      }));
    }
    if (data.type === 'reveal') {
      t.pass();
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    nickname: 'Taylor',
  }));
});

test.serial.cb('Errors if vote is invalid', t => {
  t.plan(1);
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    if (data.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        game: data.game,
        nickname: data.nickname,
        vote: '🍰',
      }));
    }
    if (data.type === 'error') {
      if (data.message === '🍰 is not a valid vote!') {
        t.pass();
        t.end();
      } else {
        t.fail();
        t.end();
      }
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    nickname: 'Taylor',
  }));
});

test.serial.cb('Errors if game is invalid', t => {
  t.plan(1);
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    if (data.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        game: 'sandwich',
        nickname: data.nickname,
        vote: 5,
      }));
    }
    if (data.type === 'error') {
      if (data.message === 'sandwich does not exist!') {
        t.pass();
        t.end();
      } else {
        t.fail();
        t.end();
      }
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    nickname: 'Taylor',
  }));
});

test.serial.cb('Fails to reset a game if the game doesn\'t exist', t => {
  t.plan(1);
  const nickname = 'Taylor';
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    if (data.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        game: data.game,
        nickname: data.nickname,
        vote: 3,
      }));
    }
    if (data.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reset',
        game: 'notanactualgame',
        nickname,
      }));
    }
    if (data.type === 'error') {
      if (data.message === 'notanactualgame does not exist!') {
        t.pass();
        t.end();
      } else {
        t.fail();
        t.end();
      }
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    nickname,
  }));
});

test.serial.cb('Allows a game to be reset', t => {
  t.plan(1);
  const nickname = 'Taylor';
  let game;
  t.context.sockets[0].on('message', response => {
    const data = JSON.parse(response);
    if (data.game) {
      game = data.game;
    }
    if (data.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        game: data.game,
        nickname: data.nickname,
        vote: 3,
      }));
    }
    if (data.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reset',
        game,
        nickname,
      }));
    }
    if (data.type === 'reset') {
      t.true(Object.keys(t.context.app.bucket[game].votes).length === 0);
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    nickname,
  }));
});
