var { stage, camera } = require("./Hilo3d/init.js")
import ResourcesManager from './resources_manager';
import { BasicTopDownCamera } from './input/index'
import DefaultDevHiloEnvMap from './gameplay/dev_default_env'
import CharacterTank from './gameplay/character_tank';
import HiloDebugHelper from './Hilo3d/hilo_debug_helper';
import CanvasAppEvents from './input/canvas_app_events'

function main() {
    Hilo3d.AliAMCExtension.useAuto = true;
    Hilo3d.AliAMCExtension.useWASM = true;
    Hilo3d.AliAMCExtension.useWebWorker = true;

    function tick(){
        const hardcodedDt = 10;
        stage.tick(hardcodedDt);
        requestAnimationFrame(tick);
    }
    tick();
    CanvasAppEvents.time.events.on('frame', ()=>{
    });

    stage.addChild(new Hilo3d.AxisHelper({
        size: 1
    }));

    stage.addChild(new DefaultDevHiloEnvMap().init())

    const cameramanager = new BasicTopDownCamera().init(camera);
    const resmanager = new ResourcesManager();
    const character = new CharacterTank();
    const debugDraw = new HiloDebugHelper();
    stage.addChild(debugDraw.init().hilo)

    resmanager.preload().then(() => {
        stage.addChild(character.init().hilo);
    });

    window.game.cameramanager = cameramanager;
    window.game.resmanager = resmanager;
    window.game.debugDraw = debugDraw;
}

main();