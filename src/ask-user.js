const {createInterface} = require('readline');
const normalizeTralingSpace = require('./normalize-traling-space');
const DEFAULT_QUESTION = 'Press "ENTER" to continue... ';

function askUser (question = DEFAULT_QUESTION) {
	question = normalizeTralingSpace(question);

	const readline = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		readline.question(question, (answer) => {
			readline.close();
			return resolve(answer);
		});
	});
}

module.exports = askUser;
