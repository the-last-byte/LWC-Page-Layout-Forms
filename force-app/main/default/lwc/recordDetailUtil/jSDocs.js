/**
 * @file JSDoc definitions for IDE
 */

/**
 * @namespace RecordDetailUtil
 */

/**
 * @typedef RecordDetailUtil.Field
 * @name Field
 * @memberOf RecordDetailUtil
 *
 * @property {FieldId} fieldImport
 * @property {string} [label]
 * @property {string} [placeholder]
 * @property {boolean} required
 *      Applies to edit mode only.  Is this field required?
 * @property {boolean} disabled
 *      Applies to edit mode only.  Should this field be disabled?
 * @property {boolean} readonly
 *      Applies to edit mode only.  Should this field will be rendered as an
 *      outputField instead of an inputField?
 */

/**
 * @typedef RecordDetailUtil.LayoutSection
 * @name LayoutSection
 * @memberOf RecordDetailUtil
 *
 * @property {string} [heading]
 * @property {(RecordDetailUtil.Field|null|undefined)[]} items
 *      A list of fields.  Null values will be rendered as blank
 *      spaces.
 * @property {number} columns
 * @property {boolean} [isHidden=false]
 */

/**
 * @typedef RecordDetailUtil.PublicRecordRepresentation
 * @name PublicRecordRepresentation
 * @memberOf RecordDetailUtil
 *
 * @property {function(field: FieldId): *} getFieldValue
 */