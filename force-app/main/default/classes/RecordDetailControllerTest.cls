@IsTest
private class RecordDetailControllerTest {

	@IsTest
	static void isRecordEditableTest() {

		Test.startTest();

		Boolean hasError = false;
		try {
			RecordDetailController.isRecordEditable('Not an ID');
		} catch (RecordDetailController.RecordDetailException ex) {
			hasError = true;
		}
		Assert.isTrue(hasError, 'No error was thrown');

		Assert.isNotNull(RecordDetailController.isRecordEditable(UserInfo.getUserId()));

		Test.stopTest();

	}

}