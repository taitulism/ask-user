/* eslint-disable */

const askUser = require('..');

/*
	This a manual test for the "hidden" option that I havn't figured out how to test yet.
	Type a password, test using "backspace" and "delete" to fix the answer and continue typing.
 */
(async () => {
	try {
		const answer = await askUser('Type Password?', {hidden: true});

		console.log('The answer is:', answer);

		// setTimeout(() => {}, 2000);
	}
	catch (err) {
		console.error('ARRRGH');
		console.error(err);
		process.exit(1)
	}
})();
