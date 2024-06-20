A page layout based record view/edit/create form.

# Components

## Record Detail

The `record-detail` component renders a record create, edit, or view form with inline edit capabilities.

The component draws it's layout from the assigned classic page layout (not flexipage).

### Attributes

| Name                  | Type                                                                     | Notes      | Description                                                                                                                                                                                                                                                            | Example                                                                               |
|-----------------------|--------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `defaultFieldValues`  | `Record<string, any>`                                                    |            | Default field values                                                                                                                                                                                                                                                   | ```json<br>{<br>   Name : "Bort",<br>   Type__c : "Licence Plate"<br><br>}<br><br>``` |
| `defaultFieldVariant` | `"standard"`, `"stacked"`, or `"hidden"`                                 |            | The field variant to use - e.g. should fields be inline or stacked.                                                                                                                                                                                                    |                                                                                       |
| `formVariant`         | `"auto"`, `"create"`, `"edit"`, or `"view"`                              | Important. | Should the form be in a view, edit, or create state.<br><br>Defaults to `"auto"`, which (if a `recordId` is provided) will display a `"view"` form with inline-edit capability.  Set the `formVariant` to `"view"` to disable inline edit.                             |                                                                                       |
| `isCollapsable`       | `boolean`                                                                | Important. | Should the form sections be collapsable?                                                                                                                                                                                                                               |                                                                                       |
| `recordId`            | `string`                                                                 | Important. | The ID of the record to display.  Not required when creating a new record.                                                                                                                                                                                             |                                                                                       |
| `submitMethod`        | `function(record: Record<string, any>):(Record<String, any>\|undefined)` |            | This callback allows you to either:<br>1. Update field values before saving,<br>2. Validating before saving.<br><br>The input record may be updated (and returned by the function) to change what fields are sent to the server.  A falsey return will abort the save. |                                                                                       |
| `targetObject`        | `string` or `ObjectId`                                                   | Required.  | The SObject type to display.                                                                                                                                                                                                                                           |                                                                                       |

### Events

| Name    | Detail                                                                                                                                                                                                                                                                                                                                              | Notes | Description                  |
|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------|------------------------------|
| `error` |                                                                                                                                                                                                                                                                                                                                                     |       | Fires on a form error.       |
| `load`  | An object with the following properties:<br><ul><li>`recordId` : The record ID (if an existing record).</li><li>`formVariant` : The current form variant, e.g. "view" or "edit".</li><li>`records` : Same as the `lightning-datatable` `records` `onload` detail parameter.</li><li>`record` : The loaded record (`Record<string, any>`).</li></ul> |       | Fired when the form loads.   |
| `save`  | An object with the following properties:<ul><li>`id`: The record ID.</li><li>`record` : The record (`Record<string, any>`).</li></ul>                                                                                                                                                                                                               |       | Fired after successful save. |

### Example Usage

```html
<c-record-detail target-object="Account"
                 is-collapsable
                 record-id="005AB000000ABCDEFG">
</c-record-detail>
```

## Record Detail Modal

The `record-detail` component wrapped in a `lightning-modal`. Suitable for record creation and
record editing. Has an optional "Save & New" button functionality.

### Methods

| Name            | Arguments                  | Returns            | Description                                                                                    |
|-----------------|----------------------------|--------------------|------------------------------------------------------------------------------------------------| 
| `open` (static) | `RecordDetailModalOptions` | `Promise<boolean>` | Opens the modal.  Resolves to `true` if one or more records were saved, otherise returns false |

### Example Usage

```js
import {api, LightningElement} from "lwc";
import AccountObjectId from "@salesforce/schema/Account";
import RecordDetailModal from "c/recordDetailModal";

export default class ExampleClass extends LightningElement {

	//Button click handler
	async handleButtonClick(ev) {
		try {
			await RecordDetailModal.open({
				caller: this,
				defaultFieldValues: {
					"Name" : "Example default value 1"
				},
				targetObject: AccountObjectId
			});
		} catch(ex) {
			//Handle error here
		}
	}

}
```

# Data Types

## `FieldId`

The Field ID is an object with an `objectApiName` field. This is the datatype used when an
obj
ect type is imported, i.e.:

```js
import NameFieldId from "@salesforce/schema/Account.Name";

console.log(JSON.serialize(NameFieldId, null, 2));
/*Should print:
{
	"objectApiName": "Account",
	"fieldApiName": "Name"
}
*/
```

## `ObjectId`

The Object ID is an object with an `objectApiName` field. This is the datatype used when an
obj
ect type is imported, i.e.:

```js
import AccountObjectId from "@salesforce/schema/Account";

console.log(JSON.serialize(AccountObjectId, null, 2));
/*Should print:
{
	"objectApiName": "Account"
}
*/
```

## `RecordDetailModalOptions`

This is the data type accepted by the `record-detail-modal` component.

| Property Name           | Type                     | Required | Default | Description                                                                                                                |
|-------------------------|--------------------------|----------|---------|----------------------------------------------------------------------------------------------------------------------------|
| `recordId`              | `string\|undefined`      |          |         | The record ID to be edited.  If not supplied, the modal will open in "create" mode.                                        |
| `parentRecordId`        | `string\|undefined`      |          |         | The parent record ID (e.g. if creating/editing a related record). Used to determine where to navigate after modal closure. |
| `targetObject`          | `ObjectId\|string`	     | TRUE     |         | The object API name or `ObjectId` of the record. Required for the form to load.                                            |
| `hiddenFields`          | `Array<FieldId\|string>` |          |         | An array of field API names that should NOT be rendered in the form                                                        |
| `hideSaveAndNewButton ` | `boolean`				 | 		    | `false` | Should the "Save & New" button be hidden on record creation forms?                                                         |
| `showResetButton`	      | `boolean`                | 			| `false` | Should the "Reset" form button be displayed?                                                                               |
| `objectLabel`			  | `string`				 | 			| 		  | Overrides the label of the SObject being displayed.                                                                        |
| `defaultFieldValues`	  | `Record<string, *>`		 | 			| 		  | Used to set default field values.  Expected to be an object with field API names mapped to their desired values.           |
| `caller`				  | `LightningElement`		 | TRUE		| 		  | The Lightning Element that opens the modal.  Should always be provided to support error toast messages.                    |
