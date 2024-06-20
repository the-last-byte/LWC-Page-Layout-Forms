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

/**
 * @namespace RecordDetailUtil.RecordDetailModal
 */

/**
 * @typedef RecordDetailUtil.RecordDetailModal.RecordDetailModalOptions
 * @memberOf RecordDetailUtil.RecordDetailModal
 * @name RecordDetailModalOptions
 *
 * @property {string|undefined} [recordId]
 * 	The record ID.  If provided, this will be an "Edit" modal, otherwise
 * 	this will be a "Create" modal.
 *
 * @property {string|undefined} [parentRecordId]
 * 	The parent record ID.  Used for navigation after record creation.
 *
 * @property {ObjectId} targetObject
 * @property {Array<FieldId|string>} [hiddenFields]
 * @property {boolean=false} [hideSaveAndNewButton]
 * @property {boolean=false} [showResetButton]
 * @property {string} [objectLabel]
 * 	Provides the ability to override the object label in the modal.  Useful
 * 	when a single object shares distinct record types. 	If not provided,
 * 	the actual object label will be used.
 * @property {Record<string, *>} [defaultFieldValues]
 * @property {LightningElement} [caller]
 * 	Optional, but required for error toast messages to display.
 */