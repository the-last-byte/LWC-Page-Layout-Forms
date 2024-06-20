import {api} from 'lwc';
import LightningModal from "lightning/modal";
import {
	functionOrDefault,
	objectIdOrDefault,
	objectOrDefault,
	parseError,
	trimmedStringOrDefault
} from "c/recordDetailUtil";

const RETURN_VALUE_AFTER_EDIT_OR_CREATE = "OKAY";

export default class RecordDetailModal extends LightningModal {

	/** @type {Record<FieldId, *>} */
	@api defaultFieldValues;

	@api recordId;
	@api parentRecordId;

	/** @type {string[]|undefined} **/
	@api hiddenFields;

	/** @type {ObjectId} */
	@api targetObject;

	@api hideSaveAndNewButton = false;

	@api showResetButton = false;

	@api objectName;

	recordEditedOrCreated = false;

	/** @type {RecordDetailUtil.Private.ButtonStateData|undefined} */
	buttonStateConfig;

	/** @type {function(error)} */
	@api handleErrorMethod;

	/**
	 * @param {RecordDetailUtil.RecordDetailModal.RecordDetailModalOptions} options
	 * @return {Promise<boolean>}
	 */
	static async open(options) {

		const objectId = objectIdOrDefault(options.targetObject);
		if (objectId === undefined) {
			throw new TypeError("Expected targetObject to be an ObjectID.");
		}
		const recordId = trimmedStringOrDefault(options.recordId);

		const cleanedObjectName = trimmedStringOrDefault(options.objectLabel);
		const objectNameForLabel = cleanedObjectName === undefined
			? "record"
			: cleanedObjectName;

		const result = await super.open({
			label: recordId === undefined
				? `New ${objectNameForLabel}`
				: `Edit ${objectNameForLabel}`,
			description: recordId === undefined
				? `Creates a new ${objectNameForLabel}`
				: `Edits a new ${objectNameForLabel}`,
			objectName: cleanedObjectName,
			size: "medium",
			defaultFieldValues: objectOrDefault(options.defaultFieldValues),
			recordId,
			parentRecordId: trimmedStringOrDefault(options.parentRecordId),
			hiddenFields: functionOrDefault(options.hiddenFields),
			targetObject: objectId,
			hideSaveAndNewButton: options.hideSaveAndNewButton === true,
			showResetButton: options.showResetButton === true,
			handleErrorMethod: ex => {
				const parsed = parseError(ex).logToConsole();
				if (options.caller) {
					options.caller.dispatchEvent(parsed.getToastEvent());
				}
			}
		});
		return result === RETURN_VALUE_AFTER_EDIT_OR_CREATE;
	}

	handleObjectDescribed(ev) {
		try {
			const nameToUse = this.objectName || ev.detail.label;
			if (this.recordId === undefined) {
				this.label = `New ${nameToUse}`;
				this.description = `Creates a new ${nameToUse} record.`;
			} else {
				this.label = `Edit ${nameToUse}`;
				this.description = `Edits a ${nameToUse} record.`;
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleSave(ev) {
		try {
			ev.stopPropagation();
			this.recordEditedOrCreated = true;
			this._closeModal();
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleSaveAndNew(ev) {
		try {
			ev.stopPropagation();
			this.recordEditedOrCreated = true;
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleCancel(ev) {
		try {
			ev.stopPropagation();
			this._closeModal();
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleButtonState(ev) {
		try {
			ev.stopPropagation();
			this.buttonStateConfig = ev.detail.state || undefined;
		} catch (ex) {
			this.handleError(ex);
		}
	}

	_closeModal() {
		this.close(
			this.recordEditedOrCreated === true
				? RETURN_VALUE_AFTER_EDIT_OR_CREATE
				: undefined
		);
	}

	handleError(error) {
		if (typeof this.handleErrorMethod === "function") {
			this.handleErrorMethod(error);
		} else {
			console.error(error);
		}
	}

}