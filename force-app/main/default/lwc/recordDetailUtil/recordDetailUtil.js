import {RaceConditionHandler, ResolveReasons} from "./raceHandler/raceHandler";
import {
	DEFAULT_FIELD_VARIANT,
	DEFAULT_FORM_VARIANT,
	FIELD_VARIANT_LABEL_HIDDEN,
	FIELD_VARIANT_LABEL_STACKED,
	FIELD_VARIANT_STANDARD,
	FIELD_VARIANTS,
	FORM_VARIANT_AUTO,
	FORM_VARIANT_CREATE,
	FORM_VARIANT_EDIT,
	FORM_VARIANT_VIEW,
	FORM_VARIANTS,
	SYSTEM_FIELD_NAMES
} from "./constants";

import {parseError} from "./errors";
import {dateToLocalIsoString} from "./dates";

import {randomString} from "./random";

import {
	extractRecordName,
	getObjectDescribeFromRecordUi,
	getRecordTypeIdMapFromRecordUi,
	getRecordTypeNameMapFromRecordUi
} from "./record";

import {escapeHtml, formatTemplateString, oxfordJoin, stripHtml} from "./strings";

import {
	arrayOrDefault,
	booleanOrDefault,
	dateOrDefault,
	describeValueTypeForDisplay,
	fieldIdOrDefault,
	functionOrDefault,
	integerOrDefault,
	isDateValid,
	normalizeAndValidateStringChoice,
	normalizeStringChoice,
	objectIdOrDefault,
	objectOrDefault,
	trimmedStringOrDefault
} from "./validation";

//Shamelessly stolen from https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arrays-by-string-path
//Thanks Alnitak
const _extractNestedFieldFromObject = (obj, fieldName) => {
	fieldName = fieldName.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
	fieldName = fieldName.replace(/^\./, '');           // strip a leading dot
	const fileNameSegments = fieldName.split('.');
	for (let i = 0, j = fileNameSegments.length; i < j; ++i) {
		const segment = fileNameSegments[i];
		if (segment in obj) {
			obj = obj[segment];
		} else {
			return;
		}
	}
	return obj;
}

const extractFieldFromObject = (obj, fieldName) => {
	if (fieldName.includes(".") === true) {
		return _extractNestedFieldFromObject(obj, fieldName);
	} else {
		return obj[fieldName];
	}
}

export {
	RaceConditionHandler,
	ResolveReasons,

	//Field variants
	FIELD_VARIANT_STANDARD,
	FIELD_VARIANT_LABEL_STACKED,
	FIELD_VARIANT_LABEL_HIDDEN,
	FIELD_VARIANTS,
	DEFAULT_FIELD_VARIANT,

	//Form variants
	FORM_VARIANT_AUTO,
	FORM_VARIANT_EDIT,
	FORM_VARIANT_VIEW,
	FORM_VARIANT_CREATE,
	FORM_VARIANTS,
	DEFAULT_FORM_VARIANT,

	//System fields
	SYSTEM_FIELD_NAMES,

	parseError,

	extractFieldFromObject,

	//Dates
	dateToLocalIsoString,

	//record
	extractRecordName,
	getObjectDescribeFromRecordUi,
	getRecordTypeIdMapFromRecordUi,
	getRecordTypeNameMapFromRecordUi,

	//random
	randomString,

	//strings
	escapeHtml,
	formatTemplateString,
	oxfordJoin,
	stripHtml,

	//validation
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
	objectIdOrDefault
};