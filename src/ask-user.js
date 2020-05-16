/* eslint-disable no-await-in-loop, max-statements */
/* eslint no-magic-numbers: ["error", { "ignore": [0,1,2,3] }] */

const {createInterface} = require('readline');
const resolveArgs = require('./resolve-args');

async function askUser (...args) {
	const [question, opts, limit, isRequired, answerHandler] = resolveArgs(...args);
	const shouldConvert = opts.convert !== false;

	const readline = createInterface({
		input: opts.stdin || process.stdin,
		output: opts.stdout || process.stdout,
	});

	let rawAnswer, answer, returnVal;
	let count = 0;
	let isDone = false;

	while (!isDone) {
		count++;
		rawAnswer = await asyncPrompt(question, readline);
		answer = shouldConvert ? resolveAnswerType(rawAnswer) : rawAnswer;

		if (isRequired && answer === '') {
			returnVal = false;
		}
		else {
			returnVal = answerHandler(answer, count);
		}

		if (returnVal instanceof Promise) {
			returnVal = await returnVal;
		}

		if (returnVal) {
			isDone = true;
			if (returnVal !== true) answer = returnVal;
		}
		else {
			answer = null;

			const limitExceeded = limit && count >= limit;

			/* eslint-disable-next-line no-eq-null, eqeqeq */
			if (returnVal == null || limitExceeded) isDone = true;
		}
	}

	readline.close();
	return answer;
}

function asyncPrompt (question, readline) {
	return new Promise((resolve) => {
		readline.question(question, answer => resolve(answer));
	});
}

function resolveAnswerType (rawAnswer) {
	const number = parseInt(rawAnswer, 10);

	if (String(number) === rawAnswer) {
		return number;
	}

	const answer = yesNoBoolean(rawAnswer);

	return answer;
}

function yesNoBoolean (str) {
	const len = str.length;

	if (len === 1) { // Y/N
		const firstChar = str[0];
		const upperFirst = firstChar.toUpperCase();
		if (upperFirst === 'Y') return true;
		if (upperFirst === 'N') return false;
	}
	else if (len === 2) { // No
		const upperStr = str.toUpperCase();
		if (upperStr === 'NO') return false;
	}
	else if (len === 3) { // Yes
		const upperStr = str.toUpperCase();
		if (upperStr === 'YES') return true;
	}

	return str;
}

module.exports = askUser;
