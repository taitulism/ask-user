[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/taitulism/ask-user.svg?branch=master)](https://travis-ci.org/taitulism/ask-user)

**Ask User**
============
A simple CLI prompt to get user input.


# Install
```sh
$ npm install ask-user
```

# Basic Usage
### **Promise style**
```js
askUser('Are you sure?').then((answer) => {
    console.log(answer);
});
```

### **Async/Await**
```js
(async () => {
    const answer = await askUser('Are you sure?');
    console.log(answer);
})();
```

> When called with no question it defaults to: `'Press "ENTER" to continue... '`

# Arguments
The `askUser` function accepts up to 5 argument and their order doesn't matter. It is possible because argument types are all unique:  
* **question** - string  
* **options** - object  
* **onAnswer** - function  
* **limit** - number  
* **isRequired** - boolean  

```js
// anything goes:
askUser(question, opts)
askUser(opts, limit, question, isRequired)
askUser(onAnswer, question, limit)
// etc.
``` 

## **Question**
Very self explanatory. The string that precedes the user input. For readability, the question is separated from the answer with a space. You can disable this behavior by setting the `trailingSpace` option to false.


## **onAnswer**
A function that is used as the answer handler. It gets called when the user answers the question and hits "Enter". 

> ### **This is NOT the final callback.**

The handler's main purpose is for validating the user input. An invalid input will re-prompt the user with the same question until validation (or `Ctrl+C`). 

You can also use it to manipulate (trim, escape, sanitize etc.) an answer before returning it.  



### **Arguments**
* `answer` \<String> - the user's answer
* `count` \<Number> - the number of times the user was prompted with the question. Starts with 1.
```js
const question = 'Are we there yet?';

const finalAnswer = await askUser(question, (answer, count) => {
    // ...
})
```

### **Return Value**
* Return `false` if you don't accept the answer. The user will be prompted again with the same question.  
* Return `true` if you accept the user answer. Current answer will be returned as the final answer.  
* Return any truthy value (other than a boolean `true`) to be used as the final answer.  
* Return `null` or `undefined` to cancel question. Prompt will exit immediately and final answer will be `null`. Could be used as a kind of a cancel/exit.

```js
// The question will be repetitively re-asked until the user types "I DO!"
const finalAnswer = askUser('Will you marry me?', (answer) => {
    return answer === 'I DO!';
});

console.log(finalAnswer) // I DO!
```

The handler could also function as your answer parser/sanitizer/manipulator:
```js
const question = 'What is your name?';
// user types: "  John " with spaces

const onAnswer = (answer) => {
    const trimmed = answer.trim();

    return trimmed; // final answer: "John"
    // vs.
    return true;    // final answer: "  John "
}

const finalAnswer = await askUser(question, onAnswer)
```

### **Default Answer**
Another use of returning a value could be a default value:
```js
const question = 'Which branch to pull from?';
const onAnswer = (branch) => {
    if (!branch) return 'master'; // when the answer is empty

    return branch.trim(); // return clean branch name
}

const finalAnswer = await askUser(question, onAnswer)
```
But you don't need a handler for a simple default. You can simply use an `OR` operator:
```js
const question = 'Which branch to pull from?';
const finalAnswer = await askUser(question) || 'master';
```



### **Async Validation**
Async handler is also supported. Just make sure to return a promise.
```js
const asyncHandler = (answer) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (condition) resolve(true)
            else resolve(false)
        }, 1000)
    });
}

const answer = await askUser(question, asyncHandler)
```

### **Exceptions and Promise-Rejections**
Throwing exceptions (or rejecting the promise) from within the answer-handler will bubble up for you to catch:
```js

try {
    const answer = await askUser(question, () => {
        const err = new Error("I'm too old for this")

        throw err
        // or:
        return new Promise((resolve, reject) => {
            reject(err)
        })
    });
}
catch (err) {
    // caught here
}
```



## **Required Answer**
If you require an answer for your question you can pass in a boolean `true`. The question will be re-asked if no answer provided.
```js
const answer = await askUser('Username:', true);
```



## **Limit**
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




## **Options**
An object with the following possible properties:
* `onAnswer`
* `limit`
* `isRequired`
* `hidden`
* `convert`
* `trailingSpace`
* `stdin`
* `stdout`

You can use `onAnswer`, `limit` and `isRequired`  via the `options` object too.
> **NOTE: If you pass in an argument and its alias option, the argument will take precedence.**
```js
const answer = await askUser(question, {
    limit: 3,
    isRequired: true,
    onAnswer: (guessColor) => (guessColor === 'blue')
});
```

### **hidden**
Set to `true` to mask user input with stars. Default is `false`.
```js
const answer = await askUser('Enter Password:', {hidden: true});
// User types: `1234`
// User sees:  `****`

// answer === 1234
```

### **convert**
All inputs are strings by default. `askUser` automatically converts answers into numbers and booleans when possible.

* `'42'` (string) - becomes `42` (number).  
* `'y' / 'Yes'` - becomes `true`.  
* `'n' / 'No'` - becomes `false`.
> Case insensitive

You can disable this behavior by setting the `convert` option to `false`:
```js
// 'Yes' for both questions:

const answer1 = await askUser(question);
// answer1 === true

const answer2 = await askUser(question, {convert: false});
// answer2 === 'Yes'
```

### **trailingSpace**
By default, a single space is added after the question if the last character is not a space or a newline. You can disable this behavior by setting the `trailingSpace` option to false.
```js
await askUser(question, {trailingSpace: false});
```

### **stdin & stdout**
By default `askUser` sends the question to the `process.stdout` and waits for the answer from `process.stdin`. You can pass other streams using the options object.
```js
const opts = {
    stdin: myInputStream, 
    stdout: myOutputStream
}

const answer = await askUser(question, opts)
```
