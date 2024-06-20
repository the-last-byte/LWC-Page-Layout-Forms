/**
 * @namespace RecordDetailUtil.Private
 */

/**
 * @typedef {RecordDetailUtil.Field} RecordDetailUtil.Private.SafeField
 * @name SafeField
 * @memberOf RecordDetailUtil.Private
 * @extends RecordDetailUtil.Field
 *
 * @property {boolean} disabled
 * @property {string} fieldId
 * @property {string} labelId
 * @property {boolean} updateOnBlur
 * @property {RecordDetailUtil.FieldVariantEnum} variant
 * @property {string} [inlineHelpText]
 * @property {boolean} isBlankSpace
 * @property {boolean} createable
 * @property {boolean} updateable
 * @property {boolean} isSystemField
 */

/**
 * @typedef {RecordDetailUtil.Private.SafeField} RecordDetailUtil.Private.CollatedField
 * @name CollatedField
 * @memberOf RecordDetailUtil.Private
 * @extends RecordDetailUtil.Private.SafeField
 * *
 * @property {Readonly<string>} collatedLabel
 * @property {Readonly<string|undefined>} collatedInlineHelpText
 * @property {Readonly<boolean>} collatedRequired
 * @property {Readonly<boolean>} collatedDisabled
 * @property {Readonly<boolean>} collatedReadonlyOnEdit
 * @property {Readonly<boolean>} collatedReadonlyOnCreate
 * @property {Readonly<boolean>} collatedHidden
 * @property {Readonly<*>} collatedValue
 */

/**
 * @typedef RecordDetailUtil.Private.BlankSpace
 * @name BlankSpace
 * @memberOf RecordDetailUtil.Private
 *
 * @property {string} fieldId
 * @property {boolean} isBlankSpace
 */

/**
 * @typedef RecordDetailUtil.Private.SafeLayoutFieldSet
 * @name SafeLayoutFieldSet
 * @memberOf RecordDetailUtil.Private
 *
 * @property {string} fieldSetId
 * @property {(RecordDetailUtil.Private.CollatedField|RecordDetailUtil.Private.BlankSpace)[]} items
 *      A list of fields.
 * @property {number} columns
 */

/**
 * @typedef RecordDetailUtil.Private.SafeLayoutSection
 * @name SafeLayoutSection
 * @memberOf RecordDetailUtil.Private
 *
 * @property {string} sectionId
 * @property {string} heading
 *
 * @property {RecordDetailUtil.Private.SafeLayoutFieldSet[]} fieldSets
 * @property {boolean} isHidden
 * @property {boolean} isControllingSection
 */

/**
 * @typedef {RecordDetailUtil.Private.SafeLayoutSection} RecordDetailUtil.Private.CollatedLayoutSection
 * @name CollatedLayoutSection
 * @memberOf RecordDetailUtil.Private
 *
 * @property {Readonly<boolean>} collatedHidden
 */

/**
 * @typedef RecordDetailUtil.Private.LayoutSettings
 * @name LayoutSettings
 * @memberOf RecordDetailUtil.Private
 *
 * @property {string} [uniqueKey]
 * @property {string} recordId
 * @property {ObjectId} sObjectImport
 * @property {RecordDetailUtil.FieldVariantEnum} defaultVariant
 * @property {module:lightning/uiRecordApi.ObjectInfoRepresentation} objectDescribe
 * @property {module:lightning/uiRecordApi.RecordUI} [recordUi]
 * @property {RecordDetailUtil.FormVariantEnum} layoutMode
 * @property {function(fieldName: string):*} getFieldValueMethod
 * @property {string[]} controllingFieldNames
 * @property {Array<string>} [hiddenFieldNames]
 */

/**
 * @typedef RecordDetailUtil.Private.ButtonStateData
 * @memberOf RecordDetailUtil.Private
 * @name ButtonStateData
 *
 * @property {boolean} isLoading
 * @property {boolean} showResetButton
 * @property {boolean} showSaveAndNewButton
 *
 * @property {function} handleCancelClick
 * @property {function} handleSaveAndNewClick
 * @property {function} handleSaveClick
 */