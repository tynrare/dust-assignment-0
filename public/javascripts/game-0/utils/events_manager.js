/**
 * @file events_manager.js
 * @author tynrare
 * @version 1
 * @module Core/Utils/EventsManager
 */

import CoreEvents from 'events';
//импортим напрямую просто чтоб избежать рекурсивных включений
import logger from './logger-public'

const MAX_LISTENERS = 100;

/**
 * singletone class for managing events
 *
 * @static
 */
class EventsManager extends CoreEvents {
	_listenersCount = 0;

	_listeners = new Map();

	/**
	 * constructs
	 */
	constructor() {
		super();
		this.setMaxListeners(MAX_LISTENERS);
	}

	/**
	 * init function call it somewhere in game clean/enter
	 */
	init() {
		this._listenersCount = 0;
		this._listeners.forEach(({ id, func }) => {
			this.removeListener(id, func);
		});
	}

	/**
	 * disables all listeners in selected group
	 *
	 * @param {string} group group to disable
	 */
	discard(group) {
		this._listeners.forEach((listener) => {
			if (listener.group === group) {
				this.removeListener(listener.id, listener.func);
			}
		});
	}

	/* eslint-disable max-params */
	/**
	 * adds listener
	 *
	 * @param {string} id id of event
	 * @param {Function} callback callback function
	 * @param {*?} [context=null] scope to apply function to
	 * @param {string} [group='default'] group to add listener to. Used for 'discard()' cleanups
	 * @returns {number} id of listener
	 */
	on(id, callback, context = null, group = 'default') {
		logger.group(
			logger.groups.CORE_EVENTS,
			`listen (${group}) event _${this._listenersCount} "${id}" for function`,
			callback
		);

		let func = callback;
		if (context) {
			func = func.bind(context);
		}

		this._listeners.set(++this._listenersCount, { id, func, group });
		super.addListener(id, func);

		return this._listenersCount;
	}

	/**
	 * according to docs (https://nodejs.org/api/events.html) addListener is alias for on(), but it isn't. So here it alias for on()
	 *
	 * @param {string} id id of event
	 * @param {Function} callback callback function
	 * @param {*?} [context=null] scope to apply function to
	 * @param {string} [group='default'] group to add listener to. Used for 'discard()' cleanups
	 * @returns {number} id of listener
	 */
	addListener(id, callback, context = null, group = 'default') {
		return this.on(id, callback, context, group);
	}
	/* eslint-enable max-params */

	/**
	 * removes listener. If you used addListener|on with 'context' argument, you cant removeListener by 'callback', only by id!
	 *
	 * @param {number|string} id id of event or id that addListener returns
	 * @param {Function?} callback original callback listener used for event. null if you want to remove listener by listener id
	 */
	removeListener(id, callback) {
		if (callback) {
			logger.group(logger.groups.CORE_EVENTS, `unlisten event "${id}" for function`, callback);

			super.removeListener(id, callback);
		} else {
			if (!this._listeners.has(id)) {
				logger.group(logger.groups.CORE_EVENTS, `tried to unlisten event _${id} which not exists`);

				return;
			}

			const listener = this._listeners.get(id);
			logger.group(
				logger.groups.CORE_EVENTS,
				`unlisten event _${id} ("${listener.id}") for function`,
				listener.func
			);

			super.removeListener(listener.id, listener.func);
			this._listeners.delete(id);
		}
	}

	/**
	 * same as removeListener
	 *
	 * @param {number|string} id id of event or id that addListener returns
	 * @param {Function?} callback original callback listener used for event. null if you want to remove listener by listener id
	 */
	off(id, callback) {
		this.removeListener(id, callback);
	}
}

export default new EventsManager();
