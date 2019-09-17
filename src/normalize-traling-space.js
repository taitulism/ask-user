module.exports = function normalizeTralingSpace (question) {
	const lastChar = question[question.length - 1];

	if (lastChar !== ' ' && lastChar !== '\n') {
		question += ' ';
	}

	return question;
};
