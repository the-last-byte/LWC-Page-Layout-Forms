import {
	FORM_VARIANT_CREATE,
	FORM_VARIANT_VIEW,
	objectIdOrDefault,
	SYSTEM_FIELD_NAMES,
	trimmedStringOrDefault
} from "c/recordDetailUtil";

//List of field data types (module:lightning/uiRecordApi.RecordFieldDataType) that trigger
//an update on change (as opposed to on blur)
const DATA_TYPES_THAT_UPDATE_ON_CHANGE = [
	'Boolean',
	'ComboBox',
	'MultiPicklist',
	'Picklist',
	'Reference'
];

let fieldSetCounter = 0;

/**
 * @param {RecordDetailUtil.Private.LayoutSettings} settings
 * @return {RecordDetailUtil.Private.CollatedLayoutSection[]|undefined}
 * @throws {TypeError}
 */
const normalizeAndValidateLayoutSections = settings => {
	//Validations
	if (objectIdOrDefault(settings.sObjectImport) === undefined) {
		throw new TypeError("No ObjectID provided.");
	}

	//Clean up the settings
	settings.uniqueKey = trimmedStringOrDefault(settings.uniqueKey);

	//Uniqueness constraints
	const sectionIdUniquenessSet = new Set();
	const fieldIdUniquenessSet = new Set();
	const fieldSetIdUniquenessSet = new Set();

	/**
	 * @type {RecordDetailUtil.Private.CollatedLayoutSection[]}
	 */
	const cleanedSections = [];
	const usedFieldNames = new Set();

	//Handle standard sections
	cleanedSections.push(..._loadPageLayouts(
		settings,
		sectionIdUniquenessSet,
		fieldSetIdUniquenessSet,
		fieldIdUniquenessSet,
		usedFieldNames
	));

	return cleanedSections;
};

/**
 *
 * @param {RecordDetailUtil.Private.LayoutSettings} settings
 * @param {Set<string>} sectionIdUniquenessSet
 * @param {Set<string>} fieldSetIdUniquenessSet
 * @param {Set<string>} fieldIdUniquenessSet
 * @param {Set<string>} usedFieldNames
 * @return {RecordDetailUtil.Private.CollatedLayoutSection[]}
 * @private
 */
const _loadPageLayouts = (settings, sectionIdUniquenessSet, fieldSetIdUniquenessSet, fieldIdUniquenessSet, usedFieldNames) => {

	/** @type {module:lightning/uiRecordApi.RecordLayout} */
	const layout = extractLayoutFromRecordUi(
		settings.recordUi,
		settings.layoutMode,
		settings.objectDescribe.apiName,
		settings.recordId
	);

	return _getSectionsFromLayout(
		layout,
		settings,
		sectionIdUniquenessSet,
		fieldSetIdUniquenessSet,
		fieldIdUniquenessSet,
		usedFieldNames
	);
}

/**
 * Notes.  Blank spaces are not supported.  SF provided inconsistent data
 * which breaks layouts - especially when creating a new record.
 *
 * @param {module:lightning/uiRecordApi.RecordLayout} layout
 * @param {RecordDetailUtil.Private.LayoutSettings} settings
 * @param {Set<string>} sectionIdUniquenessSet
 * @param {Set<string>} fieldSetIdUniquenessSet
 * @param {Set<string>} fieldIdUniquenessSet
 * @param {Set<string>} usedFieldNames
 * @return {RecordDetailUtil.Private.CollatedLayoutSection[]}
 * @private
 */
