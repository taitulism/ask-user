/* eslint-disable */

const askUser = require('../');

(async () => {
	try {
		const answer = await askUser('Do you?', 10, true, (ans) => {
			if (ans === true) return true;
			console.log('nope');
			return false;
		}) || 'Yes';

		console.log('the answer is:', answer);

		setTimeout(() => {}, 2000);
	}
	catch (err) {
		console.error('ARRRGH');
		console.error(err);
		process.exit(1)
	}
})();
