/**
 * @file delays.js
 * @author tynrare
 * @version 1
 * @module Core/Utils/Delays
 */

import logger from './logger-public.js';
import events from './events_manager.js';

/**
 * неймспейс c обертками для делеев, интервалов, реквестов и т.п.
 *
 * @namespace
 */
const Delays = {
	/**
	 * callbacks on nearest game update
	 *
	 * @param {Function} callback callback function
	 * @returns {number} id from {@link module:Core/Utils/EventsManager.EventsManager.on}
	 */
	update(callback) {
		return events.once('update', (ms, dt) => {
			try {
				callback(ms, dt);
			} catch (err) {
				logger.error(err);
			}
		});
	},
	/**
	 * callbacks on animation frame
	 *
	 * @param {Function} callback callback function
	 * @returns {number} id requestAnimationFrame
	 */
	immediate(callback) {
		return requestAnimationFrame(() => {
			try {
				callback();
			} catch (err) {
				logger.error(err);
			}
		});
	},
	/**
	 * callbacks intervals
	 *
	 * @param {Function} callback interval callback
	 * @param {number} time interval delay
	 * @returns {number} id setInterval
	 */
	interval(callback, time) {
		return setInterval(() => {
			try {
				callback();
			} catch (err) {
				logger.error(err);
			}
		}, time);
	},
	/**
	 * stops interval
	 *
	 * @param {number} id interval id
	 */
	clearInterval(id) {
		clearInterval(id);
	},
	/**
	 * stops timeout
	 *
	 * @param {number} id timeout id
	 */
	clearTimeout(id) {
		clearTimeout(id);
	},
	/**
	 * callbacks timeouts
	 *
	 * @param {Function} callback timeout callback
	 * @param {number} time timeout delay
	 * @returns {number} id setTimeout
	 */
	timeout(callback, time) {
		return setTimeout(() => {
			try {
				callback();
			} catch (err) {
				logger.error(err);
			}
		}, time);
	}
};

export default Delays;
