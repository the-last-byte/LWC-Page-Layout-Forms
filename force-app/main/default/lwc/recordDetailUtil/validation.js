import {oxfordJoin} from "./strings";

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|[]}
 */
const arrayOrDefault = (value, defaultValue) => {
	return Array.isArray(value) === true
		? value
		: defaultValue;
};

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|boolean}
 */
const booleanOrDefault = (value, defaultValue) => {
	return value === true || value === false
		? value
		: defaultValue;
};

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|Date}
 */
const dateOrDefault = (value, defaultValue) => {
	if (!value) {
		return defaultValue;
	}
	let dateValue;
	if (value instanceof Date) {
		dateValue = value
	} else if (typeof value === "string") {
		dateValue = new Date(value);
	} else {
		return defaultValue;
	}
	return isDateValid(dateValue) === true
		? dateValue
		: defaultValue;
};

/**
 * @param {*} value
 * @return {"undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint"|string}
 */
const describeValueTypeForDisplay = value => {
	if (value === undefined) {
		return "undefined";
	}
	if (value === null) {
		return "null";
	}
	if (Array.isArray(value) === true) {
		return "[]";
	}
	return typeof value;
}

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|function}
 */
const functionOrDefault = (value, defaultValue) => {
	return typeof value === "function"
		? value
		: defaultValue;
};

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|number}
 */
const integerOrDefault = (value, defaultValue) => {
	const num = parseInt(value);
	return isNaN(num) === true ? defaultValue : num;
};

/**
 * Returns whether a JS Date instance is valid (i.e.
 * has had a valid date set).
 *
 * @param {Date} date
 * @returns {boolean}
 */
const isDateValid = date => {
	//Make sure that this looks like a date
	if (!date || !date.getTime) return false;
	//This is a simple way to tell if a date is
	//valid.  An invalid date will return NaN for
	//its numerical-returning methods.  NaN will
	//never equal NaN, thus this is an easy test.
	return date.getTime() === date.getTime();
};


/**
 * @param {string} value
 * @param {string|*} defaultValue
 * @param {string[]} allowedValueArray
 * @param {boolean} throwError
 * @param {string} [fieldName]
 *
 * @return {string|*}
 * @throws {TypeError}
 */
const _normalizeAndValidateStringChoice = (value, defaultValue, allowedValueArray, throwError, fieldName) => {
	let cleanedValue = trimmedStringOrDefault(value);
	if (cleanedValue === undefined) {
		return defaultValue;
	} else {
		const lowerCaseValue = cleanedValue.toLowerCase();
		for (let i = 0, j = allowedValueArray.length; i < j; i++) {
			const currentValue = allowedValueArray[i];
			const cleanedCurrentValue = trimmedStringOrDefault(allowedValueArray[i]);
			if (cleanedCurrentValue !== undefined) {
				if (cleanedCurrentValue.toLowerCase() === lowerCaseValue) {
					return currentValue;
				}
			}
		}
		if (throwError === true) {
			throw new TypeError(
				`Expected ${trimmedStringOrDefault(fieldName) || "value"} to be ${oxfordJoin(allowedValueArray, "or")}, got ${value}`
			);
		}
		return defaultValue;
	}
};

/**
 * Checks whether a string value exists within a given array of
 * strings. If the string does exist in the array, the matching
 * value will be returned from the array.  Otherwise, the
 * defaultValue will be returned.
 *
 * If the provided value is NOT a non-empty string, the provided
 * defaultValue will be returned.
 *
 * NOTE that the strings are compared ignoring leading and
 * trailing whitespace and in a case-insensitive manner.
 *
 * @param {string} value
 * @param {string|*} defaultValue
 * @param {string[]} allowedValueArray
 *
 * @return {string|*}
 */
const normalizeStringChoice = (value, defaultValue, allowedValueArray) => {
	return _normalizeAndValidateStringChoice(
		value,
		defaultValue,
		allowedValueArray,
		false
	);
}

