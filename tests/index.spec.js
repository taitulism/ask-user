const {EOL} = require('os');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);

const askUser = require('../');

const THE_ULTIMATE_QUESTION = 'What is the answer to life, the universe and everything?';

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
				process.stdin.emit('data', `${EOL}`);
			}, ++i * 1000);
		}
	}
}

describe('askUser\n  -------', () => {
	it('waits for user to answer',  () => {
		simulateTyping('42');

		const question = `    ${THE_ULTIMATE_QUESTION}\n    > `;
		const ask = () => askUser(question);

		return expect(ask()).to.eventually.equal('42');
	}).timeout(5000);
});
