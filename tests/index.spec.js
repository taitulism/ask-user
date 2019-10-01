/* eslint-disable object-property-newline */

const {EOL} = require('os');
const {PassThrough: Stream} = require('stream');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);

const askUser = require('../');

const THE_ULTIMATE_QUESTION = 'What is the answer to life, the universe and everything?';
const question = `    ${THE_ULTIMATE_QUESTION}\n    > `;

function simulateTyping (text) {
	const len = text.length;
	let i = 0;

	while (i <= len) {
		const char = text[i];

		if (char) {
			setTimeout(() => {
				process.stdin.emit('data', char);
			}, ++i * 1000);
		}
		else {
			setTimeout(() => {
				process.stdin.emit('data', EOL);
			}, ++i * 1000);
		}
	}
}

function setAnswerTimeout (stream, text = 'OK') {
	setTimeout(() => {
		stream.emit('data', text + EOL);
	}, 0);
}

describe('askUser\n  -------', () => {
	describe('Arguments:', () => {
		describe('[0] String - Question', () => {
			it('sends the question to `stdout`', () => {
				const stdin = new Stream();
				const stdout = new Stream();

				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				return askUser(question, {stdin, stdout}).then(() => {
					stdin.destroy();
					stdout.destroy();

					return expect(text).to.equal(question);
				});
			});

			it('adds a trailing space when the question doesn\'t end with a whitespace', () => {
				const stdin = new Stream();
				const stdout = new Stream();

				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				const question = 'is it?';
				const expected = 'is it? ';

				return askUser(question, {stdin, stdout}).then(() => {
					stdin.destroy();
					stdout.destroy();

					return expect(text).to.equal(expected);
				});
			});

			it('doesn\'t add a trailing space when the question ends with a whitespace', () => {
				const stdin = new Stream();
				const stdout = new Stream();

				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				const question = 'is it?\n';
				const expected = 'is it?\n';

				return askUser(question, {stdin, stdout}).then(() => {
					stdin.destroy();
					stdout.destroy();

					return expect(text).to.equal(expected);
				});
			});
		});

		describe('[1] Object - Options', () => {
			describe('.stdin', () => {
				it('uses a given stream as `stdin` (default is `process.stdin`)', () => {});
			});

			describe('.stdout', () => {
				it('uses a given stream as `stdout` (default is `process.stdout`)', () => {});
			});
		});
	});

	describe('Return', () => {
		it('returns a promise to the user\'s answer', () => {
			const stdin = new Stream();
			const stdout = new Stream();
			const expectedAnswer = '42';

			setAnswerTimeout(stdin, expectedAnswer);

			return askUser(question, {stdin, stdout}).then((answer) => {
				stdin.destroy();
				stdout.destroy();

				return expect(answer).to.equal(expectedAnswer);
			});
		});
	});
});
