/* eslint-disable */

const askUser = require('../');

async function ask (question) {
	return new Promise((resolve, reject) => {
		try {
			process.stdout.write(question + ' ')

			let answer = '';

			// process.stdin.resume();
			process.stdin.once('data', (chunk) => {
				answer += chunk.toString();
				process.stdin.pause();
				// process.stdout.resume();
				resolve(answer);
			});
		}
		catch (err) {
			reject(err);
		}
	});
}

(async () => {
	try {

		const answer = await askUser('what is your fav color?', 10, function (ans) {
			if (ans.includes('Y')) return true;
			console.log('nope');
			return false;
		});

		console.log('the answer is:', answer);

		const answer2 = await askUser('really?');
		console.log('\nanswer2 is:', answer2);


		setTimeout(() => {
			// console.log('input', input);
			// console.log('output', output);
			console.log('done');
			// process.stdin.destroy()
			// process.stdout.destroy()
		 }, 2000);
	}
	catch (err) {
		console.error('ARRRGH');
		console.error(err);
		process.exit(1)
	}
})();
