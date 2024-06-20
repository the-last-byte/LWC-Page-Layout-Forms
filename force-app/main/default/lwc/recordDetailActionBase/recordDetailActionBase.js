import {api, LightningElement, wire} from 'lwc';
import {FORM_VARIANT_CREATE, FORM_VARIANT_EDIT, parseError, trimmedStringOrDefault} from "c/recordDetailUtil";
import {getObjectInfo} from "lightning/uiObjectInfoApi";

export default class RecordDetailActionBase extends LightningElement {

	/** @type {Record<string, *>|undefined} */
	@api defaultFieldValues;
	@api parentRecordId;
	@api hiddenFields;
	/** @type {ObjectId} */
	@api targetObject;
	isLoading = true;
	recordEditedOrCreated = false;
	hasConnected = false;
	/**
	 * Flag to state whether "Save" or "Save & New" was last clicked.
	 * Controls the post-save actions.
	 *
	 * @type {boolean}
	 */
	wasLastClickSaveAndNew = false;

	_recordId;

	@api
	get recordId() {
		return this._recordId;
	}

	set recordId(value) {
		try {
			this._recordId = trimmedStringOrDefault(value);
			if (this.hasConnected === true) {
				this._sendUpdateButtonStateEvent();
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	_hideSaveAndNewButton = false;

	@api
	get hideSaveAndNewButton() {
		return this._hideSaveAndNewButton;
	}

	set hideSaveAndNewButton(value) {
		try {
			this._hideSaveAndNewButton = value === true;
			if (this.hasConnected === true) {
				this._sendUpdateButtonStateEvent();
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	_showResetButton = false;

	@api
	get showResetButton() {
		return this._showResetButton;
	}

	set showResetButton(value) {
		try {
			this._showResetButton = value === true;
			if (this.hasConnected === true) {
				this._sendUpdateButtonStateEvent();
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	/** @type {RecordDetailUtil.Private.ButtonStateData} */
	get buttonState() {
		return {
			recordId: this._recordId,
			showResetButton: this.showResetButton === true,
			showSaveAndNewButton: this._recordId === undefined && this.hideSaveAndNewButton === false,
			isLoading: this.isLoading === true,
			handleCancelClick: this.handleCancelClick,
			handleSaveClick: this.handleSaveClick,
			handleSaveAndNewClick: this.handleSaveAndNewClick
		};
	}

	get formVariant() {
		return this.recordId === undefined
			? FORM_VARIANT_CREATE
			: FORM_VARIANT_EDIT;
	}

	connectedCallback() {
		if (this.hasConnected === false) {
			this._sendUpdateButtonStateEvent();
			this.hasConnected = true;
		}
	}

	@wire(getObjectInfo, {objectApiName: "$objectImport"})
	handleGetObjectInfo({data, error}) {
		try {
			if (error) {
				this.handleError(error);
			} else if (data) {
				this.dispatchEvent(new CustomEvent(
					"described",
					{
						detail: data
					}
				));
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleFormLoad(ev) {
		try {
			ev.stopPropagation();
			if (this.isLoading === true) {
				this.isLoading = false;
				this._sendUpdateButtonStateEvent();
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	_sendUpdateButtonStateEvent() {
		this.dispatchEvent(new CustomEvent(
			"buttonstate",
			{
				detail: {
					state: this.buttonState
				}
			}
		));
	}

	handleFormSave(ev) {
		try {
			ev.stopPropagation();
			this.recordEditedOrCreated = true;
			if (this.wasLastClickSaveAndNew === true) {
				this.refs.recordDetail.reset();
				this.dispatchEvent(new CustomEvent(
					"saveandnew",
					{
						detail: ev.detail
					}
				));
			} else {
				this.dispatchEvent(new CustomEvent(
					"save",
					{
						detail: ev.detail
					}
				));
			}
		} catch (ex) {
			this.handleError(ex);
		} finally {
			if (this.isLoading === true) {
				this.isLoading = false;
				this._sendUpdateButtonStateEvent();
			}
		}
	}

	handleFormError(ev) {
		try {
			ev.stopPropagation();
			if (this.isLoading === true) {
				this.isLoading = false;
				this._sendUpdateButtonStateEvent();
			}
			this.dispatchEvent(new CustomEvent(
				"error",
				{
					detail: ev.detail
				}
			));
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleCancelClick = () => {
		try {
			this.dispatchEvent(new CustomEvent("cancel"))
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleResetClick = () => {
		try {
			if (this.isLoading === false && this.showResetButton === true) {
				this.refs.recordDetail.reset();
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleSaveAndNewClick = () => {
		try {
			if (this.isLoading === false) {
				//Not setting loading here as there is no way of catching validation errors
				this.wasLastClickSaveAndNew = true;
				this.refs.recordDetail.save();
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleSaveClick = () => {
		try {
			if (this.isLoading === false) {
				//Not setting loading here as there is no way of catching validation errors
				this.refs.recordDetail.save();
				this._sendUpdateButtonStateEvent();
			}
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