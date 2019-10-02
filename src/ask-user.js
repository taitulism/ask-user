/* eslint-disable no-await-in-loop */

const {createInterface} = require('readline');
const normalizeTralingSpace = require('./normalize-traling-space');
const DEFAULT_QUESTION = 'Press "ENTER" to continue... ';

async function askUser (question, opts = {}, validate) {
	question = normalizeTralingSpace(question);

	validate = validate || opts.validate || (() => (true));

	const readline = createInterface({
		input: opts.stdin || process.stdin,
		output: opts.stdout || process.stdout,
	});

	let answer;
	let triesCounter = 0;
	let hasEnded = false;
	let isValid = false;

	do {
		answer = await asyncPrompt(question, readline);
		isValid = validate(answer, ++triesCounter);

		if (isValid) {
			hasEnded = true;

			if (isValid !== true) {
				answer = isValid;
			}
		}
	} while (hasEnded === false);

	readline.close();
	return answer;
}

function asyncPrompt (question, readline) {
	return new Promise((resolve) => {
		readline.question(question, (answer) => {
			return resolve(answer);
		});
	});
}

module.exports = askUser;
