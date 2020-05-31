/* eslint-disable max-lines */

const {EOL} = require('os');
const {PassThrough: Stream} = require('stream');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const realAskUser = require('../');
const resolveArgs = require('../src/resolve-args');

const OK = 'OK';
const THE_ULTIMATE_QUESTION = 'What is the answer to life, the universe and everything?';
const question = `    ${THE_ULTIMATE_QUESTION}\n    > `;
const correctAnswer = '42';
const correctAnswerInt = parseInt(correctAnswer, 10);
const wrongAnswer1 = 'God';
const wrongAnswer2 = '41';
const wrongAnswer3 = '43';

function setAnswerTimeout (stream, text = OK, ms = 0) {
	setTimeout(() => {
		stream.emit('data', text + EOL);
	}, ms);
}

describe('askUser\n  -------', () => {
	let stdin, stdout, askUser;

	beforeEach(() => {
		stdin = new Stream();
		stdout = new Stream();
		askUser = (...args) => {
			const [question, opts, limit, isRequired, answerHandler] = resolveArgs(...args);
			opts.stdin = stdin;
			opts.stdout = stdout;
			return realAskUser(question, opts, limit, isRequired || answerHandler);
		};
	});

	afterEach(() => {
		stdin.destroy();
		stdout.destroy();

		askUser = null;
		stdin = null;
		stdout = null;
	});

	describe('Arguments:', () => {
		describe('Question - String', () => {
			it('sends the question to `stdout`', async () => {
				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				await askUser(question);
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

				await askUser(question);
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

				await askUser(question);
				expect(text).to.equal(expected);
			});

			it('default question: `Press "ENTER" to continue...`', async () => {
				setAnswerTimeout(stdin);

				let text = '';
				stdout.on('data', (str) => {
					text += str;
				});

				const expected = 'Press "ENTER" to continue... ';

				await askUser();
				expect(text).to.equal(expected);
			});
		});

		describe('Options - Object', () => {
			describe('stdin', () => {
				it.skip('TODO: uses a given stream as `stdin` (default is `process.stdin`)');
			});

			describe('stdout', () => {
				it.skip('TODO: uses a given stream as `stdout` (default is `process.stdout`)');
			});

			describe('limit', () => {
				it('makes `askUser` promise resolve with `null` if max tries exceeded', async () => {
					setAnswerTimeout(stdin, wrongAnswer1, 10);
					setAnswerTimeout(stdin, wrongAnswer2, 20);
					setAnswerTimeout(stdin, wrongAnswer3, 30);
					setAnswerTimeout(stdin, correctAnswer, 40);

					const spy = sinon.spy();
					const opts = {limit: 3};

					const answer = await askUser(question, opts, (answer) => {
						spy(answer);
						return (answer === correctAnswer);
					});

					expect(spy).to.be.calledThrice;
					expect(answer).to.be.empty;
				});
			});

			describe('validate', () => {
				it('is alias for `answerHandler` function argument', async () => {
					setAnswerTimeout(stdin, wrongAnswer1, 10);
					setAnswerTimeout(stdin, correctAnswer, 20);

					const spy = sinon.spy();

					const validate = (answer) => {
						spy(answer);
						return (answer === correctAnswerInt);
					};

					const opts = {validate};
					await askUser(question, opts);

					const calls = spy.getCalls();
					expect(calls[0].args[0]).to.equal(wrongAnswer1);
					expect(calls[1].args[0]).to.equal(correctAnswerInt);
					expect(calls.length).to.equal(2);
				});
			});

			describe('convert', () => {
				it('disables auto type conversion for numbers & booleans', async () => {
					const opts = {convert: false};

					setAnswerTimeout(stdin, 'yes', 10);
					const answer1 = await askUser(question, opts);
					expect(answer1).to.equal('yes');

					setAnswerTimeout(stdin, 'Y', 10);
					const answer2 = await askUser(question, opts);
					expect(answer2).to.equal('Y');

					setAnswerTimeout(stdin, 'no', 10);
					const answer3 = await askUser(question, opts);
					expect(answer3).to.equal('no');

					setAnswerTimeout(stdin, 'N', 10);
					const answer4 = await askUser(question, opts);
					expect(answer4).to.equal('N');

					setAnswerTimeout(stdin, '42', 10);
					const answer5 = await askUser(question, opts);
					expect(answer5).to.equal('42');
				});
			});

			describe('trailingSpace', () => {
				it('disables added space to question', async () => {
					setAnswerTimeout(stdin);

					let text = '';
					stdout.on('data', (str) => {
						text += str;
					});

					const question = 'is it?';

					await askUser(question, {trailingSpace: false});
					expect(text).to.equal(question);
				});
			});

			describe('timeout', function () {
				let clock;

				beforeEach(() => {
					clock = sinon.useFakeTimers({
						toFake: ['setTimeout', 'clearTimeout', 'Date'],
						// shouldAdvanceTime: true, advanceTimeDelta: 100,
					});
				});

				afterEach(() => {
					clock.restore();
				});

				it('expires the prompt after `timeout` seconds', function (done) {
					let answer;

					// before timeout
					setTimeout(() => {
						expect(answer).to.be.undefined;
						clock.tick(100);
					}, 900);

					// after timeout
					setTimeout(() => {
						expect(answer).to.be.empty;
						done();
					}, 1500);

					const startTime = Date.now();

					askUser(question, {timeout: 1}).then((ans) => {
						// Timeout!
						answer = ans;

						const endTime = Date.now();
						const timePassed = endTime - startTime;
						clock.tick(500);
						return expect(timePassed).to.be.equal(1000);
					});

					clock.tick(900);
				});

				it('resets timeout on a wrong answer', function (done) {
					setAnswerTimeout(stdin, wrongAnswer1, 900);
					setAnswerTimeout(stdin, correctAnswer, 1800);

					let answer;

					// after wrong answer
					setTimeout(() => {
						expect(answer).to.be.undefined;
						setImmediate(() => clock.tick(700));
					}, 1100);

					// after correct answer
					setTimeout(() => {
						expect(answer).to.equal(correctAnswerInt);
						done();
					}, 1900);

					const startTime = Date.now();

					const validate = (ans, count) => {
						const now = Date.now();
						const timePassed = now - startTime;

						if (count === 1) {
							expect(timePassed).to.be.equal(900);
							setImmediate(() => clock.tick(200));
						}
						else if (count === 2) {
							expect(timePassed).to.be.equal(1800);
							setImmediate(() => clock.tick(100));
						}
						else {
							expect(true).to.be.false;
						}
						return (ans === correctAnswerInt);
					};

					askUser(question, {timeout: 1, validate}).then((ans) => {
						// Timeout!
						answer = ans;
						const now = Date.now();
						const timePassed = now - startTime;
						expect(timePassed).to.be.equal(1800);
					});

					clock.tick(900);
				});
			});

			describe('default', function () {
				it('is the default answer value', async () => {
					setAnswerTimeout(stdin, EOL, 10);

					const answer = await askUser(question, {default: OK});

					expect(answer).to.equal(OK);
				});

				it('is the default answer value in case of limit exceeded', async () => {
					setAnswerTimeout(stdin, wrongAnswer1, 10);
					setAnswerTimeout(stdin, wrongAnswer2, 20);
					setAnswerTimeout(stdin, wrongAnswer3, 30);

					const spy = sinon.spy();
					const opts = {limit: 3, default: OK};

					const answer = await askUser(question, opts, (answer) => {
						spy(answer);
						return (answer === correctAnswer);
					});

					expect(spy).to.be.calledThrice;
					expect(answer).to.equal(OK);
				});

				it('is the default answer value in case of a timeout', function (done) {
					let answer;
					const clock = sinon.useFakeTimers();

					setTimeout(() => {
						expect(answer).to.equal(OK);
						clock.restore();
						done();
					}, 1500);

					const startTime = Date.now();

					askUser(question, {timeout: 1, default: OK}).then((ans) => {
						// Timeout!
						answer = ans;

						const endTime = Date.now();
						const timePassed = endTime - startTime;
						clock.tick(500);
						return expect(timePassed).to.be.equal(1000);
					});

					clock.tick(1000);
				});
			});

			describe('throwOnTimeout', function () {
				it('throws en expection on timeout (no default value)', function () {
					const clock = sinon.useFakeTimers();
					const opts = {timeout: 1, throwOnTimeout: true};
					const errMsg = 'No Answer Timeout (1 seconds)';
					const promise = askUser(question, opts);

					clock.tick(1000);

					return promise
						.then(
							() => {
								clock.restore();
								return expect(true).to.be.false;
							},
							(err) => {
								clock.restore();
								return expect(err.message).to.equal(errMsg);
							}
						);
				});
			});

			describe('hidden', () => {
				it.skip('TODO: masks the user answer (for passwords)', () => {
					// Yes it is!
					setTimeout(() => stdin.emit('data', 'Yes'), 10);
					setTimeout(() => stdin.emit('data', ' iR'), 20); // R is a typo
					setTimeout(() => stdin.emit('data', '\b'), 30);  // \b = backspace
					setTimeout(() => stdin.emit('data', 't '), 40);
					setTimeout(() => stdin.emit('data', 'is!' + EOL), 50);

					let text = '';
					stdin.on('data', (str) => {
						text += str;
					});
					stdout.on('data', (str) => {
						text += str;
					});

					const question = 'is it?';
					const expected = 'is it? Yes it is!';

					// TODO: How to test a TTY stdout?
					// const expected = 'is it? **********';

					return askUser(question, {hidden: true}).then((answer) => {
						expect(text).to.equal(expected);
						return expect(answer).to.equal('Yes it is!');
					});
				});
			});
		});

		describe('Is Answer Required - Boolean', () => {
			it('repeats question until any answer', async () => {
				setAnswerTimeout(stdin, '', 10);
				setAnswerTimeout(stdin, '', 20);
				setAnswerTimeout(stdin, OK, 30);

				const answer = await askUser(question, true);

				expect(answer).to.equal(OK);
			});

			it('ignores answerHandler when true', async () => {
				setAnswerTimeout(stdin, '', 10);
				setAnswerTimeout(stdin, '', 20);
				setAnswerTimeout(stdin, OK, 30);

				const spy = sinon.spy();
				await askUser(question, true, spy);

				expect(spy).to.not.called;
			});
		});

		describe('Answer Handler - Function', () => {
			it('gets called on answer', async () => {
				setAnswerTimeout(stdin);
				const spy = sinon.spy();

				await askUser(question, (answer) => {
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

				await askUser(question, (answer) => {
					spy(answer);
					return (answer === correctAnswerInt);
				});

				const calls = spy.getCalls();

				expect(calls.length).to.equal(4);
				expect(calls[0].args[0]).to.equal(wrongAnswer1);
				expect(calls[1].args[0]).to.equal(parseInt(wrongAnswer2, 10));
				expect(calls[2].args[0]).to.equal(parseInt(wrongAnswer3, 10));
				expect(calls[3].args[0]).to.equal(correctAnswerInt);
			});

			it('overrides `opts.validate` alias if both exists', async () => {
				setAnswerTimeout(stdin, wrongAnswer1, 10);
				setAnswerTimeout(stdin, correctAnswer, 20);

				const spy = sinon.spy();

				const optsValidated = (answer) => {
					spy(answer);
					return (answer === correctAnswerInt);
				};

				const argValidated = (answer, count) => {
					spy(count);
					return (answer === correctAnswerInt);
				};

				const opts = {validate: optsValidated};
				await askUser(question, opts, argValidated);

				const calls = spy.getCalls();
				expect(calls[0].args[0]).to.equal(1);
				expect(calls[1].args[0]).to.equal(2);
			});

			it('handles async answerHandler (promise)', async () => {
				setAnswerTimeout(stdin, wrongAnswer1, 10);
				setAnswerTimeout(stdin, correctAnswer, 30);
				const spy = sinon.spy();

				const answer = await askUser(question, (answer, count) => (
					new Promise((resolve) => {
						setTimeout(() => {
							spy(answer);
							resolve(count >= 2); // 1=false, 2=true
						}, 10);
					})
				));

				const calls = spy.getCalls();

				expect(spy).to.be.calledTwice;
				expect(calls[0].args[0]).to.equal(wrongAnswer1);
				expect(calls[1].args[0]).to.equal(correctAnswerInt);
				expect(answer).to.equal(correctAnswerInt);
			});

			it('handles thrown error', () => {
				setAnswerTimeout(stdin, wrongAnswer1, 10);
				const errMsg = 'did you get it?';

				return askUser(question, () => {
					throw new Error(errMsg);
				}).then(() => {
					expect(true).to.be.false;
				}).catch((err) => {
					expect(err.message).to.equal(errMsg);
				});
			});

			it('handles promise rejection', () => {
				setAnswerTimeout(stdin, wrongAnswer1, 10);
				const errMsg = 'did you get it?';

				return askUser(question, () => (
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

			describe('Arguments:', () => {
				describe('[0] String - User\'s Answer', () => {
					it('is the user\'s answer', async () => {
						setAnswerTimeout(stdin, correctAnswer);
						const spy = sinon.spy();

						const answer = await askUser(question, (answer) => {
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

						await askUser(question, 3, (answer, questionCount) => {
							spy(questionCount);
							return false;
						});

						const calls = spy.getCalls();

						expect(calls.length).to.equal(3);
						expect(calls[0].args[0]).to.equal(1);
						expect(calls[1].args[0]).to.equal(2);
						expect(calls[2].args[0]).to.equal(3);
					});
				});
			});

			describe('Return value behavior', () => {
				it('when return false, retry and ask again', async () => {
					setAnswerTimeout(stdin, 'first', 10);
					setAnswerTimeout(stdin, 'second', 20);

					let keepCount;

					const answer = await askUser(question, (answer, count) => {
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
					const answer = await askUser(question, () => true);

					expect(answer).to.equal(OK);
				});

				it('when return a truthy value, that value is the final answer', async () => {
					setAnswerTimeout(stdin, OK);
					const answer = await askUser(question, answer => answer.toLowerCase());

					expect(answer).to.equal(OK.toLowerCase());
				});

				it('when return null or undefined, exit immediately with empty string', async () => {
					setAnswerTimeout(stdin);
					let keepCount;

					const answer = await askUser(question, 3, (answer, count) => {
						keepCount = count;
						return null;
					});

					expect(answer).to.be.empty;
					expect(keepCount).to.equal(1);
				});
			});
		});
	});

	describe('Type Conversion', () => {
		it('converts string-numbers into numbers', async () => {
			setAnswerTimeout(stdin, '42', 10);

			const answer = await askUser(question);

			expect(answer).to.equal(42);
		});

		it('converts yes/no into booleans', async () => {
			setAnswerTimeout(stdin, 'y', 10);
			const answer1 = await askUser(question, {convert: true});
			expect(answer1).to.equal(true);

			setAnswerTimeout(stdin, 'Y', 10);
			const answer2 = await askUser(question);
			expect(answer2).to.equal(true);

			setAnswerTimeout(stdin, 'yes', 10);
			const answer3 = await askUser(question);
			expect(answer3).to.equal(true);

			setAnswerTimeout(stdin, 'YES', 10);
			const answer4 = await askUser(question);
			expect(answer4).to.equal(true);

			setAnswerTimeout(stdin, 'n', 10);
			const answer5 = await askUser(question, {convert: true});
			expect(answer5).to.equal(false);

			setAnswerTimeout(stdin, 'N', 10);
			const answer6 = await askUser(question);
			expect(answer6).to.equal(false);

			setAnswerTimeout(stdin, 'no', 10);
			const answer7 = await askUser(question);
			expect(answer7).to.equal(false);

			setAnswerTimeout(stdin, 'NO', 10);
			const answer8 = await askUser(question);
			expect(answer8).to.equal(false);
		});
	});

	describe('Return', () => {
		it('returns a promise that resolves with the user\'s answer', async () => {
			setAnswerTimeout(stdin, correctAnswer);

			const answer = await askUser(question);

			expect(answer).to.equal(correctAnswerInt);
		});
	});
});
