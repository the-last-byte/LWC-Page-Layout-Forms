import {
	ERROR_MESSAGE__CANNOT_START_WHEN_RUNNING,
	normalizeAndValidationStartOptions,
	validateCallback
} from "./raceHandlerUtil";

/**
 * @type {WeakMap<RaceConditionHandler, RaceConditionHandlerPrivate>}
 * @private
 */
const __publicStateToPrivateState = new WeakMap();

/**
 * @param {RaceConditionHandler} publicState
 * @return {RaceConditionHandlerPrivate}
 */
const getPrivateState = (publicState) => {
	__publicStateToPrivateState.get(publicState);
}

/**
 * @param {RaceConditionHandler} publicState
 * @param {RaceConditionHandlerPrivate} privateState
 */
const setPrivateState = (publicState, privateState) => {
	__publicStateToPrivateState.set(publicState, privateState);
}

/**
 * @module RaceConditionHandler
 */

/**
 * @typedef {string} module:RaceConditionHandler.ResolveReason
 * @memberOf module:RaceConditionHandler
 * @name ResolveReason
 */

/**
 * @typedef module:RaceConditionHandler.StartOptions
 * @memberOf module:RaceConditionHandler
 * @name StartOptions
 *
 * @property {number} timeout
 * @property {boolean} endCurrentRun
 */

/**
 * @type {{Restarted: module:RaceConditionHandler.ResolveReason, Stopped: module:RaceConditionHandler.ResolveReason, Resolved: module:RaceConditionHandler.ResolveReason}}
 */
const ResolveReasons = {
	/** @type {module:RaceConditionHandler.ResolveReason} */
	Aborted: "Aborted",
	/** @type {module:RaceConditionHandler.ResolveReason} */
	Resolved: "Resolved",
	/** @type {module:RaceConditionHandler.ResolveReason} */
	Restarted: "Restarted"
};

class RaceConditionHandlerPrivate {

	/** @type {number} */
	timeoutLength;

	/** @type {number|undefined} */
	timeoutHandle;

	/** @type {function(reason: module:RaceConditionHandler.ResolveReason)|undefined} */
	resolveMethod;

	/** @type {function(error)|undefined} */
	rejectMethod;

	/** @type {Set<function()>} */
	resolveCallbacks = new Set();

	addResolveCallback(fn) {
		this.resolveCallbacks.add(fn);
	}

	removeResolveCallback(fn) {
		this.resolveCallbacks.delete(fn);
	}

	clearResolveCallbacks() {
		this.resolveCallbacks.clear();
	}

	/**
	 * @param {module:RaceConditionHandler.StartOptions} options
	 * @return {Promise<module:RaceConditionHandler.ResolveReason>}
	 */
	async start(options) {
		if (options.endCurrentRun === false && this.resolveMethod !== undefined) {
			throw new Error(ERROR_MESSAGE__CANNOT_START_WHEN_RUNNING);
		}
		this.timeoutLength = options.timeout;
		const p = this.__createPromise();
		this.__startTimeout();
		return p;
	}

	abort() {
		this.__stopTimeout();
		this.__resolvePromise(ResolveReasons.Aborted);
	}

	resolve() {
		this.__stopTimeout();
		this.__resolvePromise(ResolveReasons.Resolved);
	}

	/**
	 * @private
	 */
	__handleTimeout = () => {
		try {
			this.__resolvePromise(ResolveReasons.Resolved);
		} catch (ex) {
			this.__rejectPromise(ex);
		}
	}

	/**
	 * @private
	 */
	__startTimeout = () => {
		if (this.resolveMethod === undefined) {
			throw new Error("Attempted to start timer without promise");
		}
		this.__stopTimeout();
		this.timeoutHandle = setTimeout(
			() => {
				this.__handleTimeout();
				this.__stopTimeout();
			},
			this.timeoutLength
		);
	}

	/**
	 * @private
	 */
	__stopTimeout = () => {
		if (this.timeoutHandle !== undefined) {
			clearTimeout(this.timeoutHandle);
			this.timeoutHandle = undefined;
		}
	}

	/**
	 * @return {Promise<module:RaceConditionHandler.ResolveReason>}
	 * @private
	 */
	__createPromise = () => {
		if (this.resolveMethod !== undefined) {
			this.__resolvePromise(ResolveReasons.Restarted);
		}
		return new Promise((resolve, reject) => {
			this.resolveMethod = resolve;
			this.rejectMethod = reject;
		});
	}

	/**
	 * @param {module:RaceConditionHandler.ResolveReason} reason
	 * @private
	 */
	__resolvePromise = (reason) => {
		if (this.resolveMethod !== undefined) {
			this.resolveMethod(reason);
			this.resolveMethod = undefined;
			this.rejectMethod = undefined;
			if (reason === ResolveReasons.Resolved) {
				this.resolveCallbacks.forEach(cb => {
					cb();
				});
			}
		}
	}

	/**
	 * @param error
	 * @private
	 */
	__rejectPromise = (error) => {
		if (this.rejectMethod !== undefined) {
			this.rejectMethod(error);
			this.resolveMethod = undefined;
			this.rejectMethod = undefined;
		} else {
			throw error;
		}
	}

}

/**
 * Asynchronous handler that can handle a lazy race condition with a timeout.
 */
class RaceConditionHandler {

	constructor() {
		__publicStateToPrivateState.set(this, new RaceConditionHandlerPrivate());
	}

	/**
	 * Starts the countdown until the callback function is fired.
	 * @param {Partial<module:RaceConditionHandler.StartOptions>} [options]
	 * @return {Promise<module:RaceConditionHandler.ResolveReason>}
	 */
	async start(options) {
		const cleaned = normalizeAndValidationStartOptions(options);
		return __publicStateToPrivateState.get(this).start(cleaned);
	}

	/**
	 * Stops the countdown.
	 */
	abort() {
		__publicStateToPrivateState.get(this).abort();
	}

	resolve() {
		__publicStateToPrivateState.get(this).resolve();
	}

	addResolveCallback(cb) {
		validateCallback(cb);
		__publicStateToPrivateState.get(this).addResolveCallback(cb);
	}

	removeResolveCallback(cb) {
		validateCallback(cb);
		__publicStateToPrivateState.get(this).removeResolveCallback(cb);
	}

	clearResolveCallbacks() {
		__publicStateToPrivateState.get(this).clearResolveCallbacks();
	}

}

export {
	RaceConditionHandler,
	ResolveReasons
};