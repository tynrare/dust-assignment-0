const WebSocket = require('ws');

const clients = {};
const transforms = {};
let connections = 0;

// Set up a headless websocket server that prints any
// events that come in.
const wsServer = new WebSocket.Server({ clientTracking: false, noServer: true });
wsServer.on('connection', (socket, request) => {
  
  socket.on('message', message => {
    const m = JSON.parse(message);

    switch (m.action) {

      // --- LOGIN
      case 'login':
        const userid = connections++;
        clients[userid] = socket;
        socket.userid = userid;
        send(socket, 'login', { userid });
        broadcast('spawnplayer', { userid });
        break;

      // --- CHARACTERTICK
      case 'charactertick':
        transforms[m.userid] = Object.assign({userid: m.userid}, m.data);
        break;

      // --- SPAWNPROJECTILE
      case 'spawnprojectile':
        broadcast('spawnprojectile', Object.assign({userid: m.userid}, m.data))
        break;
    }

  });
});

function tick(){
  broadcast('gametick', transforms);
  setTimeout(tick, 10);
}
tick();

function send(client, action, data){
  const message = {
      action,
      data
  }
  client.send(JSON.stringify(message));
}

function broadcast(action, data){
  for(const i in clients) {
    const socket = clients[i];
    send(socket, action, data);
  }
}

module.exports = wsServer