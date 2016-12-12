const config = require('config');
const test = require('ava');
const WebSocket = require('uws');
const Scrummy = require('../app.js');
const _ = require('lodash');

const avengers = [
  'Hank Pym',
  'Janet van Dyne',
  'Tony Stark',
  'Bruce Banner',
  'Thor Odinson',
  'Richard Milhouse',
];

test.beforeEach(async t => {
  t.context.app = new Scrummy();
  t.context.sockets = [];
  const promises = [];
  for (let i = 0; i < 8; i += 1) {
    t.context.sockets.push(new WebSocket(`ws://localhost:${config.get('port')}`));
    promises.push(new Promise(resolve => t.context.sockets[i].on('open', resolve)));
  }
  await Promise.all(promises, resolve => resolve());
});

test.afterEach.always(async t => {
  t.context.app.shutdown();
  t.context.sockets.forEach((socket) => {
    if (socket.connected) {
      socket.close();
    }
  });
  delete t.context.app;
  delete t.context.context;
});

test.serial.cb('Can start a new game', (t) => {
  t.plan(3);
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: {
      game: '',
      nickname: 'Taylor',
    },
  }));
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'youSignedIn') {
      t.deepEqual(resp.data.points, config.get('points'));
      t.truthy(config.get('words').includes(_.get(resp, 'data.game')));
      t.is(resp.data.users[0].nickname, 'taylor');
      t.end();
    }
  });
});

test.serial.cb('Accepts multiple users in a single room', (t) => {
  t.plan(6);
  avengers.forEach((nickname, index) => {
    t.context.sockets[index].send(JSON.stringify({
      type: 'signIn',
      data: {
        game: 'Avengers',
        nickname,
      },
    }));
  });
  t.context.sockets[5].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'someoneSignedIn') {
      const lowerCaseAvengers = avengers.map(avenger => avenger.toLowerCase());
      resp.data.users.map(user => user.nickname).forEach((nickname) => {
        t.truthy(lowerCaseAvengers.includes(nickname));
      });
      t.end();
    }
  });
});

test.serial.cb('Supports multiple rooms independently', (t) => {
  t.plan(14);
  avengers.forEach((nickname, index) => t.context.sockets[index].send(JSON.stringify({
    type: 'signIn',
    data: {
      game: 'Avengers',
      nickname,
    },
  })));
  t.context.sockets[7].send(JSON.stringify({
    type: 'signIn',
    data: {
      game: 'Characters I Will Never Like',
      nickname: 'Spiderman',
    },
  }));
  t.context.sockets[7].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'someoneSignedIn') {
      t.is(Scrummy.getGame('characters i will never like').users[0].nickname, 'spiderman');
      t.is(Scrummy.getGame('characters i will never like').users[0].game, 'characters i will never like');
      const lowerCaseAvengers = avengers.map(avenger => avenger.toLowerCase());
      Scrummy.getGame('avengers').users.map(user => user.nickname).forEach((nickname) => {
        t.truthy(lowerCaseAvengers.includes(nickname));
      });
      Scrummy.getGame('avengers').users.map(user => user.game).forEach((game) => {
        t.is(game, 'avengers');
      });
      t.end();
    }
  });
});

test.serial.cb('Won\'t let a duplicate nickname in', (t) => {
  t.plan(1);
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: {
      game: 'asdf',
      nickname: 'Taylor',
    },
  }));
  t.context.sockets[1].send(JSON.stringify({
    type: 'signIn',
    data: {
      game: 'asdf',
      nickname: 'Taylor',
    },
  }));
  t.context.sockets[1].on('message', (response) => {
    const resp = JSON.parse(response);
    t.is(resp.data.message, 'This username is unavailable; please pick another.');
    t.end();
  });
});

test.serial.cb('Responds politely when the message is junk', (t) => {
  t.plan(1);
  t.context.sockets[0].send(JSON.stringify({
    type: 'HAHAHAHAHEYTHERE',
  }));
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    t.is(resp.data.message, 'HAHAHAHAHEYTHERE is not a message type Scrummy is prepared for!');
    t.end();
  });
});

test.serial.cb('Allows user to vote', (t) => {
  t.plan(1);
  let game;
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (_.get(resp, 'data.game')) {
      game = _.get(resp, 'data.game');
    }
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game: _.get(resp, 'data.game'),
          nickname: resp.data.nickname,
          vote: 1,
        },
      }));
    }
    if (resp.type === 'someoneVoted') {
      if (Scrummy.getGame(game).votes.taylor === 1) {
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
    data: { nickname: 'Taylor' },
  }));
});

