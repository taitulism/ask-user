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

# Input Validation Callback

By default, a question is only asked once, unless you pass in an input callback. 

```js
const answer = await askUser('Are we there yet?', callback)
```
>**is NOT the final callback**

Its main purpose is for validating the user input.
An invalid input will re-prompt the user with the same question until validation (or `Ctrl+c`). 

You can also use it to manipulate (trim, escape, sanitize etc.) a valid answer before returning it.

The input callback gets called with the user's answer.
```js
const question = 'Are we there yet?';

const finalAnswer = await askUser(question, (answer) => {
    // ...
})
```

### **Return value**
If you return `false`, the user will be prompted again with the same question.  
If you return `true`, the promise is resolved with the current answer.  

```js
askUser(question, (answer) => (answer === 'yes'))
```

If you return a truthy value other than a boolean `true`, the promise is resolved with that returned value.
```js
const callback = (answer) => {
    const age = parseInt(answer, 10)
    if (age < 21) {
        return false;
    }
    else {
        return true // --> final answer will be a String
        return age; // --> final answer will be a Number
    } 
}

const finalAnswer = await askUser('How old are you now?', callback)
```


### **Async Validation**
An async validation check is also supported. Just return a promise.
```js
const asyncCallback = (answer) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // No reject. Resolve with `true` or `false`
            if (condition) resolve(false)
            else resolve(true)
        }, 150)
    })
}
const answer = await askUser(question, asyncCallback)
```

### **Exceptions and Rejections**
Throwing exceptions (or rejecting the promise when async), from within the input callback will bubble up:
```js
const err = new Error("I'm too old for this")

try {
    const answer = await askUser(question, () => {
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
You can set a maximum number of tries (validation fails). The answer will be set to `null` when limit exceeded.
```js
const question = 'You have 3 tries to guess my favorite color:';
const callback = (answer) => (answer === 'blue')
const limit = 3
const answer = await askUser(question, callback, limit)

if (answer == null) {
    // failed 3 times
}
```


# Options
### **Limit**
You can utilize the `limit` with the `options` object too:
```js
const opts = {limit: 3}
const answer = await askUser(question, opts, callback)
```
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
* **validate** - function  
* **limit** - number  

```js
// anything goes:
askUser(question, opts)
askUser(opts, limit, question)
askUser(validate, question, limit)
askUser(limit, validate, question, opts)
``` 

