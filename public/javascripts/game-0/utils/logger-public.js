/**
 * @file logger.js
 * logger from https://github.com/jonnyreeves/js-logger
 * @author tynrare
 * @version 1
 * @module Core/Utils/Logger
 */

import LoggerCore from './logger-lib';

LoggerCore.useDefaults();
LoggerCore.setLevel(LoggerCore.LOG);

const DEFAULT_LOGGING_LEVEL = 4;

/**
 * key: group names for filter log. value: group logging level
 */
const GROUPS = {
	CORE_EVENTS: 5,
	CORE_WARNS: 1,
	GAME_RES_OPERATION: 3,
	GAME_CORE_STATUS: 3,
	GAME_LOCALE_STATUS: 3,
	GAME_LOCALE_MESSAGE: 5,
	GAME_LOCALE_WARN: 2,
	GAMEPLAY_ACTION: 3,
	GRAPHICS_PROCESS: 3,
	GRAPHICS_PROCESS_DETAILS: 4,
	CALC_OPERATION_DETAILS: 4
};

/**
 * logger wrapper
 *
 * @static
 */
class Logger {
	groups = GROUPS;

	/**
	 * logging level for groups
	 */
	loggingLevel = DEFAULT_LOGGING_LEVEL;

	/**
	 * adds group method
	 */
	constructor() {
		this.group.log = this.group.bind(this);
		this.group.warn = this.groupWarn.bind(this);
		this.group.error = this.groupError.bind(this);
	}

	/**
	 * Will log data if its group logging enabled. Add in GROUPS you own fields mannualy or call assignGroupLevels
	 *
	 * @param {string} group group for log
	 * @param {string} level level for log (log, warn, error)
	 * @param {*?} args any logging data
	 * @private
	 */
	groupWithLevel(group, level, ...args) {
		const groupLevel = this.groups[group];
		if (groupLevel && this.loggingLevel >= groupLevel) {
			this[level](`${group}: `, ...args);
		}
	}

	/**
	 * Will log data if its group logging enabled. Add in GROUPS you own fields mannualy or call assignGroupLevels.
	 * calls this.groupWithLevel
	 * you can also call logger.group.log
	 *
	 *
	 * @param {string} group group for log
	 * @param {*?} args any logging data
	 */
	group(group, ...args) {
		this.groupWithLevel(group, 'log', ...args);
	}

	/**
	 * Will error data if its group logging enabled. Add in GROUPS you own fields mannualy or call assignGroupLevels.
	 * calls this.groupWithLevel
	 * you can also call logger.group.error
	 *
	 * @param {string} group group for log
	 * @param {*?} args any logging data
	 */
	groupError(group, ...args) {
		this.groupWithLevel(group, 'error', ...args);
	}

	/**
	 * Will warn data if its group logging enabled. Add in GROUPS you own fields mannualy or call assignGroupLevels.
	 * calls this.groupWithLevel
	 * you can also call logger.group.warn
	 *
	 *
	 * @param {string} group group for log
	 * @param {*?} args any logging data
	 */
	groupWarn(group, ...args) {
		this.groupWithLevel(group, 'warn', ...args);
	}

	/**
	 * Simple log() method wrapper
	 *
	 * @param {*?} args message to print
	 * @static
	 */
	log(...args) {
		LoggerCore.log(...args);
	}

	/**
	 * Simple warn() method wrapper
	 *
	 * @param {*?} args message to print
	 * @static
	 */
	warn(...args) {
		LoggerCore.warn(...args);
	}

	/**
	 * Simple error() method wrapper
	 *
	 * @param {*?} args message to print
	 * @static
	 */
	error(...args) {
		LoggerCore.error(...args);
	}

	/**
	 * sets new logging levels for groups
	 *
	 * @param {object<string, number>} levels new levels for all old or new groups
	 */
	assignGroupLevels(levels) {
		this.groups = Object.assign(this.groups, levels);
	}
}

export default new Logger();