test.serial.cb('Fails on reveal if there are no votes for the given game', (t) => {
  t.plan(1);
  const nickname = 'taylor';
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reveal',
        data: {
          game: _.get(resp, 'data.game'),
          nickname: resp.data.nickname,
        },
      }));
    }
    if (resp.type === 'error') {
      t.is(resp.data.message, `${nickname} has no votes to reveal!`);
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { nickname },
  }));
});

test.serial.cb('Fails on reveal if game doesn\'t exist', (t) => {
  t.plan(1);
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reveal',
        data: {
          game: 'notagame',
          nickname: resp.data.nickname,
        },
      }));
    }
    if (resp.type === 'error') {
      t.is(resp.data.message, 'notagame does not exist!');
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { nickname: 'Taylor' },
  }));
});

test.serial.cb('Allows user to reveal votes', (t) => {
  t.plan(1);
  let game;
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (_.get(resp, 'data.game')) {
      game = _.get(resp, 'data.game');
    }
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game,
          nickname: resp.data.nickname,
          vote: 1,
        },
      }));
    }
    if (resp.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reveal',
        data: {
          game,
          nickname: resp.data.nickname,
        },
      }));
    }
    if (resp.type === 'reveal') {
      t.pass();
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { nickname: 'Taylor' },
  }));
});

test.serial.cb('Errors if vote is invalid', (t) => {
  t.plan(1);
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game: _.get(resp, 'data.game'),
          nickname: resp.data.nickname,
          vote: '🍰',
        },
      }));
    }
    if (resp.type === 'error') {
      if (resp.data.message === '🍰 is not a valid vote!') {
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
    data: { nickname: 'Taylor' },
  }));
});

test.serial.cb('Errors if game is invalid', (t) => {
  t.plan(1);
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game: 'sandwich',
          nickname: resp.data.nickname,
          vote: 5,
        },
      }));
    }
    if (resp.type === 'error') {
      if (resp.data.message === 'sandwich does not exist!') {
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
    data: { nickname: 'Taylor' },
  }));
});

test.serial.cb('Fails to reset a game if the game doesn\'t exist', (t) => {
  t.plan(1);
  const nickname = 'Taylor';
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game: _.get(resp, 'data.game'),
          nickname: resp.data.nickname,
          vote: 3,
        },
      }));
    }
    if (resp.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reset',
        data: {
          game: 'notanactualgame',
          nickname,
        },
      }));
    }
    if (resp.type === 'error') {
      if (resp.data.message === 'notanactualgame does not exist!') {
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
    data: { nickname },
  }));
});

test.serial.cb('Allows a game to be reset', (t) => {
  t.plan(1);
  const nickname = 'Taylor';
  let game;
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (_.get(resp, 'data.game')) {
      game = _.get(resp, 'data.game');
    }
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game: _.get(resp, 'data.game'),
          nickname: resp.data.nickname,
          vote: 3,
        },
      }));
    }
    if (resp.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'reset',
        data: {
          game,
          nickname,
        },
      }));
    }
    if (resp.type === 'reset') {
      t.true(Object.keys(Scrummy.getGame(game).votes).length === 0);
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { nickname },
  }));
});

test.serial.cb('Fails to disconnect a client if the user isn\'t a part of the game', (t) => {
  t.plan(1);
  const nickname = 'Taylor';
  let game;
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (_.get(resp, 'data.game')) {
      game = _.get(resp, 'data.game');
    }
    if (resp.type === 'youSignedIn') {
      t.context.sockets[1].send(JSON.stringify({
        type: 'disconnect',
        data: {
          game: _.get(resp, 'data.game'),
          nickname: 'notauser',
        },
      }));
    }
  });

  t.context.sockets[1].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'error') {
      if (resp.data.message === `notauser is not a part of ${game}!`) {
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
    data: { nickname },
  }));
});

test.serial.cb('Fails to disconnect a client if a game doesn\'t exist', (t) => {
  t.plan(1);
  const nickname = 'Taylor';
  let game;
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (_.get(resp, 'data.game')) {
      game = _.get(resp, 'data.game');
    }
    if (resp.type === 'youSignedIn') {
      t.context.sockets[1].send(JSON.stringify({
        type: 'signIn',
        data: {
          nickname: 'flip',
          game,
        },
      }));
    }
    if (resp.type === 'someoneSignedIn') {
      if (resp.data.users.length === 2) {
        t.context.sockets[1].send(JSON.stringify({
          type: 'disconnect',
          data: {
            game: 'notanactualgame',
            nickname: 'flip',
          },
        }));
      }
    }
  });
  t.context.sockets[1].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'error') {
      if (resp.data.message === 'notanactualgame does not exist!') {
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
    data: { nickname },
  }));
});

