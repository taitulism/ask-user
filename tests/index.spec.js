/* eslint-disable no-empty-function, object-property-newline */

const {EOL} = require('os');
const {PassThrough: Stream} = require('stream');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const askUser = require('../');

const THE_ULTIMATE_QUESTION = 'What is the answer to life, the universe and everything?';
const question = `    ${THE_ULTIMATE_QUESTION}\n    > `;
const correctAnswer = '42';
const wrongAnswer1 = 'God';
const wrongAnswer2 = '41';
const wrongAnswer3 = '43';

function setAnswerTimeout (stream, text = 'OK', ms = 0) {
	setTimeout(() => {
		stream.emit('data', text + EOL);
	}, ms);
}

describe('askUser\n  -------', () => {
	let stdin, stdout;

	beforeEach(() => {
		stdin = new Stream();
		stdout = new Stream();
	});

	afterEach(() => {
		stdin.destroy();
		stdout.destroy();

		stdin = null;
		stdout = null;
	});

	describe('Arguments:', () => {
		describe('[0] String - Question', () => {
			it('sends the question to `stdout`', async () => {
				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				await askUser(question, {stdin, stdout});
				expect(text).to.equal(question);
			});

			it('adds a trailing space when the question doesn\'t end with a whitespace', async () => {
				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				const question = 'is it?';
				const expected = 'is it? ';

				await askUser(question, {stdin, stdout});
				expect(text).to.equal(expected);
			});

			it('doesn\'t add a trailing space when the question ends with a whitespace', async () => {
				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				const question = 'is it?\n';
				const expected = 'is it?\n';

				await askUser(question, {stdin, stdout});
				expect(text).to.equal(expected);
			});
		});

		describe('[1] Object - Options', () => {
			describe('stdin', () => {
				it('uses a given stream as `stdin` (default is `process.stdin`)', () => {});
			});

			describe('stdout', () => {
				it('uses a given stream as `stdout` (default is `process.stdout`)', () => {});
			});

			describe('limit', () => {
				it('makes `askUser` promise resolve with `null` if max tries exceeded', async () => {
					const limit = 3;

					setAnswerTimeout(stdin, wrongAnswer1, 10);
					setAnswerTimeout(stdin, wrongAnswer2, 20);
					setAnswerTimeout(stdin, wrongAnswer3, 30);
					setAnswerTimeout(stdin, correctAnswer, 40);
					const spy = sinon.spy();
					const opts = {limit, stdin, stdout};

					const answer = await askUser(question, opts, (answer) => {
						spy(answer);
						if (answer === correctAnswer) return true;
						return false;
					});

					expect(spy.callCount).to.equal(3);
					expect(answer).to.be.null;
				});
			});
		});

		describe('[2] Function - Answer Validation', () => {
			it('gets called on answer', async () => {
				setAnswerTimeout(stdin);
				const spy = sinon.spy();

				await askUser(question, {stdin, stdout}, (answer) => {
					spy(answer);
					return true;
				});

				expect(spy).to.be.calledOnce;
			});

			it('handles async validation (promise)', async () => {
				setAnswerTimeout(stdin, wrongAnswer1, 20);
				setAnswerTimeout(stdin, correctAnswer, 40);
				const spy = sinon.spy();

				let count = 0;

				const answer = await askUser(question, {stdin, stdout}, (answer) => {
					count++;

					return new Promise((resolve) => {
						setTimeout(() => {
							spy(answer);
							resolve(count >= 2); // 1=false, 2=true
						}, 10);
					});
				});

				const calls = spy.getCalls();

				expect(spy).to.be.calledTwice;
				expect(calls[0].args[0]).to.equal(wrongAnswer1);
				expect(calls[1].args[0]).to.equal(correctAnswer);
				expect(answer).to.equal(correctAnswer);
			});

			describe('Arguments:', () => {
				describe('[0] String - User\'s Answer', () => {
					it('gets called with the user\'s answer', async () => {
						setAnswerTimeout(stdin, correctAnswer);
						const spy = sinon.spy();

						const answer = await askUser(question, {stdin, stdout}, (answer) => {
							spy(answer);
							return true;
						});

						expect(spy).to.be.calledWith(answer);
					});
				});
			});
		});
	});

	describe('Return', () => {
		it('returns a promise that resolves to the user\'s answer', async () => {
			setAnswerTimeout(stdin, correctAnswer);

			const answer = await askUser(question, {stdin, stdout});

			expect(answer).to.equal(correctAnswer);
		});
	});
});
