/**
 * @file basic_orbital_camera.js
 * @author tynrare
 * @version 3
 * @module Game/Input
 */
import { Matrix4, Euler, Vector2, PerspectiveCamera, Quaternion, Vector3 } from 'hilo3d';
import { PERFECT_NUMBER, clamp, lerp } from '../math';

/**
 * Orbital camera
 *
 * #component Hilo3dCameraManager
 */
class BasicOrbitalCamera {
	properties = {
		rotationMax: 100,
		rotationFriction: 0.12,
		zoomFriction: 0.4,
		zoomSpeed: PERFECT_NUMBER,
		rotationSpeed: PERFECT_NUMBER,
		distance: 5,
		zoomMin: PERFECT_NUMBER
	};

	/**
	 * caches camera path. По идее придется дорабатывать возможность как-то
	 * кешировать путь find'a, потому что если заменить объект, на который
	 * указывал старый файнд, то на старом он и останется #chain
	 *
	 * @override
	 */
	initCallback() {
		this.set('camera', this.path('../camera'));

		this.on('/env/window.mousedown', this.onMouseDown);
		this.on('/env/window.mousemove', this.onMouseMove);
		this.on('/env/window.mouseup', () => {
			this.mouseInfo.pressed = false;
		});
		this.on('/env/window.wheel', this.onMouseWheel);
		this.on('/env/time.frame', this.frame);

		this.frame();
	}

	/**
	 * @private
	 */
	frame() {
		const dir = this.cache.direction;
		const pos = this.cache.position;

		const m = this.cache.buffmatrix;
		const v = this.cache.buffvec3;
		const q = this.cache.buffquat;

		// zoom
		this.properties.distance = Math.max(
			0,
			this.properties.distance +
				this.cache.zoom * this.properties.zoomSpeed * Math.sqrt(this.properties.distance)
		);
		this.properties.distance = lerp(
			this.properties.distance,
			Math.max(this.properties.distance, this.properties.zoomMin),
			0.5
		);

		// rotation
		this.cache.buffeuler.y -= dir.x * this.properties.rotationSpeed;
		this.cache.buffeuler.x -= dir.y * this.properties.rotationSpeed;
		this.cache.buffeuler.x = lerp(
			this.cache.buffeuler.x,
			clamp(this.cache.buffeuler.x, -Math.PI / 2, Math.PI / 2),
			0.5
		);

		q.fromEuler(this.cache.buffeuler);
		m.fromRotationTranslation(q, v.copy(pos));
		m.translate(v.set(0, 0, 1).scale(this.properties.distance));

		this.camera.quaternion.fromMat4(m);
		this.camera.position.copy(m.getTranslation(v));

		this.rotate(0, 0);
		this.zoom(0);
	}

	/**
	 * @param {MouseEvent|TouchEvent} evt event
	 * @private
	 */
	onMouseDown(evt) {
		this.mouseInfo.pressed = true;
		this.mouseInfo.startX = evt.clientX;
		this.mouseInfo.startY = evt.clientY;
	}

	/**
	 * @param {MouseEvent} evt event
	 * @private
	 */
	onMouseMove(evt) {
		if (!this.mouseInfo.pressed) {
			return;
		}

		const INPUT_CLAMP = 100;

		const x = clamp(evt.movementX, -INPUT_CLAMP, INPUT_CLAMP) / INPUT_CLAMP;
		const y = clamp(evt.movementY, -INPUT_CLAMP, INPUT_CLAMP) / INPUT_CLAMP;

		this.rotate(x, y);
	}

	/**
	 * @param {WheelEvent} evt .
	 */
	onMouseWheel(evt) {
		this.zoom(evt.deltaY);
	}

	/**
	 * Clamps [-1, 1]
	 *
	 * @param {number} x .
	 * @param {number} y .
	 */
	rotate(x, y) {
		const b = this.cache.buffvec2.set(clamp(x, -1, 1), clamp(y, -1, 1));
		this.cache.direction.lerp(b, this.properties.rotationFriction);
	}

	/**
	 * Clamps [-1, 1]
	 *
	 * @param {number} dir movement diraction
	 */
	zoom(dir) {
		const v = clamp(dir, -1, 1);
		this.cache.zoom = lerp(this.cache.zoom, v, this.properties.zoomFriction);
	}

	cache = {
		zoom: 0,
		distance: 0,
		direction: new Vector2(),
		position: new Vector3(0, 0, 0),
		buffquat: new Quaternion(),
		buffeuler: new Euler(-1, 0, 0),
		buffvec2: new Vector2(),
		buffvec3: new Vector3(),
		buffmatrix: new Matrix4()
	};

	mouseInfo = { startX: 0, startY: 0, pressed: false };

	/**
	 * @returns {PerspectiveCamera} .
	 */
	get camera() {
		return this.get('camera');
	}
}

export default BasicOrbitalCamera;
