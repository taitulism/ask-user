const {createInterface} = require('readline');

function askUser (question) {
	question = question ? addTralingSpace(question) : '';

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
};

function addTralingSpace (q) {
	const lastChar = q[q.length - 1];

	if (lastChar !== ' ' && lastChar !== '\n') {
		q += ' ';
	}

	return q;
}

module.exports = askUser;
