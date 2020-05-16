const normalizeTralingSpace = require('./normalize-traling-space');

const DEFAULT_QUESTION = 'Press "ENTER" to continue... ';

module.exports = function resolveArgs (...args) {
	const typesMap = new Map();

	args.forEach((arg, i) => {
		const argType = typeof arg;
		typesMap.set(argType, args[i]);
	});

	const rawQuestion = typesMap.get('string');
	const question = rawQuestion
		? normalizeTralingSpace(rawQuestion)
		: DEFAULT_QUESTION;

	const options = typesMap.get('object') || {};
	const limit = typesMap.get('number') || options.limit || 0;
	const isRequired = typesMap.get('boolean') || options.isRequired || false;
	const answerHandler = typesMap.get('function') || options.onAnswer || (() => (true));

	return [question, options, limit, isRequired, answerHandler];
};
