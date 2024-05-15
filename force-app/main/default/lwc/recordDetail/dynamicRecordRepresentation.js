import {getFieldValue} from "lightning/uiRecordApi";

/**
 * @param {string|FieldId} fieldNameOrImport
 * @return {string}
 */
const resolveFieldName = fieldNameOrImport => {
	return typeof fieldNameOrImport === "string"
		? fieldNameOrImport
		: fieldNameOrImport.fieldApiName;
}

/**
 * @memberOf {RecordDetailUtil.Private}
 */
export default class DynamicRecordRepresentation {

	/**
	 * @type {boolean}
	 * @private
	 */
	_hasChangedValues = false;

	/**
	 * @type {Map<string, *>}
	 * @private
	 */
	_fieldMap;

	/**
	 * @param {module:lightning/uiRecordApi.RecordRepresentation} record
	 * @param {SObjectImport} objectImport
	 */
	constructor(record, objectImport) {
		/** @type {Map<string, *>} */
		const fieldMap = new Map();

		const fieldList = Object.keys(record.fields);
		/** @type {FieldId} */
		const fieldImport = {
			objectApiName: objectImport.objectApiName
		};
		for (let currentField, currentValue, i = 0, j = fieldList.length; i < j; i++) {
			currentField = fieldList[i];
			fieldImport.fieldApiName = currentField;
			currentValue = getFieldValue(record, fieldImport);
			fieldMap.set(
				currentField,
				currentValue == null
					? undefined
					: currentValue
			);
		}
		this._fieldMap = fieldMap;
	}

	/**
	 * @param item
	 * @param prototype
	 * @private
	 */
	static clone(item, prototype) {
		const out = Object.create(prototype || this.prototype);
		out._fieldMap = item._fieldMap;
		return out;
	}

	/**
	 * Resets an internal attribute that tracks whether any field
	 * values have been changed.  Only use if you know what you are
	 * doing.
	 */
	resetFieldWatcher() {
		this._hasChangedValues = false;
	}

	/**
	 * @return {boolean}
	 */
	haveFieldsChanged() {
		return this._hasChangedValues;
	}

	/**
	 * @param {string|FieldId} fieldNameOrImport
	 * @param {*} value
	 * @return {boolean} True if the value has actually changed
	 */
	setFieldValue(fieldNameOrImport, value) {
		const fieldMap = this._fieldMap;
		const resolvedFieldName = resolveFieldName(fieldNameOrImport);
		const cleanedValue = value == null
			? undefined
			: value;
		if (fieldMap.get(resolvedFieldName) !== cleanedValue) {
			fieldMap.set(resolvedFieldName, cleanedValue);
			this._hasChangedValues = true;
			return true;
		}
		return false;
	}

	/**
	 * @param {RecordDetailUtil.Private.DynamicRecordRepresentation} [prototype=RecordDetailUtil.Private.DynamicRecordRepresentation.prototype]
	 */
	clone(prototype) {
		return DynamicRecordRepresentation.clone(this, prototype);
	}

	/**
	 * @param {string|FieldId} fieldNameOrImport
	 * @return {*}
	 */
	getFieldValue(fieldNameOrImport) {
		return this._fieldMap.get(resolveFieldName(fieldNameOrImport));
	}

}