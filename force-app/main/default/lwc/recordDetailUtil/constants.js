//region Field Variant

/**
 * @typedef {("standard"|"label-stacked"|"label-hidden")} RecordDetailUtil.FieldVariantEnum
 * @name FieldVariantEnum
 * @memberOf RecordDetailUtil
 */

/** @type {RecordDetailUtil.FieldVariantEnum} */
const FIELD_VARIANT_STANDARD = "standard";
/** @type {RecordDetailUtil.FieldVariantEnum} */
const FIELD_VARIANT_LABEL_STACKED = "label-stacked";
/** @type {RecordDetailUtil.FieldVariantEnum} */
const FIELD_VARIANT_LABEL_HIDDEN = "label-hidden";

/** @type {RecordDetailUtil.FieldVariantEnum[]} */
const FIELD_VARIANTS = [
	FIELD_VARIANT_STANDARD,
	FIELD_VARIANT_LABEL_STACKED,
	FIELD_VARIANT_LABEL_HIDDEN
];
/** @type {RecordDetailUtil.FieldVariantEnum} */
const DEFAULT_FIELD_VARIANT = FIELD_VARIANT_LABEL_STACKED;

//endregion Field Variant

//region Form Variant

/**
 * @typedef {("auto"|"edit"|"view"|"create")} RecordDetailUtil.FormVariantEnum
 * @name FormVariantEnum
 * @memberOf RecordDetailUtil
 */

/** @type {RecordDetailUtil.FormVariantEnum} */
const FORM_VARIANT_AUTO = "auto";
/** @type {RecordDetailUtil.FormVariantEnum} */
const FORM_VARIANT_EDIT = "edit";
/** @type {RecordDetailUtil.FormVariantEnum} */
const FORM_VARIANT_VIEW = "view";
/** @type {RecordDetailUtil.FormVariantEnum} */
const FORM_VARIANT_CREATE = "create";

/** @type {RecordDetailUtil.FormVariantEnum[]} */
const FORM_VARIANTS = [
	FORM_VARIANT_AUTO,
	FORM_VARIANT_EDIT,
	FORM_VARIANT_VIEW,
	FORM_VARIANT_CREATE
];
/** @type {RecordDetailUtil.FormVariantEnum} */
const DEFAULT_FORM_VARIANT = FORM_VARIANT_AUTO;


//endregion Form Variant

const SYSTEM_FIELD_NAMES = [
	"CreatedDate",
	"CreatedById",
	"CreatedBy",
	"LastModifiedDate",
	"LastModifiedById",
	"LastModifiedBy",
	"LastModifiedBy",
];

export {
	//Field variants
	FIELD_VARIANT_STANDARD,
	FIELD_VARIANT_LABEL_STACKED,
	FIELD_VARIANT_LABEL_HIDDEN,
	FIELD_VARIANTS,
	DEFAULT_FIELD_VARIANT,

	//Form variants
	FORM_VARIANT_AUTO,
	FORM_VARIANT_EDIT,
	FORM_VARIANT_VIEW,
	FORM_VARIANT_CREATE,
	FORM_VARIANTS,
	DEFAULT_FORM_VARIANT,

	//System fields
	SYSTEM_FIELD_NAMES
}