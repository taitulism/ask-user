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
})
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

# Validation
You can pass in a function that will be called with the user input. With this function you can check if the answer is valid or not. 

### **Arguments**
This function gets called with the user's answer.

### **Return**
This function could return a `Boolean`.  
If you return `true`, the promise is resolved with the current answer.  
If you return `false`, the user will be prompted with the same question until the function returns `true`.

Examples:
```js
const validate = (answer) => (answer === 'yes')
const answer = await askUser('Are we there yet?', validate)
```

In case you want to use the validation function also as a sanitaion/cleanup function you could return a modified answer of any type.
```js
// `answer` is always a string
const handleAnswer = (answer) => {
    const age = parseInt(answer, 10)

    if (age < 8 || age > 88) {
        return false;
    }

    return age;
}

const answer = await askUser('How old are you?', handleAnswer)
// typeof answer === 'number'
```
### **Async Validation**
An async validation check is also supported. Just return a promise.
```js
const validate = (answer) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (condition) resolve(false)
            else resolve(true)
        })
    })
}
const answer = await askUser(question, validate)
```

### **Limit**
You can set a maximum number of tries (validation fails). The answer will be set to `null` when limit exceeded.
```js
const question = 'You have 3 tries to guess my favorite color:';
const validate = (answer) => (answer === 'blue')
const limit = 3
const answer = await askUser(question, validate, limit)

if (answer == null) {
    // failed 3 times
}
```


# Options
### **Limit**
You can utilize the `limit` with the `options` object too:
```js
const opts = {limit: 3}
const answer = await askUser(question, opts, validate)
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

