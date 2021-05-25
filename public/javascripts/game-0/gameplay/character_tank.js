import { Node, math, Vector3, Vector2 } from 'hilo3d';
import properties from '../input/canvas_app_events';
var { stage, camera } = require("../Hilo3d/init.js")
import CanvasAppEvents from '../input/canvas_app_events'
import { intersectRayOnPlane } from '../math';
import ProjectileTank from './projectile_tank';
const VEC3_ZERO = new Vector3();

class CharacterTank {

    hilo = new Node({name: 'CharacterTank'});

    ray = new Hilo3d.Ray();

    properties = {
        movementSpeed: 0.1,
        rotationSpeed: 1
    }

    cache = {
        rotationMovement: 0,
        forawrdMovement: 0,
        Vec3_tmp0: new Vector3(),
        Vec3_tmp1: new Vector3(),
        glbScene: null,
        aimPosition: new Vector3()
    }

    init() {
        this.cache.glbScene = window.game.resmanager.getSceneClone('tank');
        this.hilo.addChild(this.cache.glbScene);

		CanvasAppEvents.input.events.on('left', (evt) => {
            this.cache.rotationMovement = evt.down ? 1 : 0;
        });

        CanvasAppEvents.input.events.on('right', (evt) => {
            this.cache.rotationMovement = evt.down ? -1 : 0;
        });

        CanvasAppEvents.input.events.on('forward', (evt) => {
            this.cache.forawrdMovement = evt.down ? 1 : 0;
        });

        CanvasAppEvents.input.events.on('backward', (evt) => {
            this.cache.forawrdMovement = evt.down ? -1 : 0;
        });

        CanvasAppEvents.window.events.on('mousedown', (evt) => {
            if (evt.button === 0) { //LEFT click
                this.shoot();
            }
        })

        this.cache.debugMesh = window.game.debugDraw.makeSphere(10, '#555555');

        this.hilo.onUpdate = () => {
            this.updateInputs();
            this.updateMouse();
        }

        return this;
    }

    shoot() {
        const projectile = new ProjectileTank().init(this.hilo.position, this.cache.aimPosition);
        this.hilo.parent.addChild(projectile.hilo);
    }

    updateMouse() {
        var mousePos = window.game.cameramanager.cache.mousePos
        this.ray.fromCamera(camera, mousePos.x, mousePos.y, stage.width, stage.height);
        
        const position = intersectRayOnPlane(this.cache.Vec3_tmp0.set(0,0,0), this.cache.Vec3_tmp1.set(0,1,0), this.ray.origin, this.ray.direction);
        this.cache.debugMesh.position.copy(position);

        this.cache.aimPosition.copy(position);

        var tower = this.cache.glbScene.getChildByName("Tank.Tower");
        position.subtract(this.hilo.position);
        position.rotateY(VEC3_ZERO, -this.hilo.rotationY * (Math.PI / 180));
        tower.lookAt(position);
    }

    updateInputs() {
        this.hilo.rotationY += this.cache.rotationMovement * this.properties.rotationSpeed;
        const vec = this.cache.Vec3_tmp0;
        vec.set(0, 0, this.cache.forawrdMovement);
        vec.rotateY(VEC3_ZERO, this.hilo.rotationY * (Math.PI / 180)).scale(this.properties.movementSpeed)
        this.hilo.position.add(vec);

        window.game.cameramanager.setPivotLocation(this.hilo.position)
    }

    dispose() {
        this.hilo.removeFromParent();
    }
}

export default CharacterTank;