test.serial.cb('Cleans game up after disconnected client', (t) => {
  t.plan(3);
  const nickname = 'Taylor';
  let game;
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (_.get(resp, 'data.game')) {
      game = _.get(resp, 'data.game');
    }
    if (resp.type === 'youSignedIn') {
      t.context.sockets[1].send(JSON.stringify({
        type: 'signIn',
        data: {
          nickname: 'flip',
          game,
        },
      }));
    }
    if (resp.type === 'someoneSignedIn') {
      if (resp.data.users.length === 2) {
        t.context.sockets[1].send(JSON.stringify({
          type: 'placeVote',
          data: {
            game,
            nickname: 'flip',
            vote: 3,
          },
        }));
      }
    }
    if (resp.type === 'someoneVoted') {
      t.context.sockets[1].send(JSON.stringify({
        type: 'disconnect',
        data: {
          game,
          nickname: 'flip',
        },
      }));
    }

    if (resp.type === 'clientDisconnect') {
      t.true(Scrummy.getGame(game).clients.length === 1);
      t.true(Scrummy.getGame(game).users.length === 1);
      t.true(!('flip' in Scrummy.getGame(game).votes));
      t.end();
    }
  });

  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { nickname },
  }));
});

test.serial.cb('Allows a vote to be revoked', (t) => {
  t.plan(1);
  const nickname = 'Taylor';
  let game;
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (_.get(resp, 'data.game')) {
      game = _.get(resp, 'data.game');
    }
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game: _.get(resp, 'data.game'),
          nickname,
          vote: 3,
        },
      }));
    }
    if (resp.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'revokeVote',
        data: {
          game,
          nickname,
        },
      }));
    }
    if (resp.type === 'clientRevoke') {
      t.is(Object.keys(resp.data.votes).length, 0);
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { nickname },
  }));
});

test.serial.cb('Disallows a vote to be revoked if the user hasn\'t voted', (t) => {
  t.plan(1);
  const nickname = 'Taylor';
  let game;
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (_.get(resp, 'data.game')) {
      game = _.get(resp, 'data.game');
    }
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game: _.get(resp, 'data.game'),
          nickname,
          vote: 3,
        },
      }));
    }
    if (resp.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'revokeVote',
        data: {
          game,
          nickname: 'Luke',
        },
      }));
    }
    if (resp.type === 'error') {
      t.is(resp.data.message, 'Luke has no votes to revoke!');
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { nickname },
  }));
});

test.serial.cb('Disallows a vote to be revoked if the respective game does not exist', (t) => {
  t.plan(1);
  const nickname = 'Taylor';
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'placeVote',
        data: {
          game: _.get(resp, 'data.game'),
          nickname,
          vote: 3,
        },
      }));
    }
    if (resp.type === 'someoneVoted') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'revokeVote',
        data: {
          game: 'notanactualgame',
          nickname,
        },
      }));
    }
    if (resp.type === 'error') {
      t.is(resp.data.message, 'notanactualgame does not exist!');
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { nickname },
  }));
});

test.serial.cb('Returns 0 for number of players if game does not exist', (t) => {
  t.plan(1);
  const game = 'notanactualgame';
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'playerCount') {
      t.is(resp.data.numPlayers, 0);
      t.end();
    }
  });
  t.context.sockets[0].send(JSON.stringify({
    type: 'getPlayerCount',
    data: { game },
  }));
});


test.serial.cb('Returns number of players of a given game', (t) => {
  t.plan(1);
  const nickname = 'Winston';
  const game = 'True American';
  t.context.sockets[0].on('message', (response) => {
    const resp = JSON.parse(response);
    if (resp.type === 'youSignedIn') {
      t.context.sockets[0].send(JSON.stringify({
        type: 'getPlayerCount',
        data: { game },
      }));
    }
    if (resp.type === 'playerCount') {
      t.is(resp.data.numPlayers, 1);
      t.end();
    }
  });

  t.context.sockets[0].send(JSON.stringify({
    type: 'signIn',
    data: { game, nickname },
  }));
});
