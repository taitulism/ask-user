const normalizeTralingSpace = require('./normalize-traling-space');

const DEFAULT_QUESTION = 'Press "ENTER" to continue... ';

module.exports = function resolveArgs (...args) {
	const typesMap = new Map();

	args.forEach((arg, i) => {
		const argType = typeof arg;
		typesMap.set(argType, args[i]);
	});

	const options = typesMap.get('object') || {};
	const limit = typesMap.get('number') || options.limit || 0;
	const isRequired = typesMap.get('boolean') || options.isRequired || false;
	const validator = typesMap.get('function') || options.validate || (() => (true));
	const rawQuestion = typesMap.get('string');

	if (!rawQuestion) {
		return [DEFAULT_QUESTION, options, limit, isRequired, validator];
	}

	const shouldAddTrailingSpace = options.trailingSpace !== false;
	const question = shouldAddTrailingSpace ? normalizeTralingSpace(rawQuestion) : rawQuestion;

	return [question, options, limit, isRequired, validator];
};
