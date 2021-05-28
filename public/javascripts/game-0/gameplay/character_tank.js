import { Node, math, Vector3, Vector2 } from 'hilo3d';
import properties from '../input/canvas_app_events';
var { stage, camera } = require("../Hilo3d/init.js")
import { map } from '../math';
import CanvasAppEvents from '../input/canvas_app_events'
import { intersectRayOnPlane } from '../math';
import ProjectileTank from './projectile_tank';
const VEC3_ZERO = new Vector3();

class CharacterTank {

    hilo = new Node({name: 'CharacterTank'});

    ray = new Hilo3d.Ray();

    userid = 0;

    local = true;

    properties = {
        movementSpeed: 0.1,
        rotationSpeed: 1,
        maxHealth: 10
    }

    cache = {
        rotationMovement: 0,
        forawrdMovement: 0,
        Vec3_tmp0: new Vector3(),
        Vec3_tmp1: new Vector3(),
        glbScene: null,
        aimPosition: new Vector3(),
        towerRotation: new Vector3(),
        health: -1
    }

    init(userid, local = true) {
        // --- VARIABLES
        this.cache.health = this.properties.maxHealth;
        this.userid = userid;
        this.local = local;
        this.cache.glbScene = window.game.resmanager.getSceneClone('tank');
        this.hilo.addChild(this.cache.glbScene);
        this.hilo.rotationY = 180;

        // --- DOM
        const element = document.createElement('span');
        const container =  document.getElementById('container')
        element.classList = 'game onscreen';
        container.insertBefore(element, container.firstChild);
        this.healthDom = element

        // --- LOCAL LOGIC
        if (local) {
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


        }

        this.hilo.onUpdate = () => {
            if (local) {
                this.updateInputs();
                this.updateMouse();
                this.sendRemove();
            }
            this.updateGui();
        }

        return this;
    }

    updateGui() {
        const vec = this.cache.Vec3_tmp0.copy(this.hilo.position);
        vec.y += 2;
        var pos = camera.projectVector(vec, stage.width, stage.height);
            
        const cameradist = window.game.cameramanager.cache.shift.length();

        //element.style.transform = 'translate3d(' + pos.x + 'px,' + pos.y + 'px, 0px)';
        this.healthDom.style.left = pos.x + 'px';
        this.healthDom.style.top = pos.y + 'px';
        this.healthDom.style.fontSize = 30 - map(cameradist, 5, 50, 0, 20) + 'px';
        this.healthDom.innerHTML = `${this.cache.health}/${this.properties.maxHealth}`;
    }

    updateRemote(data) {
        this.hilo.position.set(data.position[0], data.position[1], data.position[2])
        this.hilo.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2])

        var tower = this.cache.glbScene.getChildByName("Tank.Tower");
        tower.rotation.set(data.towerRotation[0], data.towerRotation[1], data.towerRotation[2])
    }

    shoot() {
        //const projectile = new ProjectileTank().init(this.hilo.position, this.cache.aimPosition);
        //this.hilo.parent.addChild(projectile.hilo);
        
        window.game.multplmanager.send('spawnprojectile', {
            position: this.hilo.position.elements,
            aimPosition: this.cache.aimPosition.elements
        });
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
        this.cache.towerRotation.copy(tower.rotation);
    }

    updateInputs() {
        this.hilo.rotationY += this.cache.rotationMovement * this.properties.rotationSpeed;
        const vec = this.cache.Vec3_tmp0;
        vec.set(0, 0, this.cache.forawrdMovement);
        vec.rotateY(VEC3_ZERO, this.hilo.rotationY * (Math.PI / 180)).scale(this.properties.movementSpeed)
        this.hilo.position.add(vec);

        window.game.cameramanager.setPivotLocation(this.hilo.position)
    }

    sendRemove() {
        window.game.multplmanager.send('charactertick', {
            position: this.hilo.position.elements,
            aimPosition: this.cache.aimPosition.elements,
            rotation: this.hilo.rotation.elements,
            towerRotation: this.cache.towerRotation.elements
        })
    }

    applyDamage(by) {
        this.cache.health -= 1;
        if(this.cache.health <= 0) {
            window.game.multplmanager.send('characterdead', { who: this.userid, by });
        }
    }

    dispose() {
        this.cache.debugMesh?.removeFromParent();
        this.hilo.removeFromParent();
        this.healthDom.parentNode.removeChild(this.healthDom);
    }
}

export default CharacterTank;