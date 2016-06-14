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
