import {ShowToastEvent} from "lightning/platformShowToastEvent";

const DEFAULT_ERROR_MESSAGE = 'An unexpected error has occurred';

/**
 * Converts an unknown error into a FrameworkError
 * instance.
 *
 * @param {string[]} systemMessages
 * @param {string[]} userMessages
 * @param {string[]} stackMessages
 * @param {string|Error|FetchResponse} err
 * @param {string} [stack]
 * @private
 */
const extractMessagesFromError = (systemMessages, userMessages, stackMessages, err, stack) => {
	if (!err) {
		userMessages.push(DEFAULT_ERROR_MESSAGE);
		systemMessages.push("No exception received.");
	} else if (typeof err === "string") {
		userMessages.push(err);
		systemMessages.push(err);
	} else {
		//Status
		if (err.statusText) {
			systemMessages.push(err.statusText);
		}

		//MS Specific
		if (err.description) {
			userMessages.push(err.description);
			systemMessages.push(err.description);
		}

		//Handle page and field errors
		if (err.body) {
			const body = err.body;
			if (body.stackTrace) {
				stackMessages.push(body.stackTrace);
			}
			//Handle output errors, eg., validation rules errors, etc:
			if (err.body.output) {
				const output = err.body.output;
				if (output) {
					//Standard object level errors
					if (output.errors) {
						output.errors.forEach(e => {
							userMessages.push(e.message);
							stackMessages.push(e.message);
						});
					}
					//Field level errors
					if (output.fieldErrors) {
						/* Example data structure
						"fieldErrors": {
							"Status__c": [
								{
									"constituentField": null,
									"duplicateRecordError": null,
									"errorCode": "INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST",
									"field": "Status__c",
									"fieldLabel": "Status",
									"message": "Status: bad value for restricted picklist field: Archived{!2321re"
								}
							]
						}
						 */
						const fields = Object.keys(output.fieldErrors);
						for (let errorsOnCurrentField, i = 0, j = fields.length; i < j; i++) {
							errorsOnCurrentField = output.fieldErrors[fields[i]];
							for (let fieldError, x = 0, y = errorsOnCurrentField.length; x < y; x++) {
								fieldError = errorsOnCurrentField[x];
								userMessages.push(fieldError.message);
								stackMessages.push(
									!fieldError.errorCode
										? fieldError.message
										: `${fieldError.errorCode}: ${fieldError.message}`
								);
							}
						}

					}
				}
			}

			//Handle output errors, eg., validation rules errors, etc:
			if (err.body.output && err.body.output.errors) {

				err.body.output.errors.forEach(e => {
					userMessages.push(e.message);
					stackMessages.push(e.message);
				});
			}

			//AuraFetchResponse
			parsePageErrors(systemMessages, userMessages, body.pageErrors);
			//@TODO iS THIS A DUPE?
			parseFieldErrors(systemMessages, userMessages, body.fieldErrors);

			if (body.message) {
				if (userMessages.length === 0) {
					userMessages.push(body.message);
				}
				systemMessages.push(body.message);
			}
			/**
			 * @todo body.duplicateResults is an array that should also be handled.
			 */
		}

		//Handle possible messages
		if (err.message) {
			if (userMessages.length === 0) {
				userMessages.push(err.message);
			}
			systemMessages.push(err.message);
		}

		if (userMessages.length === 0) {
			userMessages.push(DEFAULT_ERROR_MESSAGE);
		}
		if (systemMessages.length === 0) {
			systemMessages.push(JSON.stringify(err));
		}
	}

	if (!stack) {
		stackMessages.push(stack);
	}
}

/**
 *
 * @param {string[]} systemMessages
 * @param {string[]} userMessages
 * @param {[{statusCode : string, message : string}]} pageErrors
 * @private
 */
const parsePageErrors = (systemMessages, userMessages, pageErrors) => {
	if (!pageErrors || pageErrors.length === 0) {
		return;
	}
	for (let i = 0, j = pageErrors.length; i < j; i++) {
		const error = pageErrors[i];
		const userMessage = `Page error: ${error.message}`;
		userMessages.push(userMessage);
		if (!userMessage.statusCode) {
			systemMessages.push(userMessage);
		} else {
			systemMessages.push(`Page error: ${error.statusCode}: ${error.message}`);
		}
	}
}

