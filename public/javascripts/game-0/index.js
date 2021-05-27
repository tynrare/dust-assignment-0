var { stage, camera } = require("./Hilo3d/init.js")
import ResourcesManager from './resources_manager';

import { BasicTopDownCamera } from './input/index'
import DefaultDevHiloEnvMap from './gameplay/dev_default_env'
import HiloDebugHelper from './Hilo3d/hilo_debug_helper';

import MultiplayerManager from './gameplay/multiplayer'
import CharacterTank from './gameplay/character_tank';
import { Vector3 } from 'hilo3d';
import ProjectileTank from './gameplay/projectile_tank';

function main() {
    function tick(){
        const hardcodedDt = 10;
        stage.tick(hardcodedDt);
        requestAnimationFrame(tick);
    }
    tick();

    stage.addChild(new Hilo3d.AxisHelper({
        size: 1
    }));

    stage.addChild(new DefaultDevHiloEnvMap().init())

    const characters = {};
    const resmanager = new ResourcesManager();
    const multplmanager = new MultiplayerManager();
    const cameramanager = new BasicTopDownCamera().init(camera);
    const debugDraw = new HiloDebugHelper();
    stage.addChild(debugDraw.init().hilo)

    function spawnCharacter(id) {
        const character = new CharacterTank();
        characters[id] = character;
        stage.addChild(character.init(id, id == multplmanager.userid).hilo);

        return character;
    }

    resmanager.preload().then(() => {
        // --- MULTIPLAYER
        multplmanager.init();

        multplmanager.events.on('spawnplayer', (message) => {
           spawnCharacter(message.userid);
        });
        multplmanager.events.on('gametick', (message) => {
            for(const i in message) {
                const characterdata = message[i];
                let character = characters[characterdata.userid];
                if(!character) {
                    character = spawnCharacter(characterdata.userid);
                }

                if(character.local) continue;

                character.updateRemote(characterdata);
            }
        });
        multplmanager.events.on('spawnprojectile', (message) => {
            const projectile = new ProjectileTank().init(
                new Vector3(message.position[0], message.position[1], message.position[2]),
                new Vector3(message.aimPosition[0], message.aimPosition[1], message.aimPosition[2]),
                message.userid
                );
            stage.addChild(projectile.hilo);
        });
    });

    window.game.cameramanager = cameramanager;
    window.game.resmanager = resmanager;
    window.game.debugDraw = debugDraw;
    window.game.multplmanager = multplmanager;
}

main();