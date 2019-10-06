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

	while (!ended) {
		answer = await asyncPrompt(question, readline);
		isValid = validate(answer, ++triesCounter);

		if (isValid instanceof Promise) {
			isValid = await isValid;
		}

		if (isValid) {
			if (isValid !== true) answer = isValid;
			ended = true;
		}
		else if (limit && limit <= triesCounter) {
			answer = null;
			ended = true;
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

module.exports = askUser;
