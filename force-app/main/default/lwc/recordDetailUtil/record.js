import {trimmedStringOrDefault} from "./validation";
import {getFieldDisplayValue, getFieldValue} from "lightning/uiRecordApi";

/**
 * @param {module:lightning/uiRecordApi.RecordRepresentation} record
 * @param {string} objectApiName
 * @param {string[]} nameFields
 * @param {string} defaultValue
 * @return {string}
 */
const extractRecordName = (record, objectApiName, nameFields, defaultValue) => {
	const parts = [];
	for (let i = 0, j = nameFields.length; i < j; i++) {
		/** @type {FieldId} */
		const fieldImport = {
			objectApiName,
			fieldApiName: nameFields[i]
		};
		const result = trimmedStringOrDefault(
			getFieldDisplayValue(record, fieldImport) ||
			getFieldValue(record, fieldImport)
		);
		if (result) {
			parts.push(result);
		}
	}
	return parts.length === 0
		? defaultValue
		: parts.join(" ");
}

/**
 * @param {module:lightning/uiRecordApi.RecordUI} recordUi
 * @param {ObjectId} objectId
 * @return {module:lightning/uiRecordApi.ObjectInfoRepresentation|undefined}
 */
const getObjectDescribeFromRecordUi = (recordUi, objectId) => {
	return recordUi.objectInfos[objectId.objectApiName] || undefined;
}

/**
 * @param {module:lightning/uiRecordApi.RecordUI} recordUi
 * @param {ObjectId} objectId
 * @return {Record<string, module:lightning/uiRecordApi.RecordTypeInfoRepresentation>}
 */
const getRecordTypeIdMapFromRecordUi = (recordUi, objectId) => {
	const objectDescribe = getObjectDescribeFromRecordUi(recordUi, objectId);
	if (objectDescribe === undefined) {
		return undefined;
	}
	return objectDescribe.recordTypeInfos;
}

/**
 * @param {module:lightning/uiRecordApi.RecordUI} recordUi
 * @param {ObjectId} objectId
 * @return {Record<string, module:lightning/uiRecordApi.RecordTypeInfoRepresentation>}
 */
const getRecordTypeNameMapFromRecordUi = (recordUi, objectId) => {
	const objectDescribe = getObjectDescribeFromRecordUi(recordUi, objectId);
	if (objectDescribe === undefined) {
		return undefined;
	}
	const recordTypeInfos = objectDescribe.recordTypeInfos;
	const output = {};
	const recordTypeIds = Object.keys(recordTypeInfos);
	for (let i = 0, j = recordTypeIds.length; i < j; i++) {
		const item = recordTypeInfos[
			recordTypeIds[i]
			];
		output[item.name] = item;
	}
	return output;
}

export {
	extractRecordName,
	getObjectDescribeFromRecordUi,
	getRecordTypeIdMapFromRecordUi,
	getRecordTypeNameMapFromRecordUi
}