const fetch = require('fetch');

function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function asyncFetch(url) {
    return new Promise((resolve, reject) => {
        fetch.fetchUrl(url, null, (error, meta, body) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(body.toString());
        })
    });
}

function checkString(text) {
    let sum = 0;

    text = text.toUpperCase();

    for(let i = 0; i < (text.length - 1); i++) {
        let current = 0;
        if (isNaN(text.charAt(i))) {
            current = text.charCodeAt(i) - 'A'.charCodeAt(0) + 10;
        } else {
            current = parseInt(text.charAt(i));
        }
        switch ((i+1) % 3) {
            case 1:
                sum += current * 7;
                break;
            case 2:
                sum += current * 3;
                break;
            case 0:
                sum += current * 1;
                break;
        }
    }

    sum = (sum).toString();

    return sum.charAt(sum.length - 1) == text.charAt(text.length - 1);
}

function getCheckStringChar(text) {
    let sum = 0;

    text = text.toUpperCase();

    for(let i = 0; i < text.length; i++) {
        let current = 0;
        if (isNaN(text.charAt(i))) {
            current = text.charCodeAt(i) - 'A'.charCodeAt(0) + 10;
        } else {
            current = parseInt(text.charAt(i));
        }
        switch ((i+1) % 3) {
            case 1:
                sum += current * 7;
                break;
            case 2:
                sum += current * 3;
                break;
            case 0:
                sum += current * 1;
                break;
        }
    }

    sum = (sum).toString();

    return sum.charAt(sum.length - 1);
}

module.exports = {
    generateRandomString,
    asyncFetch,
    checkString,
    getCheckStringChar,
};