/**
 * Adds any field errors found in an AuraFetchResponse
 * to an array of error strings.
 *
 * @param {string[]} systemMessages
 * @param {string[]} userMessages
 * @param {Map<string,[{statusCode : string, message : string}]>} fieldErrors
 * @private
 */
const parseFieldErrors = (systemMessages, userMessages, fieldErrors) => {
	if (!fieldErrors || fieldErrors === {}) {
		return;
	}
	for (let fieldName in fieldErrors) {
		if (Object.prototype.hasOwnProperty.call(fieldErrors, fieldName) === true) {
			const errors = fieldErrors[fieldName];
			if (errors.length) {
				for (let i = 0, j = errors.length; i < j; i++) {
					const error = errors[i];
					const userString = `Field error on ${fieldName}: ${error.message}`;
					userMessages.push(userString);
					if (!error.statusCode) {
						systemMessages.push(userString);
					} else {
						systemMessages.push(`Field error on ${fieldName}: ${error.statusCode}: ${error.message}`)
					}
				}
			}
		}
	}
}

/**
 * @param {string|Error|FetchResponse|ParsedError|object} err
 * @param {string?} stack
 */
const parseError = (err, stack) => {
	return new ParsedError(err, stack);
}

export default class ParsedError {
	/**
	 * @type {string}
	 */
	message;

	/**
	 * @type {string}
	 */
	systemMessage;

	/**
	 * @type {string|undefined}
	 */
	stack;

	/**
	 * The initial error (this will not be filled if
	 * a ParsedError instance is passed to the constructor).
	 * @type {string|Error|FetchResponse|object|undefined}
	 */
	initialError;

	/**
	 * @param {string|Error|FetchResponse|ParsedError|object} err
	 * @param {string?} stack
	 *      Ignored if `err` is a ParsedError.
	 * @param {string?} delimiter
	 *      Ignored if `err` is a ParsedError.
	 */
	constructor(err, stack, delimiter) {
		if (err instanceof ParsedError) {
			this.message = err.message;
			this.systemMessage = err.systemMessage;
			this.stack = err.stack;
		} else {
			const systemMessages = [];
			const userMessages = [];
			const stackMessages = [];
			const joiner = delimiter || "\n";
			this.initialError = err || undefined;
			extractMessagesFromError(systemMessages, userMessages, stackMessages, err, stack);
			this.message = userMessages.join(joiner);
			this.systemMessage = systemMessages.join(joiner);
			if (stackMessages.length > 0) {
				this.stack = stackMessages.join(joiner)
			}
		}
	}

	/**
	 * Creates a toast event describing the parsed error. The toady message
	 * will contain the error message using the "error" toast variant.
	 *
	 * All options can be overridden using the optional `options` argument.
	 *
	 * @example
	 * errorCallback(error, stack) {
	 *     const ev = parseError(error, stack).getToastEvent({title: "Custom Title"});
	 *     this.dispatchEvent(ev);
	 * }
	 *
	 * @param {{mode: string?, variant: string?, title: string?, message: string?, messageData: string[]|object|undefined}?} options
	 * @return {module:lightning/platformShowToastEvent.ShowToastEvent}
	 */
	getToastEvent(options) {
		return new ShowToastEvent(this.getToastEventParams(options));
	}

	/**
	 * @param {{mode: string?, variant: string?, title: string?, message: string?, messageData: string[]|object|undefined}?} options
	 * @return {{mode: string, variant: string, title: string, message: string, messageData: any}}
	 */
	getToastEventParams(options) {
		const opts = options || {};
		return {
			title: opts.title || "An error has occurred",
			message: opts.message || this.message,
			variant: opts.variant || "error",
			messageData: opts.messageData,
			mode: opts.mode || "dismissible"
		}
	}

	/**
	 * Chainable method to log the contents to the console.
	 *
	 * @return {ParsedError}
	 */
	logToConsole() {
		//Print the initial error (ensuring nothing is missed).
		if (this.initialError !== undefined) {
			console.log(this.initialError);
		}

		//Print the system error message
		console.error(this.systemMessage);

		//Print the stack message if any
		if (this.stack !== undefined) {
			console.log(this.stack);
		}
		return this;
	}
}

export {
	parseError,
	DEFAULT_ERROR_MESSAGE
};