/**
 * Checks whether a string value exists within a given array of
 * strings.
 *
 * If the provided value is NOT a non-empty string, the provided
 * defaultValue will be returned.
 *
 * If the provided value exists in the allowedValueArray, the
 * matching value will be returned from said array.
 *
 * Otherwise, a TypeError will be thrown.
 *
 * NOTE that the strings are compared ignoring leading and
 * trailing whitespace and in a case-insensitive manner.
 *
 * @param {string} value
 * @param {string|*} defaultValue
 * @param {string[]} allowedValueArray
 * @param {string} [fieldName="value"]
 *
 * @throws {TypeError}
 *
 * @return {string|*}
 */
const normalizeAndValidateStringChoice = (value, defaultValue, allowedValueArray, fieldName) => {
	return _normalizeAndValidateStringChoice(
		value,
		defaultValue,
		allowedValueArray,
		true,
		fieldName
	);
}

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|function}
 */
const objectOrDefault = (value, defaultValue) => {
	return value != null && typeof value === "object"
		? value
		: defaultValue;
};

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|string}
 */
const trimmedStringOrDefault = (value, defaultValue) => {
	return typeof value === "string"
		? value.trim() || defaultValue
		: defaultValue;
};

/**
 * @param {string|FieldId|*} value
 * @param {string} objectApiName
 * @param {T} [defaultValue=undefined]
 * @return {FieldId|T} value
 *
 * @template T
 */
const fieldIdOrDefault = (value, objectApiName, defaultValue) => {
	if (value == null) {
		return defaultValue;
	}
	const type = typeof value;
	if (type === "string") {
		const finalFieldApiName = trimmedStringOrDefault(value);
		if (finalFieldApiName === undefined) {
			return defaultValue;
		}
		const safeObjectApiName = trimmedStringOrDefault(objectApiName);
		return safeObjectApiName === undefined
			? defaultValue
			: {objectApiName: safeObjectApiName, fieldApiName: finalFieldApiName};
	} else if (type === "object") {
		const finalFieldApiName = trimmedStringOrDefault(value.fieldApiName);
		if (finalFieldApiName === undefined) {
			return defaultValue;
		}
		const finalObjectApiName = trimmedStringOrDefault(value.objectApiName) || trimmedStringOrDefault(objectApiName);
		return finalObjectApiName === undefined
			? defaultValue
			: {
				objectApiName: finalObjectApiName,
				fieldApiName: finalFieldApiName
			};
	}
	return defaultValue;
};

/**
 * @param {string|FieldId|*} value
 * @return {boolean}
 *
 * @template T
 */
const validateFieldId = (value) => {
	if (objectOrDefault(value) === undefined) {
		return false;
	}
	if (trimmedStringOrDefault(value.fieldApiName) === undefined) {
		return false;
	}
	return trimmedStringOrDefault(value.objectApiName) !== undefined;
};

/**
 * @param {string|ObjectId|*} value
 * @param {T} [defaultValue=undefined]
 * @return {ObjectId|T} value
 *
 * @template T
 */
const objectIdOrDefault = (value, defaultValue) => {
	if (value == null) {
		return defaultValue;
	}
	const type = typeof value;
	if (type === "string") {
		const apiName = trimmedStringOrDefault(value);
		return apiName === undefined
			? defaultValue
			: {objectApiName: apiName};
	} else if (type === "object") {
		const apiName = trimmedStringOrDefault(value.objectApiName);
		return apiName === undefined
			? defaultValue
			: {
				objectApiName: apiName
			};
	}
	return defaultValue;
}

export {
	arrayOrDefault,
	booleanOrDefault,
	dateOrDefault,
	describeValueTypeForDisplay,
	functionOrDefault,
	integerOrDefault,
	isDateValid,
	objectOrDefault,
	normalizeStringChoice,
	normalizeAndValidateStringChoice,
	trimmedStringOrDefault,
	fieldIdOrDefault,
	objectIdOrDefault,
	validateFieldId
};