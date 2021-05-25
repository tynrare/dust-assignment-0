/**
 * @file top_view_camera.js
 * @author tynrare
 * @version 3
 * @module Game/Input
 */
import { math, Vector2, Vector3 } from 'hilo3d';
import CanvasAppEvents from './canvas_app_events'
const VEC3_ZERO = new Vector3();
const VEC3_UP = new Vector3(0, 1, 0);

const MOUSE = {
	LEFT: 0,
	MID: 1,
	RIGHT: 2
};

const STATE = {
	NONE: -1,
	MOVE: 0,
	ZOOM: 1,
	PAN: 2
};

/**
 * "Strategic" top-down view input:
 * Zoom with mouse and gestures, move with rigth click, zoom with scroll, rotate
 * with left click
 * #component Hilo3dCameraManager
 *
 * @property {PerspectiveCamera} _camera camera pointer
 */
class BasicTopDownCamera {
	/**
	 */
	properties = {
		moveSpeed: 0.05,
		rotationSpeed: 0.01,
		zoomSpeed: 0.001,
		mouseScrollClamp: 90
	};
	
	cache = {
		shift: new Vector3(),
		pivot: new Vector3(),
		mousePos: new Vector2()
	};

	mouseInfo = { startX: 0, startY: 0, pressed: false };

	/**
	 */
	init(camera) {
		this._camera = camera;

		CanvasAppEvents.window.events.on('wheel', (evt) => {
			evt.preventDefault();
			const deltaY = math.clamp(
				evt.deltaY,
				-this.properties.mouseScrollClamp,
				this.properties.mouseScrollClamp
			);
			const s = deltaY * this.properties.zoomSpeed;
			this.zoom(s);
		});
		CanvasAppEvents.window.events.on('mousedown', (evt) => this.onMouseDown(evt));
		CanvasAppEvents.window.events.on('mousemove', (evt) => this.onMouseMove(evt));
		CanvasAppEvents.window.events.on('mouseup', () => {
			this.mouseInfo.isDown = false;
			this.mouseInfo.state = STATE.NONE;
		});

		this.cache.pivot.set(0, 0, 0);
		this.cache.shift.subtract(this._camera.position, this.cache.pivot);

		this._updatePos();

		return this;
	}

	/**
	 * Moves camera around
	 * #chain
	 *
	 * @param {Vector3} location set new location
	 * @returns {BasicTopDownCamera} this
	 */
	setPivotLocation(location) {
		this.cache.pivot.copy(location);
		
		this._updatePos();

		return this;
	}

	/**
	 * Moves camera around
	 * #chain
	 *
	 * @param {Vector3} dir shift pos direction. Will be changed inplace
	 * @returns {BasicTopDownCamera} this
	 */
	move(dir) {
		this.cache.pivot.add(dir);

		this._updatePos();

		return this;
	}

	/**
	 * Rotates camera around
	 * #chain
	 *
	 * @param {number} x x angle
	 * @param {number} y y angle
	 * @returns {BasicTopDownCamera} this
	 */
	rotate(x, y) {
		/* eslint-disable */
		//this.cache.shift.rotateX(VEC3_ZERO, -y);
		this.cache.shift.rotateY(VEC3_ZERO, -x);

		this._updatePos();

		return this;
	}

	/**
	 * Zooms camera
	 * #chain
	 *
	 * @param {number} s scale value
	 * @returns {BasicTopDownCamera} this
	 */
	zoom(s) {
		this.cache.shift.scale(1 + s);

		this._updatePos();

		return this;
	}

	/**
	 * Sets camera in place where it has to be
	 *
	 * @private
	 */
	_updatePos() {
		this._camera.position.add(this.cache.pivot, this.cache.shift);
		this._camera.lookAt(this.cache.pivot);
	}

