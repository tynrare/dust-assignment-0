import EventsBase from '../utils/events_base';

const loginData = {
    id: 0,
    name: "null"
}

class MultiplayerManager {
    userid = 0;

	events = new EventsBase();

    init() {
        this.client = new WebSocket('ws://localhost:3000');

        this.client.onopen = () => {
            this.send('login', loginData);
        };

        this.client.onmessage = (message) => {
            this.reseive(JSON.parse(message.data));
        }

        return this;
    }

    // shoot (position, target)
    // enter
    // update (position, rotation, towerRotation)

    send(action, data){
        const message = {
            userid: this.userid,
            action,
            data
        }
        this.client.send(JSON.stringify(message));
    }

    reseive(message) {
        switch (message.action) {
            case 'login':
                this.userid = message.data.userid;
                break;
            case 'spawnplayer':
                this.events.emit('spawnplayer', message.data)
                break;
            case 'gametick':
                this.events.emit('gametick', message.data);
                break;
            case 'spawnprojectile':
                this.events.emit('spawnprojectile', message.data)
                break;
        }
    }
}

export default MultiplayerManager;