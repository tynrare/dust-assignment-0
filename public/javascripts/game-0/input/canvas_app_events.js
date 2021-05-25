/* eslint-disable max-classes-per-file */
/**
 * @file canvas_app_events.js
 * @author tynrare
 * @version 3
 * @module Engine
 */
import EventsBase from '../utils/events_base';
import Delays from '../utils/delays';
import logger from '../utils/logger-public';
import { canvas } from '../Hilo3d/init';

/**
 * Manages events for
 */
class WindowEvents {

	events = new EventsBase();

	eventsCache = {}

	/**
	 * Init handler. Listens events data
	 */
	init(canvas) {
		this.addEvent('resize', window);

		try {
			this.addEvent('keydown', document);
			this.addEvent('keyup', document);

			this.addEvent('wheel', canvas);
			if ('ontouchmove' in window) {
				this.addEvent('touchstart', canvas, 'mousedown');
				this.addEvent('touchmove', canvas, 'mousemove');
				this.addEvent('touchend', canvas, 'mouseup');
			} else {
				this.addEvent('contextmenu', document);
				this.addEvent('mousedown', canvas);
				this.addEvent('mousemove', canvas);
				this.addEvent('mouseup', canvas);
			}
		} catch (err) {
			logger.groupWarn(
				'CORE_WARNS',
				`AppEventsWrapper: Canvas events init error, make sure Hilo3dEngineThingy on right place`,
				err
			);
		}

		return this;
	}

	/**
	 * @param {string} type event name to listen
	 * @param {object} element dom element to listen on
	 * @param {string} alias event name to fire
	 */
	addEvent(type, element, alias = type) {
		const func = (evt) => {
			this.events.emit(alias, evt);
		};
		element.addEventListener(type, func);

		this.eventsCache[type] = { type, func, element };
	}

	/**
	 * removes events
	 */
	dispose() {
		for (const k in this.eventsCache) {
			const e = this.eventsCache[k];
			e.element.removeEventListener(e.type, e.func);
		}
	}
}

/**
 * Manages events for
 */
class InputEvents {

	events = new EventsBase();

	windowEvents = new WindowEvents().init(canvas);

	/* eslint-disable complexity, max-lines-per-function */
	/**
	 * @fires input#left
	 * @fires input#leftup
	 * @fires input#leftdown
	 * @fires input#right
	 * @fires input#rightup
	 * @fires input#rightdown
	 */
	init() {
		this.windowEvents.init();

		this.windowEvents.events.on('keydown', (event) => {
			if (!event.repeat) {
				this.keypress(event, true);
			}
		});
		this.windowEvents.events.on('keyup', (event) => {
			if (!event.repeat) {
				this.keypress(event, false);
			}
		});

		return this;
	}

	/**
	 * @param {object} event .
	 * @param {boolean} down was button down or up
	 */
	keypress(event, down) {
		const action = down ? 'down' : 'up';
		switch (event.code) {
			case 'KeyA':
			case 'KeyH':
				/**
				 * @event input#leftup
				 * @type {KeyboardEvent}
				 */
				/**
				 * @event input#leftdown
				 * @type {KeyboardEvent}
				 */
				this.events.emit('left' + action, event);
				/**
				 * @event input#left
				 * @type {object}
				 * @property {KeyboardEvent} event
				 * @property {boolean} down
				 */
				this.events.emit('left', { event, down });
				break;
			case 'KeyD':
			case 'KeyL':
				/**
				 * @event input#rightup
				 * @type {KeyboardEvent}
				 */
				/**
				 * @event input#rightdown
				 * @type {KeyboardEvent}
				 */
				this.events.emit('right' + action, event);
				/**
				 * @event input#right
				 * @type {object}
				 * @property {KeyboardEvent} event
				 * @property {boolean} down
				 */
				this.events.emit('right', { event, down });
				break;
			case 'KeyW':
			case 'KeyK':
				/**
				 * @event input#forwardup
				 * @type {KeyboardEvent}
				 */
				/**
				 * @event input#forwarddown
				 * @type {KeyboardEvent}
				 */
				this.events.emit('forward' + action, event);
				/**
				 * @event input#forward
				 * @type {object}
				 * @property {KeyboardEvent} event
				 * @property {boolean} down
				 */
				this.events.emit('forward', { event, down });
				break;
			case 'KeyS':
			case 'KeyJ':
				/**
				 * @event input#backwardup
				 * @type {KeyboardEvent}
				 */
				/**
				 * @event input#backwarddown
				 * @type {KeyboardEvent}
				 */
				this.events.emit('backward' + action, event);
				/**
				 * @event input#backward
				 * @type {object}
				 * @property {KeyboardEvent} event
				 * @property {boolean} down
				 */
				this.events.emit('backward', { event, down });
				break;
			case 'Space':
				/**
				 * @event input#spaceup
				 * @type {KeyboardEvent}
				 */
				/**
				 * @event input#spacedown
				 * @type {KeyboardEvent}
				 */
				this.events.emit('space' + action, event);
				/**
				 * @event input#space
				 * @type {object}
				 * @property {KeyboardEvent} event
				 * @property {boolean} down
				 */
				this.events.emit('space', { event, down });
				break;
			case 'Escape':
				/**
				 * @event input#spaceup
				 * @type {KeyboardEvent}
				 */
				/**
				 * @event input#spacedown
				 * @type {KeyboardEvent}
				 */
				this.events.emit('esc' + action, event);
				/**
				 * @event input#space
				 * @type {object}
				 * @property {KeyboardEvent} event
				 * @property {boolean} down
				 */
				this.events.emit('esc', { event, down });
				break;
			//no default
		}
	}
	/* eslint-enable complexity, max-lines-per-function */
}

/**
 * Manages events for
 */
class TimeEvents {

	events = new EventsBase();

	properties =  {
		fps: 60,
		strictLoop: true,
		frame: 0
	};

	/**
	 * Init handler. Listens events data
	 */
	init() {
		this.nextFrame();
	}

	/**
	 * Removes interval
	 */
	dispose() {
		Delays.clearInterval(this._frameId);
	}

	/**
	 * Triggers next frame events
	 *
	 * @private
	 */
	nextFrame() {
		const interval = 1000 / this.properties.fps;

		/* eslint-disable max-statements */
		const id = Delays.timeout(() => {

			try {
				this.properties.frame += 1;
				this.events.emit('frame', this.properties.frame);
				this.nextFrame();
			} catch (err) {
				if (this.properties.strictLoop) {
					// #draft
					logger.error('(/env/time.strictLoop) Critical error in main loop:', err);
					{
						const el = document.createElement('div');
						el.classList.add('error-notify');

						const a = document.createElement('a');
						a.innerHTML = 'Critical error! Press [Space] to ';

						const b = document.createElement('button');
						b.innerHTML = 'restart';
						b.onclick = () => {
							this.events.emit('app_restart_input');
						};

						el.appendChild(a);
						el.appendChild(b);

						document.getElementById('app-root').appendChild(el);
					}

					this.owner.events.emit('critical_error');
				} else {
					this.nextFrame();
				}
			}
		}, interval);
		this._frameId = id;
		/* eslint-enable max-statements */
	}
}

/**
 * Class wraps and emits canvas, window, and input events
 */
class CanvasAppEvents {
	/**
	 * @override
	 */
}

const input = new InputEvents().init();;
const properties = {
	input,
	window: input.windowEvents,
	time: new TimeEvents().init(),
};

export default properties; 
export { CanvasAppEvents, WindowEvents, TimeEvents };
