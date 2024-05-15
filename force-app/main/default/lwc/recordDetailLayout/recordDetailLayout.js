import {api, LightningElement} from 'lwc';
import {
	DEFAULT_COLUMN_COUNT,
	DEFAULT_HORIZONTAL_GAP,
	DEFAULT_MIN_COLUMN_WIDTH,
	DEFAULT_VERTICAL_GAP,
	getGapFromLabel
} from "./recordDetailLayoutUtil";
import {integerOrDefault, trimmedStringOrDefault} from "c/recordDetailUtil";

export default class FormLayout extends LightningElement {

	@api suppressPaddingBlockEnd = false;

	/**
	 * @type {number}
	 * @private
	 */
	_columnCount = DEFAULT_COLUMN_COUNT;

	/**
	 * @returns {number}
	 */
	@api
	get columnCount() {
		return this._columnCount;
	}

	/**
	 * @param {number} value
	 */
	set columnCount(value) {
		try {
			const cleaned = integerOrDefault(value);
			if (cleaned === undefined || cleaned < 1 || cleaned > 25) {
				console.error(`Unexpected columnCount supplied: ${value}.  Expected an integer between 1 and 25.  Using default of ${DEFAULT_COLUMN_COUNT}.`);
				this._columnCount = DEFAULT_COLUMN_COUNT;
			} else {
				this._columnCount = cleaned;
			}
		} catch (ex) {
			this.handleError(ex);
		}
	}

	_columnWidth = DEFAULT_MIN_COLUMN_WIDTH;

	/**
	 * The CSS minimum width of the columns.  E.g. 350px, var(--lwc-sizeLarge), etc.
	 * @returns {string}
	 */
	@api
	get columnWidth() {
		return this._columnWidth;
	}

	/**
	 * The CSS minimum width of the columns.  E.g. 350px, var(--lwc-sizeLarge), etc.
	 * @param {string} value
	 */
	set columnWidth(value) {
		this._columnWidth = trimmedStringOrDefault(value, DEFAULT_MIN_COLUMN_WIDTH);
	}

	/**
	 * @type {SizeSetting}
	 * @private
	 */
	_horizontalGap = DEFAULT_HORIZONTAL_GAP;

	/**
	 * @return {("none"|"xxxSmall"|"xxSmall"|"xSmall"|"small"|"medium"|"large"|"xLarge")}
	 */
	@api
	get horizontalGap() {
		return this._horizontalGap.label;
	}

	/**
	 * @param {("none"|"xxxSmall"|"xxSmall"|"xSmall"|"small"|"medium"|"large"|"xLarge")} value
	 */
	set horizontalGap(value) {
		try {
			this._horizontalGap = getGapFromLabel(value, DEFAULT_HORIZONTAL_GAP);
		} catch (ex) {
			this.handleError(ex);
		}
	}


	/**
	 * @type {SizeSetting}
	 * @private
	 */
	_verticalGap = DEFAULT_HORIZONTAL_GAP;

	/**
	 * @return {("none"|"xxxSmall"|"xxSmall"|"xSmall"|"small"|"medium"|"large"|"xLarge")}
	 */
	@api
	get verticalGap() {
		return this._verticalGap.label;
	}

	/**
	 * @param {("none"|"xxxSmall"|"xxSmall"|"xSmall"|"small"|"medium"|"large"|"xLarge")} value
	 */
	set verticalGap(value) {
		try {
			this._verticalGap = getGapFromLabel(value, DEFAULT_VERTICAL_GAP);
		} catch (ex) {
			this.handleError(ex);
		}
	}

	get formLayoutStyle() {
		return `--horizontal-gap: ${this._horizontalGap.horizontalCssStyle}; --vertical-gap: ${this._verticalGap.verticalCssStyle}; --column-count: ${this._columnCount}; --column-min-width: ${this._columnWidth}`;
	}


}