const _getSectionsFromLayout = (layout, settings, sectionIdUniquenessSet, fieldSetIdUniquenessSet, fieldIdUniquenessSet, usedFieldNames) => {
	/** @type {RecordDetailUtil.Private.CollatedLayoutSection[]} */
	const outputSections = [];

	/** @type {RecordDetailUtil.Private.CollatedLayoutSection|undefined} */
	let previousSection = undefined;
	for (let sectionIndex = 0, sectionCount = layout.sections.length; sectionIndex < sectionCount; sectionIndex++) {

		/** @type {module:lightning/uiRecordApi.RecordLayoutSection} */
		const section = layout.sections[sectionIndex];

		if (section.heading === "Hidden") {
			continue;
		}

		/** @type {(RecordDetailUtil.Private.SafeField|RecordDetailUtil.Private.BlankSpace)[]} */
		const outputFields = [];

		for (let layoutRow, rowIndex = 0, rowCount = section.layoutRows.length; rowIndex < rowCount; rowIndex++) {
			layoutRow = section.layoutRows[rowIndex];
			for (let layoutItem, itemIndex = 0, itemCount = layoutRow.layoutItems.length; itemIndex < itemCount; itemIndex++) {
				/** @type {module:lightning/uiRecordApi.RecordLayoutItem} */
				layoutItem = layoutRow.layoutItems[itemIndex];
				for (let layoutComponent, componentIndex = 0, componentCount = layoutItem.layoutComponents.length; componentIndex < componentCount; componentIndex++) {
					/** @type {module:lightning/uiRecordApi.RecordLayoutComponent} */
					layoutComponent = /** @type {module:lightning/uiRecordApi.RecordLayoutComponent} */ layoutItem.layoutComponents[componentIndex];
					//@todo Support for compound fields (e.g. CreatedBy will also have CreatedDate here).
					//Presently has to be rendered as separate fields.
					if (layoutComponent.componentType === "Field") {
						const fieldId = buildFieldId(
							settings,
							layoutComponent.apiName,
							fieldIdUniquenessSet
						);
						const safeField = _buildSafeFieldFromLayoutComponent(
							fieldId,
							{
								fieldApiName: layoutComponent.apiName,
								objectApiName: layout.objectApiName
							},
							layoutItem,
							layoutComponent,
							settings
						);
						if (safeField !== undefined) {
							outputFields.push(_applyGettersToSafeField(safeField, settings));
							usedFieldNames.add(layoutComponent.apiName);
						}
					}
				}
			}
		}

		if (outputFields.length !== 0) {

			//Create the fieldset
			/** @type {RecordDetailUtil.Private.SafeLayoutFieldSet} */
			const fieldSet = {
				columns: section.columns || 2,
				items: outputFields,
				fieldSetId: buildFieldSetId(
					settings,
					fieldSetIdUniquenessSet
				)
			};

			//Is this a new section or a field set?
			//We define a section as a panel of collapsable content which
			//contains field sets, which contain fields
			//We need to create a new section if this is the first section,
			//or the current section has a heading
			if (section.useHeading || previousSection === undefined) {
				//Create a new section
				const heading = trimmedStringOrDefault(section.heading);
				const sectionId = buildSectionId(
					heading,
					sectionIndex,
					settings,
					sectionIdUniquenessSet
				);
				sectionIdUniquenessSet.add(sectionId);

				/** @type {RecordDetailUtil.Private.CollatedLayoutSection} */
				const collatedSection = _applyGettersToSafeLayoutSection({
					sectionId,
					isHidden: false,
					heading: section.useHeading === true
						? heading
						: undefined,
					fieldSets: [
						fieldSet
					],
					isControllingSection: false
				});
				outputSections.push(collatedSection);
				previousSection = collatedSection;
			} else {
				previousSection.fieldSets.push(fieldSet);
			}
		}

	}
	return outputSections;
}

const getObjectOrFirstItem = (obj, ...keys) => {
	for (let key, i = 0, j = keys.length; i < j; i++) {
		key = keys[i];
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const result = obj[key];
			if (!!result && typeof result === "object") {
				return result;
			}
		}
	}
	for (let key in obj) {
		const result = obj[key];
		if (!!result && typeof result === "object") {
			return result;
		}
	}
	throw new Error("No layout information supplied");
}