	/**
	 * @param {MouseEvent|TouchEvent} evt event
	 * @private
	 */
	onMouseDown(evt) {
		this.mouseInfo.isDown = true;
		if (evt.type === 'touchstart') {
			this.mouseInfo.startX = evt.touches[0].pageX;
			this.mouseInfo.startY = evt.touches[0].pageY;

			switch (evt.touches.length) {
				case 1:
					this.mouseInfo.state = STATE.MOVE;
					break;
				case 2: {
					const x = evt.touches[1].pageX - evt.touches[0].pageX;
					const y = evt.touches[1].pageY - evt.touches[0].pageY;
					this.mouseInfo.startPointerDistance = Math.sqrt(x * x + y * y);
					this.mouseInfo.state = STATE.ZOOM;
					break;
				}
				/* eslint-disable no-magic-numbers */
				case 3:
					this.mouseInfo.state = STATE.PAN;
					break;
				/* eslint-enable no-magic-numbers */
				// no default
			}
		} else {
			switch (evt.button) {
				case MOUSE.LEFT:
					this.mouseInfo.startX = evt.pageX;
					this.mouseInfo.startY = evt.pageY;
					this.mouseInfo.state = STATE.PAN;
					break;
				case MOUSE.RIGHT:
					this.mouseInfo.startX = evt.pageX;
					this.mouseInfo.startY = evt.pageY;
					this.mouseInfo.state = STATE.MOVE;
					break;
				// no default
			}
		}
	}

	/**
	 * @param {MouseEvent} evt event
	 * @private
	 */
	onMouseMove(evt) {
		this.cache.mousePos.set(evt.pageX, evt.pageY);

		if (!this.mouseInfo.isDown) {
			return;
		}
		evt.preventDefault();
		evt.stopPropagation();
		if (evt.type === 'touchmove') {
			switch (this.mouseInfo.state) {
				case STATE.MOVE:
					this._handlerToucheMove(evt);
					break;
				case STATE.ZOOM:
					this._handlerToucheZoom(evt);
					break;
				case STATE.PAN:
					//this._handlerTouchePan(evt);
					break;
				// no default
			}
		} else {
			switch (this.mouseInfo.state) {
				case STATE.MOVE:
					this._handlerMouseMove(evt);
					break;
				case STATE.PAN:
					//this._handlerMousePan(evt);
					break;
				// no default
			}
		}
	}

	/**
	 * @param {MouseEvent} evt event
	 * @private
	 */
	_handlerMousePan(evt) {
		const distanceX = evt.pageX - this.mouseInfo.startX;
		const distanceY = evt.pageY - this.mouseInfo.startY;
		this.mouseInfo.startX = evt.pageX;
		this.mouseInfo.startY = evt.pageY;

		const forward = this.cache.shift.clone();
		forward.y = 0;
		forward.normalize();

		const up = VEC3_UP;
		const right = new Vector3().cross(up, forward).normalize();
		right.scale(distanceX);

		const vector = forward.scale(distanceY).add(right);
		this.move(vector.scale(this.properties.moveSpeed));
	}

	/**
	 * @param {MouseEvent} evt event
	 * @private
	 */
	_handlerMouseMove(evt) {
		const distanceX = evt.pageX - this.mouseInfo.startX;
		const distanceY = evt.pageY - this.mouseInfo.startY;
		this.mouseInfo.startX = evt.pageX;
		this.mouseInfo.startY = evt.pageY;

		this.rotate(distanceX * this.properties.rotationSpeed, distanceY * this.properties.rotationSpeed);
	}

	/**
	 * @param {MouseEvent} evt event
	 * @private
	 */
	_handlerToucheZoom(evt) {
		const x = evt.touches[1].pageX - evt.touches[0].pageX;
		const y = evt.touches[1].pageY - evt.touches[0].pageY;
		const pointerDistance = Math.sqrt(x * x + y * y);
		let scale = 1;
		scale = pointerDistance / this.mouseInfo.startPointerDistance;
		this.mouseInfo.startPointerDistance = pointerDistance;
		if (scale !== 1) {
			this.zoom(scale);
		}
	}

	/**
	 * @param {MouseEvent} evt event
	 * @private
	 */
	_handlerTouchePan(evt) {
		const touch = evt.touches[0];
		const distanceX = touch.pageX - this.mouseInfo.startX;
		const distanceY = touch.pageY - this.mouseInfo.startY;
		this.mouseInfo.startX = touch.pageX;
		this.mouseInfo.startY = touch.pageY;
		this.move(new Vector3(distanceX, 0, distanceY).scale(this.properties.moveSpeed));
	}

	/**
	 * @param {MouseEvent} evt event
	 * @private
	 */
	_handlerToucheMove(evt) {
		const touch = evt.touches[0];
		this.handlerMouseMove(touch);
	}
}

export default BasicTopDownCamera;
