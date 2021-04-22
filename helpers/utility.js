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

module.exports = {
    generateRandomString,
    asyncFetch,
};
