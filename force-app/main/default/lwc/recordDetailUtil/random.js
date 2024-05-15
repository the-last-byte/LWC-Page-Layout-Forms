//Thank you Mulan: https://stackoverflow.com/users/633183/mulan
//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
function dec2hex(dec) {
	return dec.toString(16).padStart(2, "0")
}

//Thank you Mulan: https://stackoverflow.com/users/633183/mulan
//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
// generateId :: Integer -> String
function randomString(len) {
	var arr = new Uint8Array((len || 40) / 2)
	window.crypto.getRandomValues(arr)
	return Array.from(arr, dec2hex).join('')
}

export {
	randomString
}
