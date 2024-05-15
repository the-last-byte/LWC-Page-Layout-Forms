import {api, LightningElement} from 'lwc';

import {
	FIELD_VARIANT_LABEL_HIDDEN,
	FIELD_VARIANT_LABEL_STACKED,
	FIELD_VARIANT_STANDARD,
	FORM_VARIANT_AUTO,
	FORM_VARIANT_CREATE,
	FORM_VARIANT_EDIT
} from "c/recordDetailUtil";

export default class RecordDetailField extends LightningElement {

	/** @type {RecordDetailUtil.Private.CollatedField} */
	@api field;
	isInlineEditLoading = false;
	hasConnected = false;
	displayEditMode = false;

	/**
	 * @type {RecordDetailUtil.FormVariantEnum}
	 */
	_displayedFieldFormVariant;

	@api
	get displayedFieldFormVariant() {
		return this._displayedFieldFormVariant;
	}

	set displayedFieldFormVariant(value) {
		this._displayedFieldFormVariant = value;
		this.isInlineEditLoading = false;
		if (this.hasConnected === true) {
			this.setEditMode();
		}
	}

	get editText() {
		return `Edit: ${this.field.label}`;
	}

	get showInlineEdit() {
		return this._displayedFieldFormVariant === FORM_VARIANT_AUTO &&
			this.field.readonly === false &&
			this.field.collatedReadonlyOnEdit === false &&
			this.field.disabled === false;
	}

	get isLabelHidden() {
		return this.field.variant === FIELD_VARIANT_LABEL_HIDDEN;
	}

	get inlineEditButtonClassName() {
		return this.isInlineEditLoading === true
			? "slds-hidden"
			: "";
	}

	get labelOuterClassName() {
		return this.isLabelHidden === true
			? "slds-assistive-text"
			: "";
	}

	get outerClassName() {
		let className = "rdf_outerContainer slds-form-element";
		if (this._displayedFieldFormVariant !== FORM_VARIANT_EDIT) {
			className += this.showInlineEdit === true
				? " slds-form-element_edit slds-form-element_readonly slds-hint-parent"
				: " slds-form-element_readonly";
		}
		const variant = this.field.variant;
		if (variant === FIELD_VARIANT_STANDARD) {
			className += " slds-form-element_horizontal"
		} else if (variant === FIELD_VARIANT_LABEL_STACKED) {
			className += " slds-form-element_stacked";
		}
		return className;
	}

	handleInlineEditClick(ev) {
		ev.stopPropagation();
		this.isInlineEditLoading = true;
		if (this.showInlineEdit === true) {
			this.dispatchEvent(new CustomEvent("inlineedit"));
		}
	}

	setEditMode() {
		const field = this.field;
		if (field.readonly === false) {
			if (this._displayedFieldFormVariant === FORM_VARIANT_CREATE) {
				if (field.collatedReadonlyOnCreate === false) {
					this.displayEditMode = true;
					return;
				}
			} else if (this._displayedFieldFormVariant === FORM_VARIANT_EDIT) {
				if (field.collatedReadonlyOnEdit === false) {
					this.displayEditMode = true;
					return;
				}
			}
		}
		this.displayEditMode = false;
	}

	connectedCallback() {
		if (this.hasConnected === false) {
			this.hasConnected = true;
			this.setEditMode();
		}
	}

}
