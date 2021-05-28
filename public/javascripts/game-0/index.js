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

    stage.addChild(new Hilo3d.AxisHelper({
        size: 1
    }));

    stage.addChild(new DefaultDevHiloEnvMap().init())

    const characters = {};
    const projectiles = [];
    const resmanager = new ResourcesManager();
    const multplmanager = new MultiplayerManager();
    const cameramanager = new BasicTopDownCamera().init(camera);
    const debugDraw = new HiloDebugHelper();
    stage.addChild(debugDraw.init().hilo)

    function spawnCharacter(id) {
        const character = new CharacterTank();
        character.hilo.position.set(Math.random() * 50 - 25, 0, Math.random() * 50 - 25)
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
        multplmanager.events.on('despawnplayer', (message) => {
            characters[message.userid].dispose();
            delete characters[message.userid];
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
                projectiles.push(projectile);
            stage.addChild(projectile.hilo);
        });

        multplmanager.events.on('applydamage', (message) => {
            characters[message.to].applyDamage(message.by);
        });

        let frags = 0;
        const kills = [];
        multplmanager.events.on('characterdead', (message) => {
            if(message.who === multplmanager.userid) {
                multplmanager.dispose();
                characters[message.who].dispose();
                delete characters[message.who];
                document.getElementById('youaredeadMessage').style.display = 'unset';
            }
            if(message.by === multplmanager.userid && kills.indexOf(message.who) < 0) {
                kills.push(message.who);
                document.querySelector("#fragsMessage a").innerHTML = `Frags: ${++frags}`;
            }
        });
    });


    // --- GAMELOOP
    function tick(){
        const hardcodedDt = 10;
        try {
            stage.tick(hardcodedDt);
        } catch(err) {
            console.error(err);
            return;
        }
        
        // Projectiles collisions
        for (const p in projectiles) {
            const projectile = projectiles[p];
            
            if (!projectile.hilo.parent) {
                projectiles.splice(p, 1);
                continue;
            }

            if (projectile.ownerid != multplmanager.userid) continue;

            for (const c in characters) {
                const character = characters[c];
                if(character.userid === projectile.ownerid) continue;

                if(character.hilo.position.distance(projectile.hilo.position) <= 3) {
                    window.game.multplmanager.send('applydamage', { by: projectile.ownerid, to: character.userid });
                    projectiles.splice(p, 1);
                }
            }
        }

        requestAnimationFrame(tick);
    }
    tick();

    window.game.cameramanager = cameramanager;
    window.game.resmanager = resmanager;
    window.game.debugDraw = debugDraw;
    window.game.multplmanager = multplmanager;
}

main();