/**
 * @copyright 2024 Nic Edwards - The Last Byte Consulting
 */
import {api, LightningElement, wire} from 'lwc';
import {getObjectInfo} from "lightning/uiObjectInfoApi";
import {ShowToastEvent} from "lightning/platformShowToastEvent"
import {loadStyle} from "lightning/platformResourceLoader";
import {NavigationMixin} from "lightning/navigation";
import STYLES from "@salesforce/resourceUrl/recordDetailStyles";
import isRecordEditable from "@salesforce/apex/RecordDetailController.isRecordEditable"
import {
	extractLayoutFromRecordUi,
	mergeDefaultValuesIntoRecord,
	normalizeAndValidateLayoutSections
} from "./recordDetailValidations";

import TEMPLATE_DEFAULT from "./recordDetail.html";
import TEMPLATE_EDIT from "./editMode.html";
import TEMPLATE_READ from "./readMode.html";

import {
	DEFAULT_FIELD_VARIANT,
	DEFAULT_FORM_VARIANT,
	describeValueTypeForDisplay,
	extractRecordName,
	FIELD_VARIANTS,
	FORM_VARIANT_AUTO,
	FORM_VARIANT_CREATE,
	FORM_VARIANT_EDIT,
	FORM_VARIANT_VIEW,
	FORM_VARIANTS,
	functionOrDefault,
	normalizeAndValidateStringChoice,
	objectIdOrDefault,
	objectOrDefault,
	parseError,
	RaceConditionHandler,
	randomString,
	trimmedStringOrDefault,
	validateFieldId
} from "c/recordDetailUtil";

import DynamicRecordRepresentation from "./dynamicRecordRepresentation";
import {notifyRecordUpdateAvailable} from "lightning/uiRecordApi";

/**
 * Returns the specified form variant, updated for record permissions and whether
 * inline edit is active.
 *
 * @param specifiedFormVariant
 * @param isReady
 * @param hasEditAccess
 * @param isInlineEditActive
 * @return {RecordDetailUtil.FormVariantEnum|*}
 */
const getSpecifiedFormVariantAsDisplayed = (specifiedFormVariant, isReady, hasEditAccess, isInlineEditActive) => {
	if (specifiedFormVariant === FORM_VARIANT_CREATE) {
		return FORM_VARIANT_CREATE;
	}
	if (hasEditAccess === false) {
		return FORM_VARIANT_VIEW;
	}
	if (specifiedFormVariant === FORM_VARIANT_EDIT || isInlineEditActive === true) {
		return FORM_VARIANT_EDIT;
	}
	return isReady === true
		? specifiedFormVariant
		: FORM_VARIANT_VIEW;
}

const getDisplayedFieldFormVariant = (specifiedFormVariant, displayedFormVariant) => {
	if (specifiedFormVariant === FORM_VARIANT_AUTO) {
		return displayedFormVariant === FORM_VARIANT_EDIT
			? FORM_VARIANT_EDIT
			: FORM_VARIANT_AUTO;
	}
	return displayedFormVariant;
}

const REFRESH_TYPE__INITIAL_DESCRIBE = "InitialDescribe";
const REFRESH_TYPE__INLINE_EDIT_CLOSE = "InlineEditClose";
const REFRESH_TYPE__INLINE_EDIT_OPEN = "InlineEditOpen";
const REFRESH_TYPE__RECORD_LOAD = "RecordLoad";
const REFRESH_TYPE__RECORD_SAVED = "RecordSaved";
const REFRESH_TYPE__SECTIONS_UPDATED = "SectionsUpdated";
const REFRESH_TYPE__TARGET_OBJECT_UPDATED = "TargetedObjectUpdated";

/**
 * @type {Object}
 */
