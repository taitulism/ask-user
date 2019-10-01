const {createInterface} = require('readline');
const normalizeTralingSpace = require('./normalize-traling-space');
const DEFAULT_QUESTION = 'Press "ENTER" to continue... ';

function askUser (question, opts = {}) {
	question = normalizeTralingSpace(question);

	const readline = createInterface({
		input: opts.stdin || process.stdin,
		output: opts.stdout || process.stdout,
	});

	return new Promise((resolve) => {
		readline.question(question, (answer) => {
			readline.close();
			return resolve(answer);
		});
	});
}

module.exports = askUser;
