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
	let count = 0;
	let isDone = false;
	let isValid = false;

	while (!isDone) {
		count++;
		answer = await asyncPrompt(question, readline);
		isValid = validate(answer, count);

		if (isValid instanceof Promise) {
			isValid = await isValid;
		}

		if (isValid) {
			isDone = true;
			if (isValid !== true) answer = isValid;
		}
		else {
			answer = null;

			const limitExceeded = limit && count >= limit;

			/* eslint-disable-next-line no-eq-null, eqeqeq */
			if (isValid == null || limitExceeded) isDone = true;
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
