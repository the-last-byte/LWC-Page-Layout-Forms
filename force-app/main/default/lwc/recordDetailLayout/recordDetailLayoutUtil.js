import {trimmedStringOrDefault} from "c/recordDetailUtil";

/**
 * @typedef SizeSetting
 *
 * @property {string} label
 * @property {string} horizontalCssStyle
 * @property {string} verticalCssStyle
 *
 * @private
 */

/**
 * @type {{SMALL: SizeSetting, XXX_SMALL: SizeSetting, MEDIUM: SizeSetting, XX_SMALL: SizeSetting, X_SMALL: SizeSetting, LARGE: SizeSetting, X_LARGE: SizeSetting, NONE: SizeSetting}}
 */
const SIZES = {
	NONE: {
		label: "none",
		horizontalCssStyle: "0",
		verticalCssStyle: "0"
	},
	XXX_SMALL: {
		label: "xxxSmall",
		horizontalCssStyle: "var(--lwc-varSpacingHorizontalXxxSmall)",
		verticalCssStyle: "var(--lwc-varSpacingVerticalXxxSmall)"
	},
	XX_SMALL: {
		label: "xxSmall",
		horizontalCssStyle: "var(--lwc-varSpacingHorizontalXxSmall)",
		verticalCssStyle: "var(--lwc-varSpacingVerticalXxSmall)"
	},
	X_SMALL: {
		label: "xSmall",
		horizontalCssStyle: "var(--lwc-varSpacingHorizontalXSmall)",
		verticalCssStyle: "var(--lwc-varSpacingVerticalXSmall)"
	},
	SMALL: {
		label: "small",
		horizontalCssStyle: "var(--lwc-varSpacingHorizontalSmall)",
		verticalCssStyle: "var(--lwc-varSpacingVerticalSmall)"
	},
	MEDIUM: {
		label: "medium",
		horizontalCssStyle: "var(--lwc-varSpacingHorizontalMedium)",
		verticalCssStyle: "var(--lwc-varSpacingVerticalMedium)"
	},
	LARGE: {
		label: "large",
		horizontalCssStyle: "var(--lwc-varSpacingHorizontalLarge)",
		verticalCssStyle: "var(--lwc-varSpacingVerticalLarge)"
	},
	X_LARGE: {
		label: "xLarge",
		horizontalCssStyle: "var(--lwc-varSpacingHorizontalXLarge)",
		verticalCssStyle: "var(--lwc-varSpacingVerticalXLarge)"
	}
};

/** @type {SizeSetting} */
const DEFAULT_HORIZONTAL_GAP = SIZES.SMALL;
/** @type {SizeSetting} */
const DEFAULT_VERTICAL_GAP = SIZES.NONE;
/** @type {number} */
const DEFAULT_COLUMN_COUNT = 2;
/** @type {string} */
const DEFAULT_MIN_COLUMN_WIDTH = "var(--lwc-sizeMedium)";

/**
 * @param {string} label
 * @param {SizeSetting} defaultValue
 * @returns {SizeSetting}
 */
const getGapFromLabel = (label, defaultValue) => {
	const cleaned = trimmedStringOrDefault(label);
	if (cleaned !== undefined) {
		switch (cleaned.toLowerCase()) {
			case SIZES.NONE.label.toLowerCase():
				return SIZES.NONE;
			case SIZES.XXX_SMALL.label.toLowerCase():
				return SIZES.XXX_SMALL;
			case SIZES.XX_SMALL.label.toLowerCase():
				return SIZES.XX_SMALL;
			case SIZES.X_SMALL.label.toLowerCase():
				return SIZES.X_SMALL;
			case SIZES.SMALL.label.toLowerCase():
				return SIZES.SMALL;
			case SIZES.MEDIUM.label.toLowerCase():
				return SIZES.MEDIUM;
			case SIZES.LARGE.label.toLowerCase():
				return SIZES.LARGE;
			case SIZES.X_LARGE.label.toLowerCase():
				return SIZES.X_LARGE;
			default:
				console.error("Unexpected size specified: " + label + ". Using default of " + defaultValue.label);
		}
	}
	return defaultValue;
}

export {
	getGapFromLabel,
	DEFAULT_HORIZONTAL_GAP,
	DEFAULT_VERTICAL_GAP,
	DEFAULT_COLUMN_COUNT,
	DEFAULT_MIN_COLUMN_WIDTH
}