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

function setAnswerTimeout (stream, text = 'OK', ms = 0) {
	setTimeout(() => {
		stream.emit('data', text + EOL);
	}, ms);
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
			describe('opts.stdin', () => {
				it('uses a given stream as `stdin` (default is `process.stdin`)', () => {});
			});

			describe('opts.stdout', () => {
				it('uses a given stream as `stdout` (default is `process.stdout`)', () => {});
			});

			describe('opts.max', () => {
				it('returns `null` if max tries exceeded', () => {
					const stdin = new Stream();
					const stdout = new Stream();
					const wrongAnswer1 = '40';
					const wrongAnswer2 = '41';
					const wrongAnswer3 = '43';
					const correctAnswer = '42';
					const limit = 3;

					setAnswerTimeout(stdin, wrongAnswer1, 10);
					setAnswerTimeout(stdin, wrongAnswer2, 20);
					setAnswerTimeout(stdin, wrongAnswer3, 30);
					setAnswerTimeout(stdin, correctAnswer, 40);
					const spy = sinon.spy();

					return askUser(question, {limit, stdin, stdout}, (answer, tryCount) => {
						spy(answer, tryCount);
						if (answer === correctAnswer) return true;
						return false;
					}).then((answer) => {
						stdin.destroy();
						stdout.destroy();

						expect(spy.callCount).to.equal(3);
						expect(answer).to.be.null;
					});
				});
			});
		});

		describe('[2] Function - Answer Validation', () => {
			it('gets called on answer', () => {
				const stdin = new Stream();
				const stdout = new Stream();

				setAnswerTimeout(stdin);
				const spy = sinon.spy();

				return askUser(question, {stdin, stdout}, (answer, count) => {
					spy(answer, count);
					return true;
				}).then(() => {
					stdin.destroy();
					stdout.destroy();
					return expect(spy).to.be.calledOnce;
				});
			});

			describe('Arguments:', () => {
				describe('[0] String - User\'s Answer', () => {
					it('gets called with the user\'s answer', () => {
						const stdin = new Stream();
						const stdout = new Stream();
						const answer = '42';

						setAnswerTimeout(stdin, answer);
						const spy = sinon.spy();

						return askUser(question, {stdin, stdout}, (answer, count) => {
							spy(answer, count);
							return true;
						}).then((answer) => {
							stdin.destroy();
							stdout.destroy();
							return expect(spy).to.be.calledWith(answer);
						});
					});
				});

				describe('[1] Number - Try Number', () => {
					it('first gets called with the value of 1', () => {
						const stdin = new Stream();
						const stdout = new Stream();
						const answer = '42';

						setAnswerTimeout(stdin, answer);
						const spy = sinon.spy();

						return askUser(question, {stdin, stdout}, (answer, count) => {
							spy(answer, count);
							return true;
						}).then((answer) => {
							stdin.destroy();
							stdout.destroy();
							return expect(spy).to.be.calledWith(answer, 1);
						});
					});

					it('increments on each try', () => {
						const stdin = new Stream();
						const stdout = new Stream();
						const wrongAnswer1 = '41';
						const wrongAnswer2 = '43';
						const correctAnswer = '42';

						setAnswerTimeout(stdin, wrongAnswer1, 10);
						setAnswerTimeout(stdin, wrongAnswer2, 20);
						setAnswerTimeout(stdin, correctAnswer, 30);
						const spy = sinon.spy();

						return askUser(question, {stdin, stdout}, (answer, tryCount) => {
							spy(answer, tryCount);
							if (answer === correctAnswer) return true;
							return false;
						}).then(() => {
							stdin.destroy();
							stdout.destroy();
							const calls = spy.getCalls();

							expect(spy.callCount).to.equal(3);
							expect(calls[0].args).to.deep.equal(['41', 1]);
							expect(calls[1].args).to.deep.equal(['43', 2]);
							expect(calls[2].args).to.deep.equal(['42', 3]);
						});
					});
				});
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
