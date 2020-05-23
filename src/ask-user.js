/* eslint-disable
	no-await-in-loop,
	max-lines-per-function,
	max-statements,
	require-atomic-updates,
*/

const {createInterface} = require('readline');
const resolveArgs = require('./resolve-args');

const SECOND = 1000;
const MASK = '*';
const MINUS_ONE_CHAR = -1;
const FIRST_CHAR = 0;
const ONE_CHAR = 1;
const TWO_CHARS = 2;
const THREE_CHARS = 3;
const YES = 'YES';
const NO = 'NO';

function askUser (...args) {
	const [question, opts, limit, isRequired, answerHandler] = resolveArgs(...args);
	const readline = getReadlineInterface(opts);
	const shouldConvert = opts.convert !== false;

	if (opts.hidden && readline.output.isTTY) {
		// eslint-disable-next-line no-underscore-dangle
		readline._writeToOutput = getOutputWriter(readline, question);
	}

	let finalResolve, finalReject;
	let input, answer, handlerResult;
	let timeoutPromise, timeoutRef, abortTimeout;
	let count = 0;
	let isDone = false;

	const setTimer = () => {
		abortTimeout && abortTimeout();

		abortTimeout = () => {
			clearTimeout(timeoutRef);
		};

		timeoutPromise = new Promise((resolveTimeout) => {
			timeoutRef = setTimeout(() => {
				if (isDone) return;
				isDone = true;
				readline.close();
				return resolveTimeout(null);
			}, opts.timeout * SECOND);
		});
	};

	const finish = (finalAnswer) => {
		abortTimeout && abortTimeout();
		readline.close();
		return finalResolve(finalAnswer);
	};

	const ask = () => {
		opts.timeout && setTimer();
		return asyncPrompt(question, readline).then(async (rawInput) => {
			if (isDone) return;
			count++;

			input = shouldConvert ? parseInput(rawInput) : rawInput;

			try {
				handlerResult = (isRequired && input === '') ? false : await answerHandler(input, count);
			}
			catch (err) {
				return finalReject(err);
			}

			if (isDone) return;

			if (handlerResult) {
				isDone = true;
				answer = handlerResult === true ? input : handlerResult;
				return finish(answer);
			}

			answer = null;
			const limitExceeded = limit && count >= limit;

			/* eslint-disable-next-line no-eq-null, eqeqeq */
			if (handlerResult == null || limitExceeded) {
				isDone = true;
				return finish(null);
			}

			return ask();
		});
	};

	const finalAnswerPromise = new Promise((resolve, reject) => {
		finalResolve = resolve;
		finalReject = reject;

		return ask();
	});

	if (timeoutPromise) {
		return Promise.race([timeoutPromise, finalAnswerPromise]);
	}

	return finalAnswerPromise;
}




function getReadlineInterface (opts) {
	return createInterface({
		input: opts.stdin || process.stdin,
		output: opts.stdout || process.stdout,
	});
}

function asyncPrompt (question, readline) {
	return new Promise((resolve) => {
		readline.question(question, answer => resolve(answer));
	});
}

function parseInput (rawAnswer) {
	const number = parseInt(rawAnswer, 10);

	if (String(number) === rawAnswer) {
		return number;
	}

	const answer = yesNoBoolean(rawAnswer);

	return answer;
}

function yesNoBoolean (str) {
	const len = str.length;
	const upperStr = str.toUpperCase();

	// Y/N
	if (len === ONE_CHAR) {
		const firstChar = upperStr[FIRST_CHAR];
		if (firstChar === 'Y') return true;
		if (firstChar === 'N') return false;
	}
	// No
	else if (len === TWO_CHARS) {
		if (upperStr === NO) return false;
	}
	// Yes
	else if (len === THREE_CHARS) {
		if (upperStr === YES) return true;
	}

	return str;
}

const newlineChars = ['\n', '\r\n', '\r'];
function isNewline (char) {
	return newlineChars.includes(char);
}

function getOutputWriter (readline, question) {
	let prevLen = 0;
	let first = true;

	return function _writeToOutput (str) {
		const currentAnswer = readline.line;
		const lineLen = currentAnswer.length;

		if (first || isNewline(str)) {
			first = false;
			return readline.output.write(str);
		}

		if (str.startsWith(question)) {
			// User pressed "Backspace" or "Delete"
			const text = question + MASK.repeat(lineLen);
			readline.output.write(text);
		}
		else {
			const diff = lineLen - prevLen;

			if (diff === 1) {
				readline.output.write(MASK);
			}
			else if (diff === MINUS_ONE_CHAR) {
				readline.output.moveCursor(MINUS_ONE_CHAR);
				readline.output.clearLine(1);
			}
		}
		prevLen = lineLen;
	};
}

module.exports = askUser;
