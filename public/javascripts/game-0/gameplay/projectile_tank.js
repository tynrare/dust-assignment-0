import { Node, math, Vector3, Vector2 } from 'hilo3d';

class ProjectileTank {
    hilo = new Node({name: 'ProjectileTank'});

    cache = {
        mesh: null,
        target: new Vector3(),
        start: new Vector3()
    }

    properties = {
        speed: 1
    }

    ownerid = 0

    init(start, target, ownerid) {
        this.ownerid = ownerid; 
        this.cache.target.copy(target);
        this.cache.start.copy(start);
        this.cache.mesh = window.game.debugDraw.makeSphere(7);
        this.hilo.addChild(this.cache.mesh);
        this.hilo.position.copy(start);
        this.hilo.position.y += 1.3;

        var normal = new Vector3().copy(target).subtract(start).normalize().scale(this.properties.speed);

        this.hilo.onUpdate = () => {
            this.hilo.position.add(normal);
            if (this.cache.start.distance(this.cache.target) <= this.cache.start.distance(this.hilo.position)) {
                this.dispose();
            }
        }

        return this;
    }

    dispose () {
        this.hilo.removeFromParent();
    }
}

export default ProjectileTank;