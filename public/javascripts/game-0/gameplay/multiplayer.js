import EventsBase from '../utils/events_base';

const loginData = {
    id: 0,
    name: "null"
}

class MultiplayerManager {
    userid = 0;

	events = new EventsBase();

    init() {
        const loc = location.host;
        const protocol = location.protocol == "https:" ? "wss" : "ws";
        this.client = new WebSocket(`${protocol}://${loc}`);

        this.client.onopen = () => {
            this.send('login', loginData);
        };

        this.client.onmessage = (message) => {
            this.reseive(JSON.parse(message.data));
        }

        return this;
    }

    dispose() {
        this.client.close();
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
            case 'despawnplayer':
                this.events.emit('despawnplayer', message.data)
                break;
            case 'gametick':
                this.events.emit('gametick', message.data);
                break;
            case 'spawnprojectile':
                this.events.emit('spawnprojectile', message.data)
                break;
            case 'applydamage':
                this.events.emit('applydamage', message.data)
                break;
            case 'characterdead':
                this.events.emit('characterdead', message.data)
                break;
        }
    }
}

export default MultiplayerManager;
