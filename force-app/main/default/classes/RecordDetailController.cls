public with sharing class RecordDetailController {

	public class RecordDetailException extends Exception {

	}

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