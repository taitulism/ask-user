/* eslint-disable no-await-in-loop */

const {createInterface} = require('readline');
const resolveArgs = require('./resolve-args');

async function askUser (...args) {
	const [question, opts, limit, answerHandler] = resolveArgs(...args);

	const readline = createInterface({
		input: opts.stdin || process.stdin,
		output: opts.stdout || process.stdout,
	});

	let answer, returnVal;
	let count = 0;
	let isDone = false;

	while (!isDone) {
		count++;
		answer = await asyncPrompt(question, readline);
		returnVal = answerHandler(answer, count);

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

module.exports = askUser;
