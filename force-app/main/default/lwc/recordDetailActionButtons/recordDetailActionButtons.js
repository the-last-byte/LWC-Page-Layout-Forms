import {api, LightningElement} from 'lwc';
import {describeValueTypeForDisplay, functionOrDefault, objectOrDefault, parseError} from "c/recordDetailUtil";

/**
 * @param {Partial<RecordDetailUtil.Private.ButtonStateData>|*} state
 * @return {RecordDetailUtil.Private.ButtonStateData|undefined}
 */
const normalizeAndValidateState = state => {
	const cleanedState = /** @type {Partial<RecordDetailUtil.Private.ButtonStateData>|undefined} */objectOrDefault(state);
	if (cleanedState === undefined) {
		return undefined;
	}
	/** @type {RecordDetailUtil.Private.ButtonStateData} */
	const out = {
		handleCancelClick: functionOrDefault(cleanedState.handleCancelClick),
		handleSaveAndNewClick: functionOrDefault(cleanedState.handleSaveAndNewClick),
		handleSaveClick: functionOrDefault(cleanedState.handleSaveClick),
		isLoading: cleanedState.isLoading === true,
		showResetButton: cleanedState.showResetButton === true,
		showSaveAndNewButton: cleanedState.showSaveAndNewButton === true
	};
	if (out.handleCancelClick === undefined) {
		throw new TypeError(
			`Expected RecordDetailUtil.Private.ButtonStateData.handleCancelClick to be a function.  Got ${describeValueTypeForDisplay(cleanedState.handleCancelClick)}.`
		);
	}
	if (out.handleSaveAndNewClick === undefined) {
		throw new TypeError(
			`Expected RecordDetailUtil.Private.ButtonStateData.handleSaveAndNewClick to be a function.  Got ${describeValueTypeForDisplay(cleanedState.handleSaveAndNewClick)}.`
		);
	}
	if (out.handleSaveClick === undefined) {
		throw new TypeError(
			`Expected RecordDetailUtil.Private.ButtonStateData.handleSaveClick to be a function.  Got ${describeValueTypeForDisplay(cleanedState.handleSaveClick)}.`
		);
	}
	console.log("out", JSON.stringify(out, null, 2))
	return out;
}

export default class RecordDetailActionButtons extends LightningElement {

	/** @type {RecordDetailUtil.Private.ButtonStateData|undefined} */
	state;

	@api hideButtons = false;

	@api isQuickAction = false;

	@api
	get config() {
		return this.state === undefined
			? undefined
			: {...this.state};
	}

	set config(value) {
		try {
			this.state = normalizeAndValidateState(value);
		} catch (ex) {
			this.handleError(ex);
		}
	}

	get showButtons() {
		return this.hideButtons !== true && this.state !== undefined;
	}

	get buttonClassName() {
		return this.isQuickAction === true
			? "slds-grid slds-grid_align-end"
			: "slds-grid slds-grid_align-center";
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