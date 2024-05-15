import {arrayOrDefault} from "./validation";

/**
 * @type {HTMLTextAreaElement|undefined}
 */
let cachedEscapeHtmlElement
const escapeHtml = html => {
	if (cachedEscapeHtmlElement === undefined) {
		cachedEscapeHtmlElement = document.createElement('textarea');
	}
	cachedEscapeHtmlElement.textContent = html;
	return cachedEscapeHtmlElement.innerHTML;
}


/**
 * Formats a template string with given the values.  The template string should
 * be in the following format:
 * "This {0} is an {1} example of a template string.  The {2} values in brackets will
 * be replaced with the {3} provided arguments".
 *
 * @param {string} template
 * @param {...string} templateValues
 * @returns {string}
 */
const formatTemplateString = (template, ...templateValues) => {

	const expression = /[.\r\n]*?({\s*?\d\s*?})[.\r\n]*?/gm;
	const cleanMatchExp = /[^0-9]/gm;

	const parts = [];
	let lastIndex = 0;

	const values = arrayOrDefault(templateValues);
	const valueCount = values === undefined
		? 0
		: values.length;

	for (const match of template.matchAll(expression)) {
		if (match.index !== lastIndex) {
			parts.push(template.substring(lastIndex, match.index));
		}
		const replacementIndex = parseInt(match[0].replaceAll(cleanMatchExp, ""));
		if (replacementIndex > valueCount) {
			console.error(new Error("Index out of bounds in formatTemplateString"));
			console.log(template);
			parts.push(`{${replacementIndex}}`);
		} else {
			parts.push(templateValues[replacementIndex]);
		}
		lastIndex = match.index + match.length + 1;
	}
	if (lastIndex < template.length) {
		parts.push(template.substring(lastIndex));
	}
	return parts.join("");
};

/**
 * @description Joins a given list of strings, comma delimited,
 * oxford style.  For example, "dog, goat, snake, and bird".
 *
 * @param {string[]} segments
 *  The strings to join.
 * @param {string} [coordinatingConjunctionToUse=and]
 *  The string value to use between the penultimate and ultimate
 *  segments.  For example, in "1, 2, and 3", the coordinating
 *  conjunction will be "and".
 * @returns {string}
 */
const oxfordJoin = (segments, coordinatingConjunctionToUse) => {
	if (!segments) {
		return "";
	}
	const count = segments.length;
	if (!count) {
		return "";
	}

	const conjunction = " " + (
		typeof coordinatingConjunctionToUse === "string"
			? coordinatingConjunctionToUse.trim() || "and"
			: "and"
	) + " ";

	//Handle special cases
	if (count === 1) {
		return segments[0];
	} else if (count === 2) {
		return segments[0] + conjunction + segments[1];
	}

	//We don't want to modify the actual list here
	const temp = [...segments];

	//For lists larger than 2 elements:
	//Remove and store the last element of the list
	const lastItem = temp.pop();

	//Join the remaining elements of the string concatenated with a comma,
	//followed by an "and" or "&", and finally followed by the last element
	//in the list
	return temp.join(', ') + "," + conjunction + lastItem;
};

/**
 * @type {DOMParser|undefined}
 */
let cachedDomParser;

/**
 * Strips HTML from a string using the browser's native parser.
 *
 * @param value
 * @return {string}
 */
const stripHtml = value => {
	if (cachedDomParser === undefined) {
		cachedDomParser = new DOMParser();
	}
	return cachedDomParser.parseFromString(value, "text/html").body.textContent || "";
}

export {
	escapeHtml,
	formatTemplateString,
	oxfordJoin,
	stripHtml
};