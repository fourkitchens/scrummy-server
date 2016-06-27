# scrummy-server

[![Four Kitchens](https://img.shields.io/badge/4K-Four%20Kitchens-35AA4E.svg?style=flat-square)](https://fourkitchens.com/)
[![Travis](https://img.shields.io/travis/fourkitchens/scrummy-server.svg?style=flat-square)](https://travis-ci.org/fourkitchens/scrummy-server/)
[![Codecov](https://img.shields.io/codecov/c/github/fourkitchens/scrummy-server.svg?style=flat-square)](https://codecov.io/gh/fourkitchens/scrummy-server)
[![Code Climate](https://img.shields.io/codeclimate/github/fourkitchens/scrummy-server.svg?style=flat-square)](https://codeclimate.com/github/fourkitchens/scrummy-server)
[![David Dependency Management](https://img.shields.io/david/fourkitchens/scrummy-server.svg?style=flat-square)](https://david-dm.org/fourkitchens/scrummy-server)
[![David Dependency Management (dev)](https://img.shields.io/david/dev/fourkitchens/scrummy-server.svg?style=flat-square)](https://david-dm.org/dev/fourkitchens/scrummy-server#info=devDependencies&view=table)

## Getting started

### Prerequisites

- Node 6.x

### Installing

- clone this repository
- install dependencies: `$ npm i`
- start the server: `$ npm start`

## Running the tests

### Tests

- run the tests: `$ npm t`
- generate and view test coverage: `$ npm run view-coverage`

- lint code: `$ npm run lint-code`
- lint writing: `$ npm run lint-writing`

## Usage

This example code ran in Chrome; your mileage may vary.

### Sending messages

```js
const myScrummyClient = new WebSocket('ws://localhost:8080');
myScrummyClient.send(JSON.stringify({
  type: 'signIn',
  nickname: 'tsmith512',
}));
```

### Receiving messages

```js
const myScrummyClient = new WebSocket('ws://localhost:8080');
myScrummyClient.onmessage = response => {
  console.log(JSON.parse(response.data));
};
```

<a name="Scrummy"></a>

## Scrummy
**Kind**: global class  

* [Scrummy](#Scrummy)
    * [new Scrummy()](#new_Scrummy_new)
    * [.setupMessageHandling()](#Scrummy+setupMessageHandling) ⇒ <code>undefined</code>
    * [.shutdown()](#Scrummy+shutdown) ⇒ <code>undefined</code>
    * [.broadcast(data, clients)](#Scrummy+broadcast) ⇒ <code>undefined</code>
    * [.handleError(message, ws)](#Scrummy+handleError) ⇒ <code>undefined</code>
    * [.signIn(data, ws)](#Scrummy+signIn) ⇒ <code>undefined</code>
    * [.placeVote(data, ws)](#Scrummy+placeVote) ⇒ <code>undefined</code>
    * [.reset(data)](#Scrummy+reset) ⇒ <code>undefined</code>
    * [.reveal(data)](#Scrummy+reveal) ⇒ <code>undefined</code>
    * [.revokeVote(data)](#Scrummy+revokeVote) ⇒ <code>undefined</code>
    * [.disconnect(data)](#Scrummy+disconnect) ⇒ <code>undefined</code>

<a name="new_Scrummy_new"></a>

### new Scrummy()
constructor
  Creates a new Scrummy server.

  Starts a websocket server on the port specified in config, creates an empty bucket for
  storing game related data, specifies which methods are available for invocation via websocket
  message, and sets up websocket message handling.

<a name="Scrummy+setupMessageHandling"></a>

### scrummy.setupMessageHandling() ⇒ <code>undefined</code>
setupMessageHandling
  Sets up listeners for messages once a connection to the websocket server has been made.

  If the message type is one of the exposed methods, it is executed with the parsed message and
  the websocket as arguments. Otherwise, the message is rejected.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  
<a name="Scrummy+shutdown"></a>

### scrummy.shutdown() ⇒ <code>undefined</code>
shutdown
  Shuts down the websocket server.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  
<a name="Scrummy+broadcast"></a>

### scrummy.broadcast(data, clients) ⇒ <code>undefined</code>
broadcast
  Sends the provided message to all matching clients.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>String</code> | The message to send. |
| clients | <code>Array</code> | The clients to send the message to. |

<a name="Scrummy+handleError"></a>

### scrummy.handleError(message, ws) ⇒ <code>undefined</code>
handleError
  Sends an error to the client.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The error message to send. |
| ws | <code>Object</code> | The client to send the message to. |

<a name="Scrummy+signIn"></a>

### scrummy.signIn(data, ws) ⇒ <code>undefined</code>
signIn
  Signs a user in if they have provided a valid username.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The signIn message from the client. |
| ws | <code>Object</code> | The websocket to respond to. |

<a name="Scrummy+placeVote"></a>

### scrummy.placeVote(data, ws) ⇒ <code>undefined</code>
placeVote
  Places a vote on behalf of a client if the vote and game are valid.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The signIn message from the client. |
| ws | <code>Object</code> | The websocket to respond to. |

<a name="Scrummy+reset"></a>

### scrummy.reset(data) ⇒ <code>undefined</code>
reset
  Resets the given game.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The message from the client. |

<a name="Scrummy+reveal"></a>

### scrummy.reveal(data) ⇒ <code>undefined</code>
reveal
  Broadcasts a reveal event to the appropriate game.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The message from the client. |

<a name="Scrummy+revokeVote"></a>

### scrummy.revokeVote(data) ⇒ <code>undefined</code>
revokeVote
  Revokes a vote and broadcasts change.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The message from the client. |

<a name="Scrummy+disconnect"></a>

### scrummy.disconnect(data) ⇒ <code>undefined</code>
Disconnects a client from the given game.

**Kind**: instance method of <code>[Scrummy](#Scrummy)</code>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The message from the client. |


## Contributors

![Four Kitchens](https://avatars.githubusercontent.com/u/348885?s=130) | ![Taylor](https://avatars.githubusercontent.com/u/1486573?s=130) | ![Flip](https://avatars.githubusercontent.com/u/1306968?s=130) | ![Luke](https://avatars.githubusercontent.com/u/1127238?s=130)
--- | --- | --- | ---
[Four Kitchens](https://github.com/fourkitchens) | [Taylor](https://github.com/tsmith512) | [Flip](https://github.com/flipactual) | [Luke](https://github.com/infiniteluke)
## License

MIT @ [Four Kitchens](https://github.com/fourkitchens)
