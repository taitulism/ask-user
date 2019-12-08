[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/taitulism/ask-user.svg?branch=master)](https://travis-ci.org/taitulism/ask-user)

**Ask-User**
============
A simple CLI prompt to get user input.


# Install
```sh
$ npm install ask-user
```

# Basic Usage
### **Promise style**
```js
const askUser = require('ask-user');

askUser('Are you sure?').then((answer) => {
    // do something with `answer`...
});
```

### **Async/Await**
```js
const askUser = require('ask-user');

(async () => {
    const answer = await askUser('Are you sure?');
    
    // do something with `answer`...
})();
```

> When called with no question it defaults to: `'Press "ENTER" to continue... '`

# Answer Handler

By default, a question is only asked once, unless you pass in an answer-handler. 

```js
const answer = await askUser('Are we there yet?', answerHandler)
```
>**This handler is NOT the final callback.**

This function will get called when the user answers the question. Meaning, the user hits "Enter".

### **Arguments**
* `answer` \<String> - the user's answer
* `count` \<Number> - the try number. Starts with 1.
```js
const question = 'Are we there yet?';

const finalAnswer = await askUser(question, (answer, count) => {
    // ...
})
```

### **Handler Return Value**
The handler's main purpose is for validating the user input.
An invalid input will re-prompt the user with the same question until validation (or `Ctrl+c`). 

You can also use it to manipulate (trim, escape, sanitize etc.) an answer before returning it.  
If you return `false`, the user will be prompted again with the same question.  
If you return `true`, current answer will be returned as the final answer.  

```js
// The question will be repetitively re-asked until the user types "yes"
const onAnswer = (answer) => (answer === 'yes')

const finalAnswer = askUser(question, onAnswer)
```

If you return a truthy value other than a boolean `true`, it will be the final answer.
This way your answer-handler could also function as your answer parser/sanitizer/manipulator:
```js
const question = 'How old are you?';
const onAnswer = (answer) => {
    const age = parseInt(answer, 10)
    if (age < 21) {
        return false;
    }
    else {
        return true // --> final answer will be a String
        // or:
        return age; // --> final answer will be a Number
    } 
}

const finalAnswer = await askUser(question, onAnswer)
```
Another use of a truthy return value could be a default value:
```js
const question = 'Which branch to pull from?';
const onAnswer = (branch) => {
    if (!branch) return 'master'; // return default when answer is empty

    return branch.trim(); // return clean branch name
}

const finalAnswer = await askUser(question, onAnswer)
```
But you don't need a handler for a simple default:
```js
const finalAnswer = await askUser(question) || 'master';
```

If you return `null` or `undefined`, prompt will exit immediately and final answer will be `null`. Could be used as a kind of a cancel/exit


### **Async Validation**
Async handler is also supported. Just make sure to return a promise.
```js
const asynchandler = (answer) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (condition) resolve(true)
            else resolve(false)
        }, 150)
    })
}
const answer = await askUser(question, asynchandler)
```

### **Exceptions and Rejections**
Throwing exceptions (or rejecting the promise) from within the answer-handler will bubble up for you to catch:
```js

try {
    const answer = await askUser(question, () => {
        const err = new Error("I'm too old for this")

        throw err;
        // or
        return new Promise((resolve, reject) => {
            reject(err)
        })
    });
}
catch (err) {
    // caught here
}
```


### **Limit**
You can set a maximum number of tries (answer validation fails). The final answer will be set to `null` when limit exceeded.
```js
const question = 'You have 3 tries to guess my favorite color:';
const onAnswer = (guessColor) => (guessColor === 'blue')
const limit = 3
const answer = await askUser(question, onAnswer, limit)

if (answer == null) {
    // failed 3 times
}
```


# Options

### **onAnswer**
You can use the answer-handler via the `options` object:
```js
const answer = await askUser(question, {
    onAnswer: (guessColor) => (guessColor === 'blue')
})
```
> If you pass in both `onAnswer` argument and `onAnswer` option, the argument will take precedence.

### **limit**
You can utilize the `limit` functionality with the `options` object too:
```js
const answer = await askUser(question, {
    limit: 3,
    onAnswer: (guessColor) => (guessColor === 'blue')
});
```
> Limiting the number of tries should come with an answer-handler or it will be ignored.

### **stdout & stdin**
By default `askUser` sends the question to the `process.stdout` and waits for the answer from `process.stdin`. You can pass other streams using the options object.
```js
const opts = {
    stdin: myInputStream, 
    stdout: myOutputStream
}

const answer = await askUser(question, opts)
```
&nbsp;

-----------------------------------------------------------------------
&nbsp;

> **NOTE:** `askUser` function accepts up to 4 argument and their order doesn't matter. It is possible because argument types are all unique:  
* **question** - string  
* **options** - object  
* **onAnswer** - function  
* **limit** - number  

```js
// anything goes:
askUser(question, opts)
askUser(opts, limit, question)
askUser(onAnswer, question, limit)
askUser(limit, onAnswer, question, opts)
``` 

