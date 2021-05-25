/**
 * @file event_thingy.js
 * @author tynrare
 * @version 2
 * @module Exchange
 */

import { EventEmitter } from 'events';

const CALLBACH_FUNC_POSTFIX = 'Callback';

/**
 * Event management based on Thingy
 */
class EventsBase {
	cacheEvents = {}
	lowlevel = new EventEmitter();

	/**
	 * @param {string} type event name. Or path to node
	 * @param {Function} callback .
	 * @returns {string} event id
	 * @example
	 * on('/prop/prop.event') //will listen event from
	 * rootnode.prop.prop.on('event')
	 */
	on(type, callback) {
		return this.registerListener(type, callback, 'on');
	}

	/**
	 * @param {string} type event name
	 * @param {Function} callback .
	 * @returns {string} event id
	 */
	once(type, callback) {
		return this.registerListener(type, callback, 'once');
	}

	/**
	 * @param {string} key id fenereted by 'on'
	 */
	off(key) {
		const evt = this.cacheEvents[key];
		if (evt) {
			evt.listener.lowlevel.off(evt.type, evt.callback);
			this.del(key);
		}
	}

	/**
	 * Listens any other event and emits it
	 *
	 * @param {string} type event name
	 */
	pipe(type) {
		const id = this.on(type, (...args) => {
			const t = this.cacheEvents[id].type;
			this.emit(t, ...args);
		});
	}

	/**
	 * @param {string} type event name
	 * @param {Function} callback .
	 * @param {string} func function to call in EventEmitter
	 * @returns {string} event id
	 */
	registerListener(type, callback, func = 'on') {
		/* eslint-disable consistent-this */
		let evt = type;
		let listener = this;

		const dotpos = evt.lastIndexOf('.');
		if (dotpos >= 0) {
			listener = this.owner.path(evt.substring(0, dotpos)).events;
			evt = evt.substring(dotpos + 1);
		}
		/* eslint-enable consistent-this */

		const id = this.cacheEvents[evt] = { type: evt, callback, listener };
		listener.lowlevel[func](evt, callback);

		return id;
	}

	/**
	 * Will emit event and call function %type%Callback on owner
	 *
	 * @param {string} type event name
	 * @param {Array} args list of arguments
	 */
	emit(type, ...args) {
		this.lowlevel.emit(type, ...args);

		// call owner %type%Callback function if it exists
		const funcName = type + CALLBACH_FUNC_POSTFIX;
		const func = this.owner?.get(funcName) ?? this.owner?.[funcName];
		if (func) {
			func.apply(this.owner, args);
		}
	}

	/**
	 * @override
	 * @fires Thingy#init
	 * @fires Thingy#preinit
	 */
	init(owner) {
		super.init(owner);

		/**
		 * preinit alias
		 *
		 * @event Thingy#init
		 * @type {Thingy?} owner if exists
		 */
		this.emit('init', owner);

		/**
		 * Event triggered before all properties init
		 *
		 * @event Thingy#preinit
		 * @type {Thingy?} owner if exists
		 */
		this.emit('preinit', owner);
	}

	/**
	 * Disposes self and all properties
	 *
	 * @fires Thingy#dispose
	 */
	dispose() {
		/**
		 * Fires before childs disposion
		 *
		 * @event Thingy#dispose
		 */
		this.emit('dispose');

		super.dispose();
		for (const k in this.cacheEvents) {
			this.off(k);
		}
	}
}

export default EventsBase;
export { EventsBase };
