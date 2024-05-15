import {api, LightningElement} from 'lwc';
import {parseError} from "c/recordDetailUtil";

export default class FormLayoutSection extends LightningElement {

	@api header;

	_isCollapsed = false;

	_isCollapsable = false;

	@api
	get isCollapsable() {
		return this._isCollapsable;
	}

	set isCollapsable(value) {
		try {
			this._isCollapsable = value === true;
			this._isCollapsed = false;
		} catch (ex) {
			this.handleError(ex);
		}
	}

	_headerHidden = false;

	@api
	get headerHidden() {
		return this._headerHidden;
	}

	set headerHidden(value) {
		try {
			if (value === true) {
				this._headerHidden = true;
				this._isCollapsed = false;
			} else {
				this._headerHidden = false;
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	get _isExpanded() {
		return !this._isCollapsed;
	}

	get showHeader() {
		return this._headerHidden === false && !!this.header;
	}

	get outerClassName() {
		let classes = "slds-m-vertical_none slds-section ";
		if (!!this.header) {
			classes += " has-header";
		}
		if (this._isCollapsed === false) {
			classes += " slds-is-open";
		}

		classes += this.suppressPaddingBlockEnd === true
			? " slds-p-bottom_xx-small"
			: " slds-p-bottom_medium";
		return classes;
	}

	get mainSectionStyle() {
		return this._isCollapsed === true
			? "height: 0px; overflow: hidden; transition: none 0s ease 0s;"
			: "height: auto; overflow: initial; transition: none 0s ease 0s;";
	}

	handleCollapseClick() {
		try {
			if (this._isCollapsable === true) {
				this._isCollapsed = !this._isCollapsed;
			} else {
				this._isCollapsed = false;
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	errorCallback(error, stack) {
		this.handleError(error, stack);
	}

	handleError(error, stack) {
		this.dispatchEvent(
			parseError(error, stack).logToConsole().getToastEvent()
		);
	}
}