/**
 * @param {string} fieldId
 * @param {FieldId} fieldImport
 * @param {module:lightning/uiRecordApi.RecordLayoutItem} layoutItem
 * @param {module:lightning/uiRecordApi.RecordLayoutComponent} layoutComponent
 * @param {RecordDetailUtil.Private.LayoutSettings} settings
 * @return {RecordDetailUtil.Private.SafeField|undefined}
 * @private
 */
const _buildSafeFieldFromLayoutComponent = (fieldId, fieldImport, layoutItem, layoutComponent, settings) => {
	const fieldDescribe = settings.objectDescribe.fields[layoutComponent.apiName];
	if (!fieldDescribe) {
		return undefined;
	}

	/**
	 * @type {RecordDetailUtil.Private.SafeField}
	 */
	return {
		disabled: false,
		fieldImport,
		fieldId,
		updateOnBlur: DATA_TYPES_THAT_UPDATE_ON_CHANGE.includes(fieldDescribe.dataType) === false,
		label: layoutComponent.label || fieldDescribe.label,
		inlineHelpText: trimmedStringOrDefault(fieldDescribe.inlineHelpText),
		readonly: false,
		required: layoutItem.required === true,
		createable: fieldDescribe.createable === true &&
			layoutItem.editableForNew === true &&
			settings.objectDescribe.createable === true,
		updateable: fieldDescribe.updateable === true &&
			layoutItem.editableForUpdate === true &&
			settings.objectDescribe.updateable === true,
		isBlankSpace: false,
		labelId: `${fieldId}_label`,
		variant: settings.defaultVariant,
		isSystemField: SYSTEM_FIELD_NAMES.includes(fieldImport.fieldApiName) === true
	};
};

/**
 * @param {string} value
 * @param {Set<string>} existingValues
 * @return {string}
 */
const makeUnique = (value, existingValues) => {
	if (existingValues.has(value) === false) {
		existingValues.add(value);
		return value;
	}
	let counter = 1;
	let newValue = value + counter;
	while (existingValues.has(newValue)) {
		counter++;
		newValue = value + counter;
	}
	existingValues.add(newValue);
	return newValue;
};

/**
 * @param {string|undefined} heading
 * @param {number} index
 * @param {RecordDetailUtil.Private.LayoutSettings} settings
 * @param {Set<string>} uniquenessSet
 * @return {string}
 */
const buildSectionId = (heading, index, settings, uniquenessSet) => {
	return makeUnique(
		heading === undefined
			? `${settings.uniqueKey || "section"}_${index}`
			: `${settings.uniqueKey}_${heading.substring(0, 10)}`,
		uniquenessSet
	);
}

/**
 * @param {RecordDetailUtil.Private.LayoutSettings} settings
 * @param {Set<string>} uniquenessSet
 * @return {string}
 */
const buildFieldSetId = (settings, uniquenessSet) => {
	fieldSetCounter++;
	return makeUnique(
		`${(settings.uniqueKey || "fieldSet")}_${fieldSetCounter}`,
		uniquenessSet
	);
}

/**
 * @param {RecordDetailUtil.Private.LayoutSettings} settings
 * @param {string} fieldApiName
 * @param {Set<string>} uniquenessSet
 * @return {string}
 */
const buildFieldId = (settings, fieldApiName, uniquenessSet) => {
	return makeUnique(
		`${settings.uniqueKey}_${fieldApiName}`,
		uniquenessSet
	);
}

/**
 * @param {(RecordDetailUtil.Private.SafeField|RecordDetailUtil.Private.CollatedField)} field
 * @param {RecordDetailUtil.Private.LayoutSettings} settings
 * @return {RecordDetailUtil.Private.CollatedField}
 */
