/* eslint-disable no-await-in-loop */

const {createInterface} = require('readline');
const resolveArgs = require('./resolve-args');

async function askUser (...args) {
	const [question, opts, limit, validate] = resolveArgs(...args);

	const readline = createInterface({
		input: opts.stdin || process.stdin,
		output: opts.stdout || process.stdout,
	});

	let answer;
	let triesCounter = 0;
	let ended = false;
	let isValid = false;

	do {
		answer = await asyncPrompt(question, readline);
		isValid = validate(answer, ++triesCounter);

		if (isValid) {
			ended = true;

			if (isValid !== true) answer = isValid;
		}
		else if (limit && limit <= triesCounter) {
			answer = null;
			ended = true;
		}
	} while (!ended);

	readline.close();
	return answer;
}

function asyncPrompt (question, readline) {
	return new Promise((resolve) => {
		readline.question(question, answer => resolve(answer));
	});
}

module.exports = askUser;