const RefreshTypes = {
	InitialDescribe: REFRESH_TYPE__INITIAL_DESCRIBE,
	InlineEditClose: REFRESH_TYPE__INLINE_EDIT_CLOSE,
	InlineEditOpen: REFRESH_TYPE__INLINE_EDIT_OPEN,
	RecordLoad: REFRESH_TYPE__RECORD_LOAD,
	RecordSaved: REFRESH_TYPE__RECORD_SAVED,
	SectionsUpdated: REFRESH_TYPE__SECTIONS_UPDATED,
	TargetedObjectUpdated: REFRESH_TYPE__TARGET_OBJECT_UPDATED,
};

/**
 * @type {Object}
 */
const RefreshActions = {
	RebuildSections: 'RebuildSections',
	UpdateFormVariant: 'UpdateFormVariant'
};

const REFRESH_TIMEOUT = 150;

export default class RecordDetail extends NavigationMixin(LightningElement) {

	/** @type {module:RaceConditionHandler.RaceConditionHandler} */
	_layoutResolveSchedulable;

	/** @type {Set<string>} */
	_scheduledRefreshTypes = new Set();

	/**
	 * Flag to determine whether to schedule a refresh after a field
	 * that doesn't fire its change refresh should fire its blur refresh
	 * @type {boolean}
	 */
	hasCurrentFieldChanged = false;

	/** @type {RecordDetailUtil.Private.CollatedLayoutSection[]} **/
	_normalizedSections;
	/**
	 * @type {ObjectId|undefined}
	 */
	_sObjectImport;
	/**
	 * A unique key prefix to avoid ID collision.
	 *
	 * @type {string}
	 * @private
	 */
	uniqueKey;
	/**
	 * @type {module:lightning/uiRecordApi.ObjectInfoRepresentation}
	 */
	objectDescribe;
	isInlineEditActive = false;
	isSaving = false;
	hasConnected = false;
	hasEditAccess = false;
	/** @type {module:lightning/uiRecordApi.RecordUI} */
	recordUi;

	/** @type {string[]} */
	controllingFieldNames = [];

	/**
	 * @type {RecordDetailUtil.Private.DynamicRecordRepresentation}
	 */
	recordRepresentation;
	/**
	 * @type {Map<string, *>}
	 * @private
	 */
	_defaultFieldValueMap;
	/**
	 * The form variant specified on the recordDetail LWC.
	 *
	 * @type {RecordDetailUtil.FormVariantEnum}
	 */
	_specifiedFormVariant = DEFAULT_FORM_VARIANT;
	/**
	 * The currently displayed form variant.  For example, while an inline editable
	 * form will have a `_specifiedFormVariant` of "auto", the
	 * `_displayedFormVariant` will either be "view" or "edit".
	 *
	 * @type {RecordDetailUtil.FormVariantEnum}
	 */
	_displayedFormVariant;
	/**
	 * The currently displayed form variant to be applied to each field.  This
	 * applies the following rules:
	 * 	- "auto": 	Fields are in READ mode with inline edit capabilities.
	 * 	- "read": 	Fields are readonly.
	 * 	- "edit": 	Fields are in edit mode.  This will be true for forms with
	 * 				a `_specifiedFormVariant` of "edit", "create", or "auto" (only
	 * 				when the user is inline-editing).
	 *
	 * Note that the above rules can be overridden at the field level for fields
	 * that are readonly, etc.
	 *
	 * @type {RecordDetailUtil.FormVariantEnum}
	 */
	_displayedFieldFormVariant;
	/**
	 * @type {string[]|undefined}
	 * @private
	 */
	_hiddenFieldNames;

	constructor() {
		super();
		this.uniqueKey = randomString(5);
		const schedulable = new RaceConditionHandler();
		schedulable.addResolveCallback(() => {
			try {
				const refreshTypes = Array.from(this._scheduledRefreshTypes);
				this._scheduledRefreshTypes.clear();
				this.__refreshFormLayout(refreshTypes);
			} catch (ex) {
				this.handleError(ex);
			}
		});
		this._layoutResolveSchedulable = schedulable;
	}