const _applyGettersToSafeField = (field, settings) => {
	Object.defineProperties(
		field,
		{
			collatedLabel: {
				enumerable: true,
				get: () => field.override === undefined ? field.label : field.override.label
			},
			collatedInlineHelpText: {
				enumerable: true,
				get: () => field.inlineHelpText
			},
			collatedRequired: {
				enumerable: true,
				get: () => field.override === undefined ? field.required : field.override.required
			},
			collatedDisabled: {
				enumerable: true,
				get: () => field.override === undefined ? field.disabled : field.override.disabled
			},
			collatedReadonlyOnEdit: {
				enumerable: true,
				get: () => field.isSystemField === true || field.readonly === true || field.updateable === false
			},
			collatedReadonlyOnCreate: {
				enumerable: true,
				get: () => field.isSystemField === true || field.readonly === true || field.createable === false
			},
			collatedHidden: {
				enumerable: true,
				get: () => settings.hiddenFieldNames !== undefined && settings.hiddenFieldNames.includes(field.fieldImport.fieldApiName) === true
			},
			collatedValue: {
				enumerable: true,
				get: () => settings.getFieldValueMethod(field.fieldImport.fieldApiName)
			}
		}
	);
	return field;
}

/**
 * @param {(RecordDetailUtil.Private.SafeLayoutSection|RecordDetailUtil.Private.CollatedLayoutSection)} section
 * @return {RecordDetailUtil.Private.CollatedLayoutSection}
 */
const _applyGettersToSafeLayoutSection = section => {
	Object.defineProperties(
		section,
		{
			collatedHidden: {
				enumerable: true,
				get: () => {
					if (section.isHidden === true) {
						return true;
					}
					const fieldSets = section.fieldSets;
					for (let fieldSetIndex = 0, fieldSetCount = fieldSets.length; fieldSetIndex < fieldSetCount; fieldSetIndex++) {
						const items = fieldSets[fieldSetIndex].items;
						//Make sure hidden items don't cause empty sections to appear
						for (let item, i = 0, j = items.length; i < j; i++) {
							item = items[i];
							if (item.isBlankSpace === false && item.collatedHidden === false) {
								return false;
							}
						}
					}
					return true;
				}
			}
		}
	);
	return section;
}

/**
 * Merges in missing (not blank) values
 * @param {Record<string, *>} record
 * @param {Record<string, *>} defaultValues
 * @return {Record<string, *>}
 */
const mergeDefaultValuesIntoRecord = (record, defaultValues) => {
	if (!defaultValues) {
		return {
			...record
		};
	}
	const out = {...record};
	const fields = Object.keys(defaultValues);
	for (let i = 0, j = fields.length; i < j; i++) {
		const fieldName = fields[i];
		if (Object.prototype.hasOwnProperty.call(out, fieldName) === false) {
			out[fieldName] = defaultValues[fieldName];
		}
	}
	return out;
}

/**
 * @param {module:lightning/uiRecordApi.RecordUI} recordUi
 * @param {RecordDetailUtil.FormVariantEnum} layoutMode
 * @param {string} objectApiName
 * @param {string|undefined} recordId
 * @return {module:lightning/uiRecordApi.RecordLayout}
 */
const extractLayoutFromRecordUi = (recordUi, layoutMode, objectApiName, recordId) => {
	if (!recordUi.layouts || (layoutMode === FORM_VARIANT_CREATE && !!recordUi.layout)) {
		return recordUi.layout;
	}

	//Extract the page layout
	//Get the layout
	const layoutsForObject = recordUi.layouts[objectApiName];
	const layoutsForRecord = getObjectOrFirstItem(layoutsForObject, recordId);
	const fullLayouts = getObjectOrFirstItem(layoutsForRecord, "Full");
	return layoutMode === FORM_VARIANT_VIEW
		? getObjectOrFirstItem(fullLayouts, "Edit", "View")
		: getObjectOrFirstItem(fullLayouts, "View", "Edit");
}

export {
	normalizeAndValidateLayoutSections,
	mergeDefaultValuesIntoRecord,
	extractLayoutFromRecordUi
};