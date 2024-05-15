import {describeValueTypeForDisplay, integerOrDefault, objectOrDefault} from "c/util";

const ERROR_MESSAGE__CANNOT_START_WHEN_RUNNING
	= "RaceConditionHandler cannot be started as it is already running.  " +
	"Either use to abort() method or call start({endCurrentRun: true})."

/**
 * @param {Partial<module:RaceConditionHandler.StartOptions>} [options]
 * @return {module:RaceConditionHandler.StartOptions}
 */
const normalizeAndValidationStartOptions = options => {
	const cleaned = objectOrDefault(options);
	if (cleaned === undefined) {
		return {
			timeout: 0,
			endCurrentRun: false
		};
	}
	return {
		timeout: normalizeAndValidateTimeout(options.timeout),
		endCurrentRun: options.endCurrentRun === true
	};
}

const normalizeAndValidateTimeout = timeout => {
	if (timeout == null) {
		return 0;
	}
	const safeTimeout = integerOrDefault(timeout);
	if (safeTimeout === undefined || safeTimeout < 0) {
		throw new TypeError(`Expected callback to be a positive integer (0..n), got ${describeValueTypeForDisplay(timeout)}`);
	}
	return safeTimeout;
}

/**
 * @param {function} callback
 */
const validateCallback = callback => {
	if (!callback || typeof callback !== "function") {
		throw new TypeError(`Expected callback to be a function, got ${describeValueTypeForDisplay(callback)}`);
	}
}

export {
	normalizeAndValidationStartOptions,
	normalizeAndValidateTimeout,
	validateCallback,
	ERROR_MESSAGE__CANNOT_START_WHEN_RUNNING
}