/**
 * @description Handles server side operations for the `recordDetail` LWC.
 */
public with sharing class RecordDetailController {

	@SuppressWarnings('PMD.ApexDoc')
	public class RecordDetailException extends Exception {

	}

	/**
	 * @description Checks whether a record is editable by the
	 * current user.
	 *
	 * Throws if an invalid ID is provided.
	 *
	 * @param recordId The record ID to check.
	 *
	 * @return True or false
	 */
	@AuraEnabled(Cacheable=true)
	public static Boolean isRecordEditable(String recordId) {
		if (recordId == null || !(recordId instanceof Id)) {
			throw new RecordDetailException('Invalid ID provided: ' + recordId);
		}
		final UserRecordAccess recordAccess = [
			SELECT RecordId, HasEditAccess
			FROM UserRecordAccess
			WHERE RecordId = :recordId
			AND UserId = :UserInfo.getUserId()
			WITH USER_MODE
		];
		return recordAccess.HasEditAccess;
	}

}