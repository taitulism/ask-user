/* eslint-disable
	no-empty-function,
	object-property-newline,
	max-lines
*/

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

const OK = 'OK';
const THE_ULTIMATE_QUESTION = 'What is the answer to life, the universe and everything?';
const question = `    ${THE_ULTIMATE_QUESTION}\n    > `;
const correctAnswer = '42';
const wrongAnswer1 = 'God';
const wrongAnswer2 = '41';
const wrongAnswer3 = '43';

function setAnswerTimeout (stream, text = OK, ms = 0) {
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

			it('default question: `Press "ENTER" to continue...`', async () => {
				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				const expected = 'Press "ENTER" to continue... ';

				await askUser({stdin, stdout});
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
						return (answer === correctAnswer);
					});

					expect(spy.callCount).to.equal(3);
					expect(answer).to.be.null;
				});
			});

			describe('onAnswer', () => {
				it('is alias for `answerHandler` function argument', async () => {
					setAnswerTimeout(stdin, wrongAnswer1, 10);
					setAnswerTimeout(stdin, correctAnswer, 20);

					const spy = sinon.spy();

					const onAnswer = (answer) => {
						spy(answer);
						return (answer === correctAnswer);
					};

					const opts = {stdin, stdout, onAnswer};
					await askUser(question, opts);

					const spyCalls = spy.getCalls();
					expect(spyCalls[0].args[0]).to.equal(wrongAnswer1);
					expect(spyCalls[1].args[0]).to.equal(correctAnswer);
					expect(spyCalls.length).to.equal(2);
				});
			});
		});

		describe('[2] Function - Answer Handler', () => {
			describe('Arguments:', () => {
				describe('[0] String - User\'s Answer', () => {
					it('is the user\'s answer', async () => {
						setAnswerTimeout(stdin, correctAnswer);
						const spy = sinon.spy();

						const answer = await askUser(question, {stdin, stdout}, (answer) => {
							spy(answer);
							return true;
						});

						expect(spy).to.be.calledWith(answer);
					});
				});

				describe('[1] Number - Question Count', () => {
					it('is the try number', async () => {
						setAnswerTimeout(stdin, wrongAnswer1, 10);
						setAnswerTimeout(stdin, wrongAnswer2, 20);
						setAnswerTimeout(stdin, correctAnswer, 30);
						const spy = sinon.spy();

						await askUser(question, {stdin, stdout}, 3, (answer, questionCount) => {
							spy(questionCount);
							return false;
						});

						const spyCalls = spy.getCalls();

						expect(spyCalls.length).to.equal(3);
						expect(spyCalls[0].args[0]).to.equal(1);
						expect(spyCalls[1].args[0]).to.equal(2);
						expect(spyCalls[2].args[0]).to.equal(3);
					});
				});
			});

			describe('Return value behavior', () => {
				it('when return false, retry and ask again', async () => {
					setAnswerTimeout(stdin, 'first', 10);
					setAnswerTimeout(stdin, 'second', 20);

					let keepCount;

					const answer = await askUser(question, {stdin, stdout}, (answer, count) => {
						keepCount = count;
						if (count === 1) {
							return false;
						}
						return true;
					});

					expect(keepCount).to.equal(2);
					expect(answer).to.equal('second');
				});

				it('when return true, current answer is the final answer', async () => {
					setAnswerTimeout(stdin);
					const answer = await askUser(question, {stdin, stdout}, () => true);

					expect(answer).to.equal(OK);
				});

				it('when return a truthy value, that value is the final answer', async () => {
					setAnswerTimeout(stdin, OK);
					const answer = await askUser(question, {stdin, stdout}, answer => answer.toLowerCase());

					expect(answer).to.equal(OK.toLowerCase());
				});

				it('when return null or undefined, exit with `null` even if tries left', async () => {
					setAnswerTimeout(stdin);
					let keepCount;

					const answer = await askUser(question, {stdin, stdout}, 3, (answer, count) => {
						keepCount = count;
						return null;
					});

					expect(answer).to.equal(null);
					expect(keepCount).to.equal(1);
				});
			});

			it('gets called on answer', async () => {
				setAnswerTimeout(stdin);
				const spy = sinon.spy();

				await askUser(question, {stdin, stdout}, (answer) => {
					spy(answer);
					return true;
				});

				expect(spy).to.be.calledOnce;
			});

			it('gets called on each and every answer', async () => {
				setAnswerTimeout(stdin, wrongAnswer1, 10);
				setAnswerTimeout(stdin, wrongAnswer2, 20);
				setAnswerTimeout(stdin, wrongAnswer3, 30);
				setAnswerTimeout(stdin, correctAnswer, 40);

				const spy = sinon.spy();

				await askUser(question, {stdin, stdout}, (answer) => {
					spy(answer);
					return (answer === correctAnswer);
				});

				const spyCalls = spy.getCalls();

				expect(spyCalls.length).to.equal(4);
				expect(spyCalls[0].args[0]).to.equal(wrongAnswer1);
				expect(spyCalls[1].args[0]).to.equal(wrongAnswer2);
				expect(spyCalls[2].args[0]).to.equal(wrongAnswer3);
				expect(spyCalls[3].args[0]).to.equal(correctAnswer);
			});

			it('overrides `opts.onAnswer` alias if both exists', async () => {
				setAnswerTimeout(stdin, wrongAnswer1, 10);
				setAnswerTimeout(stdin, correctAnswer, 20);

				const spy = sinon.spy();

				const optsOnAnswer = (answer) => {
					spy(answer);
					return (answer === correctAnswer);
				};

				const argOnAnswer = (answer, count) => {
					spy(count);
					return (answer === correctAnswer);
				};

				const opts = {stdin, stdout, optsOnAnswer};
				await askUser(question, opts, argOnAnswer);

				const spyCalls = spy.getCalls();
				expect(spyCalls[0].args[0]).to.equal(1);
				expect(spyCalls[1].args[0]).to.equal(2);
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

			it('can handle validation thrown error', () => {
				setAnswerTimeout(stdin, wrongAnswer1, 20);
				const errMsg = 'did you get it?';

				return askUser(question, {stdin, stdout}, () => {
					throw new Error(errMsg);
				}).then(() => {
					expect(true).to.be.false;
				}).catch((err) => {
					expect(err.message).to.equal(errMsg);
				});
			});

			it('can handle validation promise rejection', () => {
				setAnswerTimeout(stdin, wrongAnswer1, 10);
				const errMsg = 'did you get it?';

				return askUser(question, {stdin, stdout}, () => (
					new Promise((resolve, reject) => {
						setTimeout(() => {
							reject(new Error(errMsg));
						}, 20);
					})
				)).then(() => {
					expect(true).to.be.false;
				}).catch((err) => {
					expect(err.message).to.equal(errMsg);
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
