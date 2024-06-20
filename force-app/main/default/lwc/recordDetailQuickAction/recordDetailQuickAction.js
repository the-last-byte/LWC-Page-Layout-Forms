import {api, LightningElement} from 'lwc';
import {objectIdOrDefault, parseError} from "c/recordDetailUtil";

export default class RecordDetailQuickAction extends LightningElement {

	/** @type {Record<FieldId, *>} */
	@api defaultFieldValues;

	@api recordId;
	@api parentRecordId;

	/** @type {Array<FieldId|string>|undefined} **/
	@api hiddenFields;

	@api hideForm = false;

	@api hideButtons = false;
	@api hideSaveAndNewButton = false;
	@api showResetButton = false;
	/**
	 * Overrides the object name used in the header.
	 *
	 * @type {string}
	 */
	@api objectName;
	/** @type {RecordDetailUtil.Private.ButtonStateData|undefined} */
	buttonStateConfig;

	/** @type {ObjectId} */
	_targetObject;

	@api
	get targetObject() {
		return this._targetObject;
	}

	set targetObject(value) {
		try {
			this._targetObject = objectIdOrDefault(value);
		} catch (ex) {
			this.handleError(ex);
		}
	}

	get label() {
		return this.recordId === undefined
			? `New ${this.objectName || "record"}`
			: `Edit ${this.objectName || "record"}`;
	}

	handleObjectDescribed(ev) {
		try {
			this.objectName = this.objectName || ev.detail.label
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleSave(ev) {
		try {
			ev.stopPropagation();
			this.dispatchEvent(new CustomEvent("save"));
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleSaveAndNew(ev) {
		try {
			ev.stopPropagation();
			this.dispatchEvent(new CustomEvent("saveandnew"));
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleCancel(ev) {
		try {
			ev.stopPropagation();
			this.dispatchEvent(new CustomEvent("cancel"))
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

	errorCallback(error, stack) {
		this.handleError(error, stack);
	}

	handleError = (error, stack) => {
		this.dispatchEvent(
			parseError(error, stack).logToConsole().getToastEvent()
		);
	};

}