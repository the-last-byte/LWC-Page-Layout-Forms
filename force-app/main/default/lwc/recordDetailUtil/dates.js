/**
 * This converts a JS Date instance into an ISO8601 date
 * (not time) string in the local timezone.
 *
 * @param {Date} [date]
 * @returns {null|string} ISO8601 date string
 */
const dateToLocalIsoString = date => !date ? null : `${
	//Get a four-digit year
	date.getFullYear()
}-${
	//Get a two-digit month.  Note that months returned
	//by get month are zero delimited.
	("" + (date.getMonth() + 1)).padStart(2, "0")
}-${
	//Get a two digit day of the month
	("" + date.getDate()).padStart(2, "0")
}`;

export {
	dateToLocalIsoString
}