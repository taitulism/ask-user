/* eslint-disable */

const askUser = require('../');

function asyncFn (ans) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(ans === 'asd')
		}, 4000);
	});
}

(async () => {
	const answer = await askUser('Type Password?', {timeout: 4, onAnswer: (ans) => {
		console.log('checking...');
		return asyncFn(ans);
	}});

	console.log(`ANSWER: ${answer}`);
})();


