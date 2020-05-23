/* eslint-disable
	no-await-in-loop,
	max-lines-per-function,
	max-statements,
*/

const {createInterface} = require('readline');
const resolveArgs = require('./resolve-args');
const MASK = '*';
const MINUS_ONE_CHAR = -1;
const FIRST_CHAR = 0;
const ONE_CHAR = 1;
const TWO_CHARS = 2;
const THREE_CHARS = 3;
const YES = 'YES';
const NO = 'NO';

async function askUser (...args) {
	const [question, opts, limit, isRequired, answerHandler] = resolveArgs(...args);
	const shouldConvert = opts.convert !== false;

	const readline = createInterface({
		input: opts.stdin || process.stdin,
		output: opts.stdout || process.stdout,
	});

	let prevLen = 0;
	let first = true;

	if (opts.hidden && readline.output.isTTY) {
		// eslint-disable-next-line no-underscore-dangle
		readline._writeToOutput = function _writeToOutput (str) {
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

	let rawAnswer, answer, returnVal;
	let count = 0;
	let isDone = false;

	while (!isDone) {
		count++;
		rawAnswer = await asyncPrompt(question, readline);
		answer = shouldConvert ? resolveAnswerType(rawAnswer) : rawAnswer;

		if (isRequired && answer === '') {
			returnVal = false;
		}
		else {
			returnVal = answerHandler(answer, count);
		}

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

function resolveAnswerType (rawAnswer) {
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

module.exports = askUser;
