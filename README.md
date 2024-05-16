A page layout based record view/edit/create form.

# Components

## Record Detail

The `record-detail` component renders a record create, edit, or view form with inline edit capabilities.

The component draws it's layout from the assigned classic page layout (not flexipage).

### Attributes
| Name                  | Type                                                                     | Notes      | Description                                                                                                                                                                                                                                                             | Example                                                                               |
|-----------------------|--------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `defaultFieldValues`  | `Record<string, any>`                                                    |            | Default field values                                                                                                                                                                                                                                                    | ```json<br>{<br>   Name : "Bort",<br>   Type__c : "Licence Plate"<br><br>}<br><br>``` |
| `defaultFieldVariant` | `"standard"`, `"stacked"`, or `"hidden"`                                 |            | The field variant to use - e.g. should fields be inline or stacked.                                                                                                                                                                                                     |                                                                                       |
| `formVariant`         | `"auto"`, `"create"`, `"edit"`, or `"view"`                              | Important. | Should the form be in a view, edit, or create state.<br><br>Defaults to `"auto"`, which (if a `recordId` is provided) will display a `"view"` form with inline-edit capability.  Set the `formVariant` to `"view"` to disable inline edit.                              |                                                                                       |
| `isCollapsable`       | `boolean`                                                                | Important. | Should the form sections be collapsable?                                                                                                                                                                                                                                |                                                                                       |
| `recordId`            | `string`                                                                 | Important. | The ID of the record to display.  Not required when creating a new record.                                                                                                                                                                                              |                                                                                       |
| `submitMethod`        | `function(record: Record<string, any>):(Record<String, any>\|undefined)` |            | This callback allows you to either:<br>1. Update field values before saving,<br>2. Validating before saving.<br><br>The input record may be updated (and returned by the function) to change what fields are sent to the server.  A falsey return will abort the save.  |                                                                                       |
| `targetObject`        | `string` or `ObjectId`                                                   | Required.  | The SObject type to display.                                                                                                                                                                                                                                            |                                                                                       |

### Events
| Name    | Detail                                                                                                                                                                                                                                                                                                                                              | Notes | Description                  |
|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------|------------------------------|
| `error` |                                                                                                                                                                                                                                                                                                                                                     |       | Fires on a form error.       |
| `load`  | An object with the following properties:<br><ul><li>`recordId` : The record ID (if an existing record).</li><li>`formVariant` : The current form variant, e.g. "view" or "edit".</li><li>`records` : Same as the `lightning-datatable` `records` `onload` detail parameter.</li><li>`record` : The loaded record (`Record<string, any>`).</li></ul> |       | Fired when the form loads.   |
| `save`  | An object with the following properties:<ul><li>`id`: The record ID.</li><li>`record` : The record (`Record<string, any>`).</li></ul>                                                                                                                                                                                                               |       | Fired after successful save. |

### Example Usage
```js
<c-record-detail target-object="Application__c"
                    is-collapsable
                    record-id="005AB000000ABCDEFG">
</c-record-detail>
```