	get recordTypeId() {
		return this.recordRepresentation === undefined
			? undefined
			: this.recordRepresentation.getFieldValue("RecordTypeId");
	}

	/**
	 * Default values that can be set on init. Only effects create
	 * and edit modes.
	 * @type {Record<string, *>|undefined}
	 * @private
	 */
	_defaultFieldValues;

	@api
	get defaultFieldValues() {
		return this._defaultFieldValues;
	}

	// noinspection JSUnusedGlobalSymbols
	set defaultFieldValues(value) {
		try {
			let hasValue = false;
			/** @type {Record<FieldId, *>} */
			const cleaned = objectOrDefault(value);
			if (cleaned !== undefined) {

				/** @type {Map<string, *>} */
				const valueMap = new Map();
				const fieldNames = Object.keys(cleaned);
				const fieldCount = fieldNames.length;
				if (fieldCount !== 0) {
					for (let fieldName, fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
						fieldName = fieldNames[fieldIndex];
						valueMap.set(fieldName, cleaned[fieldName]);
					}
				}
				if (valueMap.size !== 0) {
					this._defaultFieldValueMap = valueMap;
					this._defaultFieldValues = cleaned;
					hasValue = true;
				}
			}
			if (hasValue === false) {
				this._defaultFieldValueMap = undefined;
				this._defaultFieldValues = undefined;
			}
			if (this.recordRepresentation !== undefined) {
				const recordRepresentation = this.recordRepresentation.clone();
				this._applyDefaultValueMapToRecord(recordRepresentation);
				this.recordRepresentation = recordRepresentation;
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	@api
	get targetObject() {
		return this._sObjectImport;
	}

	// noinspection JSUnusedGlobalSymbols
	set targetObject(value) {
		try {
			objectIdOrDefault(value);
			this.objectDescribe = undefined;
			this._normalizedSections = undefined;
			this._sObjectImport = value || undefined;
			this.scheduleFormLayoutRefresh(RefreshTypes.TargetedObjectUpdated)
				.catch(this.handleError);
		} catch (ex) {
			this.handleError(ex);
		}
	}

	/**
	 * The method to call prior to submit.  If this returns
	 * an object, that record will be used.  If this returns
	 * anything else, the save will be cancelled.  Thrown errors
	 * will be handled and displayed to the user.
	 *
	 * @type {(undefined|function(record: object):(object|Promise<object>|Promise<*>|*))}
	 * @private
	 */
	_submitMethod;

	@api
	get submitMethod() {
		return this._submitMethod;
	}

	// noinspection JSUnusedGlobalSymbols
	set submitMethod(value) {
		this._submitMethod = functionOrDefault(value);
	}

	/** @type {string|undefined} */
	_recordId;

	@api
	get recordId() {
		return this._recordId;
	}

	set recordId(value) {
		try {
			this._recordId = trimmedStringOrDefault(value);
			if (this.hasConnected === true) {
				this.recordUi = undefined;
				this.recordRepresentation = undefined;
				this._normalizedSections = undefined;
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	/** @type {RecordDetailUtil.FieldVariantEnum} */
	_defaultFieldVariant = DEFAULT_FIELD_VARIANT;

	@api
	get defaultFieldVariant() {
		return this._defaultFieldVariant;
	}

	// noinspection JSUnusedGlobalSymbols
	set defaultFieldVariant(value) {
		try {
			this._defaultFieldVariant = normalizeAndValidateStringChoice(
				value,
				DEFAULT_FIELD_VARIANT,
				FIELD_VARIANTS,
				"default-field-variant"
			);
		} catch (ex) {
			this.handleError(ex);
		}
	}

	@api
	get formVariant() {
		return this._specifiedFormVariant;
	}

	// noinspection JSUnusedGlobalSymbols
	set formVariant(value) {
		try {
			this._specifiedFormVariant = normalizeAndValidateStringChoice(
				value,
				DEFAULT_FORM_VARIANT,
				FORM_VARIANTS,
				"form-variant"
			);
			this.isInlineEditActive = false;
		} catch (ex) {
			this.handleError(ex);
		}
	}

	_isCollapsable = false;

	@api
	get isCollapsable() {
		return this._isCollapsable;
	}

	// noinspection JSUnusedGlobalSymbols
	set isCollapsable(value) {
		this._isCollapsable = value === true;
	}

	/**
	 * @type {Array<FieldId|string>|undefined}
	 * @private
	 */
	_hiddenFields;

	@api
	get hiddenFields() {
		return this._hiddenFields;
	}

	// noinspection JSUnusedGlobalSymbols
	set hiddenFields(values) {
		try {
			if (values == null) {
				this._hiddenFields = undefined;
			} else if (Array.isArray(values) === true) {
				const valueCount = values.length;
				if (valueCount === 0) {
					this._hiddenFields = undefined;
				} else {
					const fieldNames = [];
					for (let i = 0, j = values.length; i < j; i++) {
						const value = values[i];
						if (typeof value === "string") {
							fieldNames.push(value);
						} else if (validateFieldId(value)) {
							fieldNames.push(value.fieldApiName);
						} else {
							this.handleError(new TypeError(
								`Expected hidden-fields[${i}] to be a string or FieldId, got: ${describeValueTypeForDisplay(value)}.`
							));
							return;
						}
					}
					this._hiddenFields = values;
					this._hiddenFieldNames = fieldNames;
				}
			} else {
				this.handleError(new TypeError(
					`Expected hidden-fields to be an Array, got: ${describeValueTypeForDisplay(values)}.`
				));
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	get isEditMode() {
		return this._displayedFormVariant === FORM_VARIANT_EDIT || this._specifiedFormVariant === FORM_VARIANT_CREATE;
	}

	get outerClassName() {
		return this.isInlineEditActive === true
			? "inlineEditMode slds-p-horizontal_medium slds-p-top_x-small"
			: "";
	}

	get isReady() {
		return this._sObjectImport !== undefined && (this._recordId !== undefined || this._specifiedFormVariant === FORM_VARIANT_CREATE);
	}

	/**
	 * @return {RecordDetailUtil.Private.LayoutSettings}
	 */
	get settings() {
		return {
			recordId: this._recordId,
			uniqueKey: this.uniqueKey,
			sObjectImport: /** @type {ObjectId} */ this._sObjectImport,
			defaultVariant: this._defaultFieldVariant,
			objectDescribe: this.objectDescribe,
			recordUi: this.recordUi,
			layoutMode: this._displayedFormVariant,
			getFieldValueMethod: this._getFieldValue,
			controllingFieldNames: this.controllingFieldNames,
			hiddenFieldNames: this._hiddenFieldNames
		};
	}

	/**
	 * @param {string} refreshType
	 * @param {boolean} [immediate]
	 */
	async scheduleFormLayoutRefresh(refreshType, immediate) {
		this._scheduledRefreshTypes.add(refreshType);
		this._layoutResolveSchedulable.start({
			endCurrentRun: true,
			timeout: immediate === true ? 0 : REFRESH_TIMEOUT
		}).catch(ex => {
			this.handleError(ex);
		});
	}

	/**
	 * @param {string[]} refreshTypes
	 */
	__refreshFormLayout = (refreshTypes) => {
		try {

			//Ensure refreshes have been requested
			const refreshTypeCount = refreshTypes.length;
			if (refreshTypeCount === 0) {
				console.error("refreshTypeCount should never be 0");
				return;
			}

			//Gather a unique list of actions
			const actions = new Set();
			for (let i = 0; i < refreshTypeCount; i++) {
				switch (refreshTypes[i]) {

					//Inline Edit updates
					case RefreshTypes.InlineEditClose:
					case RefreshTypes.InlineEditOpen:
						actions.add(RefreshActions.UpdateFormVariant);
						break;

					case RefreshTypes.InitialDescribe:
						actions.add(RefreshActions.UpdateFormVariant);
						actions.add(RefreshActions.RebuildSections);
						break;

					case RefreshTypes.RecordLoad:
						actions.add(RefreshActions.UpdateFormVariant);
						actions.add(RefreshActions.RebuildSections);
						break;

					case RefreshTypes.RecordSaved:
						actions.add(RefreshActions.UpdateFormVariant);
						break;

					case RefreshTypes.SectionsUpdated:
						actions.add(RefreshActions.RebuildSections);
						break;

					case RefreshTypes.TargetedObjectUpdated:
						actions.add(RefreshActions.UpdateFormVariant);
						actions.add(RefreshActions.RebuildSections);
						break;

					default:
						this.handleError(new Error(`Unknown refresh type: ${refreshTypes[i]}`));
						return;
				}
			}

			//Handle form variant changes
			const formVariantUpdated = actions.has(RefreshActions.UpdateFormVariant) === true
				? this.__updateFormVariant()
				: false;

			//Rebuild sections
			const sectionsRebuilt = formVariantUpdated === true || actions.has(RefreshActions.RebuildSections) === true;
			if (sectionsRebuilt === true) {
				this.__rebuildSections();
			}

		} catch (ex) {
			this.handleError(ex);
		}
	}

	/**
	 * Updates the current display based on the current
	 * configuration and state.
	 * @return {boolean}
	 * 	Has the displayed form or field variant changed?
	 * @private
	 */
	__updateFormVariant() {
		//Get the specified for variant updated based on permissions and
		//whether inline edit is active (e.g. if variant is "auto" with
		//inline edit, the result will be "edit").
		const normalizedSpecifiedFormVariant = getSpecifiedFormVariantAsDisplayed(
			this._specifiedFormVariant,
			this.isReady,
			this.hasEditAccess,
			this.isInlineEditActive
		);

		//Get the actual displayed element (auto will appear as view mode)
		const displayedFormVariant = normalizedSpecifiedFormVariant === FORM_VARIANT_AUTO
			? FORM_VARIANT_VIEW
			: normalizedSpecifiedFormVariant;

		//Track variant changes for output
		let hasChanges = false;

		//Send of an *internal* event if the displayed variant has changed
		if (this._displayedFormVariant !== displayedFormVariant) {
			this._displayedFormVariant = displayedFormVariant;
			hasChanges = true;
			this.dispatchEvent(new CustomEvent(
				"displayedformvariantchange",
				{
					detail: {
						value: displayedFormVariant
					}
				}
			));
		}

		//Get the form variant to apply to the fields
		const displayedFieldFormVariant = getDisplayedFieldFormVariant(
			this._specifiedFormVariant,
			this._displayedFormVariant
		);
		if (this._displayedFieldFormVariant !== displayedFieldFormVariant) {
			hasChanges = true;
		}
		this._displayedFieldFormVariant = displayedFieldFormVariant;

		//Return whether a change as occurred
		return hasChanges;
	}

	/**
	 * @param {RecordDetailUtil.Private.DynamicRecordRepresentation} recordRepresentation
	 * @return {boolean} Returns true if defaults have changed.
	 * @private
	 */
	_applyDefaultValueMapToRecord(recordRepresentation) {
		if (this._defaultFieldValueMap === undefined) {
			return false;
		}
		recordRepresentation.resetFieldWatcher();
		this._defaultFieldValueMap.forEach((value, fieldName) => {
			recordRepresentation.setFieldValue(fieldName, value);
		});
		if (recordRepresentation.haveFieldsChanged() === true) {
			recordRepresentation.resetFieldWatcher();
			return true;
		}
		return false;
	}

	_getFieldValue = fieldName => {
		return this.recordRepresentation === undefined
			? undefined
			: this.recordRepresentation.getFieldValue(fieldName);
	}

	hasDataForLayoutInit() {
		if (this._sObjectImport === undefined || this.objectDescribe === undefined) {
			return false;
		}
		if (this._recordId === undefined && this._specifiedFormVariant !== FORM_VARIANT_CREATE) {
			return false;
		}
		if (this._specifiedFormVariant === FORM_VARIANT_CREATE) {
			return this.recordUi !== undefined;
		}
		return true;
	}

	__rebuildSections() {
		if (this.hasDataForLayoutInit() === true && this.settings.recordUi) {
			this._normalizedSections = normalizeAndValidateLayoutSections(this.settings);
		} else {
			this._normalizedSections = undefined;
		}
	}

	disconnectedCallback() {
		this._layoutResolveSchedulable.abort();
		this._layoutResolveSchedulable.clearResolveCallbacks();
	}

	async connectedCallback() {
		try {
			if (this.hasConnected === false) {

				//Warnings
				setTimeout(
					() => {
						if (this.isReady === false) {
							if (this._displayedFormVariant !== FORM_VARIANT_CREATE && this._recordId === undefined) {
								console.error("No record ID provided to recordDetail component.")
							}
						}
					},
					10000
				);

				loadStyle(this, STYLES)
					.catch(this.handleError);

				this.hasConnected = true;

			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	@wire(getObjectInfo, {objectApiName: "$_sObjectImport"})
	handleGetObjectInfo({error, data}) {
		if (error) {
			this.handleError(error);
		} else if (data) {
			/** @type {module:lightning/uiRecordApi.ObjectInfoRepresentation} */
			this.objectDescribe = data;

			/** @type {Set<string>} */
			const controllingFieldNames = new Set();
			const fieldArray = Object.values(data.fields);
			for (let i = 0, j = fieldArray.length; i < j; i++) {
				const field = fieldArray[i];
				if (field.controllingFields) {
					for (let i = 0, j = field.controllingFields.length; i < j; i++) {
						controllingFieldNames.add(field.controllingFields[i]);
					}
				}
			}
			this.controllingFieldNames = Array.from(controllingFieldNames);

			this.scheduleFormLayoutRefresh(RefreshTypes.InitialDescribe)
				.catch(this.handleError);
		}
	}

	@wire(isRecordEditable, {recordId: "$_recordId"})
	handleGetRecordEditable({error, data}) {
		if (error) {
			this.handleError(error);
		} else if (data === true || data === false) {
			try {
				this.hasEditAccess = data === true;
			} catch (ex) {
				this.handleError(ex);
			}
		}
	}

	handleRecordLoad(ev) {
		try {
			if (ev.detail === undefined) {
				return;
			}
			ev.stopPropagation();
			const isFirstLoad = this.recordRepresentation === undefined;
			let hasLayoutChanged = false;
			if (isFirstLoad === false) {
				const oldLayout = this.recordUi === undefined
					? undefined
					: extractLayoutFromRecordUi(
						this.recordUi,
						this._displayedFormVariant,
						this.objectDescribe.apiName,
						this.recordId
					);
				const newLayout = extractLayoutFromRecordUi(
					ev.detail,
					this._displayedFormVariant,
					this.objectDescribe.apiName,
					this.recordId
				);
				hasLayoutChanged = oldLayout === undefined
					|| oldLayout.recordTypeId !== newLayout.recordTypeId
					|| oldLayout.mode !== newLayout.mode;
			}

			//Update the RecordUI
			this.recordUi = ev.detail;

			//Get the current view
			const isView = this._displayedFormVariant === FORM_VARIANT_VIEW;
			const isCreate = this._specifiedFormVariant === FORM_VARIANT_CREATE;

			//Store whether to schedule a refresh.  This IS required as updating the displayed
			//sections will cause another refresh which will lead to a loop.
			let scheduleRefresh = isFirstLoad === true || hasLayoutChanged === true;

			//Get the record
			const record = isCreate === true
				? ev.detail.record
				: ev.detail.records[this._recordId];

			//Create the DynamicRecordRepresentation
			if (scheduleRefresh === true) {
				const recordRepresentation = new DynamicRecordRepresentation(
					record,
					/** @type {ObjectId} */this._sObjectImport
				);

				//Set the default record type (unless specified)
				if (isCreate === true) {
					if (!recordRepresentation.getFieldValue("RecordTypeId")) {
						const describe = this.objectDescribe;
						if (Object.keys(describe.recordTypeInfos).length > 1) {
							recordRepresentation.setFieldValue("RecordTypeId", describe.defaultRecordTypeId);
						}
					}
				}

				//Update default values on the record representation
				if (isView === false) {
					this._applyDefaultValueMapToRecord(recordRepresentation);
				}

				//Store the record representation
				this.recordRepresentation = recordRepresentation;
			}

			//Trigger the layout update
			if (scheduleRefresh === true) {
				this.scheduleFormLayoutRefresh(RefreshTypes.RecordLoad)
					.catch(this.handleError);
			}

			//Fire the load event (as the record data is ready - although the UI may not be)
			this.dispatchEvent(new CustomEvent(
				"load",
				{
					detail: {
						recordId: this._recordId,
						formVariant: this._displayedFormVariant,
						records: ev.detail.records,
						record
					}
				}
			));

		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleInlineEditClick(ev) {
		try {
			ev.stopPropagation();
			//Bumping this out of sync flow to allow UI to render
			setTimeout(async () => {
				try {
					this.isInlineEditActive = true;
					await this.scheduleFormLayoutRefresh(RefreshTypes.InlineEditOpen, true);
				} catch (ex) {
					this.handleError(ex);
				}
			});
		} catch (ex) {
			this.handleError(ex);
		}
	}

	async handleInlineEditCancelClick(ev) {
		try {
			ev.stopPropagation();
			if (this.isSaving === false) {
				this.isInlineEditActive = false;
				await this.scheduleFormLayoutRefresh(RefreshTypes.InlineEditClose, true);
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	async handleInlineEditSaveClick(ev) {
		try {
			ev.stopPropagation();
			ev.preventDefault();
			if (this._validateFields() === true) {
				this.refs.editFormSubmitButton.click();
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	_validateFields() {
		const fields = this.template.querySelectorAll("lightning-input-field");
		let isValid = true;
		for (let i = 0, j = fields.length; i < j; i++) {
			const field = fields[i];
			if (field.reportValidity() === false) {
				if (isValid === true) {
					isValid = false;
					setTimeout(() => {
						field.scrollIntoView({
							behavior: "smooth",
							block: "center"
						});
					});
				}
			}
		}
		return isValid;
	}

	async handleEditFormSubmit(ev) {
		try {
			ev.stopPropagation();

			//Pre-commit validations
			if (this._validateFields() === false) {
				ev.preventDefault();
				return;
			}

			//Prepare the record with any default values not included in the
			//form layout
			let record = mergeDefaultValuesIntoRecord(
				ev.detail.fields,
				this._defaultFieldValues
			);

			try {
				this.isSaving = true;
				record = this._submitMethod === undefined
					? record
					: objectOrDefault(await this._submitMethod(record));
				if (!record) {
					this.isSaving = false;
					ev.preventDefault();
					return;
				}
			} finally {
				this.isSaving = false;
			}
			this.isSaving = true;
			this.refs.editForm.submit(record);
		} catch (ex) {
			this.handleError(ex);
			this.isSaving = false;
		}
	}

	handleEditFormError(ev) {
		try {
			ev.stopPropagation();
			this.isSaving = false;
			this.dispatchEvent(new ShowToastEvent({
				title: ev.detail.message,
				message: ev.detail.detail,
				variant: "error"
			}));
			this.dispatchEvent(new CustomEvent("error"));
		} catch (ex) {
			this.handleError(ex);
		}
	}

	async handleEditFormSuccess(ev) {
		try {
			ev.stopPropagation();
			this.isSaving = false;
			this.isInlineEditActive = false;

			//Get the record
			/** @type {module:lightning/uiRecordApi.RecordRepresentation} */
			const record = ev.detail;

			//this.recordRepresentation does not need updating here as the record
			//is returned in the callback and the load callback will fire shortly

			//Refresh the component
			await this.scheduleFormLayoutRefresh(RefreshTypes.RecordSaved);

			//Send save event
			this.dispatchEvent(new CustomEvent(
				"save",
				{
					detail: {
						id: record.id,
						record
					}
				}
			));

			//Notify of record update
			notifyRecordUpdateAvailable([{
				recordId: this.recordId
			}]).catch(this.handleError);

			//Display success toast
			setTimeout(
				async () => {
					try {
						const recordUrl = await this[NavigationMixin.GenerateUrl]({
							type: "standard__recordPage",
							attributes: {
								recordId: record.id,
								actionName: "view",
								objectApiName: this._sObjectImport.objectApiName
							}
						});
						this.dispatchEvent(new ShowToastEvent({
							title: "Success!",
							message: "{0} successfully {1}",
							variant: "success",
							messageData: [
								{
									url: recordUrl,
									label: extractRecordName(
										record,
										this.objectDescribe.apiName,
										this.objectDescribe.nameFields,
										this.objectDescribe.label
									)
								},
								this._specifiedFormVariant === FORM_VARIANT_CREATE
									? "created"
									: "updated"
							]
						}));
					} catch (ex) {
						this.handleError(ex);
					}
				}
			);

		} catch (ex) {
			this.handleError(ex);
		}
	}

	handleFieldLabelClick(ev) {
		try {
			ev.stopPropagation();
			const el = this.template.querySelector(`lightning-input-field[data-id="${ev.target.dataset.fieldId}"]`);
			if (el) {
				el.focus();
			}
		} catch (ex) {
			console.error(ex);
		}
	}

	handleFieldChange(ev) {
		try {
			ev.stopPropagation();
			if (ev.target.dataset.updateOnBlur === "true") {
				this.hasCurrentFieldChanged = true;
			} else {
				this.recordRepresentation.setFieldValue(
					ev.target.fieldName,
					ev.target.value
				);
			}
		} catch (ex) {
			console.error(ex);
		}
	}

	handleFieldBlur(ev) {
		try {
			ev.stopPropagation();
			if (ev.target.dataset.updateOnBlur === "true") {
				const fieldName = ev.target.fieldName
				this.recordRepresentation.setFieldValue(
					fieldName,
					ev.target.value
				);
				this.hasCurrentFieldChanged = false;
			}
		} catch (ex) {
			console.error(ex);
		}
	}

	render() {
		try {
			if (this.isReady === false) {
				return TEMPLATE_DEFAULT;
			}
			return this.isEditMode === true
				? TEMPLATE_EDIT
				: TEMPLATE_READ;
		} catch (ex) {
			this.handleError(ex);
		}
	}

	errorCallback(error, stack) {
		this.handleError(error, stack);
	}

	handleError = (error, stack) => {
		console.error(error);
		this.dispatchEvent(
			parseError(error, stack).logToConsole().getToastEvent()
		);
	};

	@api save() {
		if (this._specifiedFormVariant === FORM_VARIANT_CREATE || this._displayedFormVariant === FORM_VARIANT_EDIT) {
			if (this.isReady === true && this.isSaving === false) {
				if (this._validateFields() === true) {
					this.refs.editFormSubmitButton.click();
				}
			}
		} else {
			this.handleError(new Error("Unable to programmatically save the form.  The form is currently not in edit mode."));
		}
	}

	@api reset() {
		try {
			if (this._specifiedFormVariant === FORM_VARIANT_CREATE || this._displayedFormVariant === FORM_VARIANT_EDIT) {
				if (this.isReady === true && this.isSaving === false) {
					this.refs.editFormResetButton.click();
				}
			} else {
				this.handleError(new Error("Unable to programmatically reset the form.  The form is currently not in edit mode."));
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

}
