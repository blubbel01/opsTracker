const sessionIdToUserId = {};

function getUser(sessionId) {
    return sessionIdToUserId[sessionId];
}

function setUser(sessionId, userId) {
    sessionIdToUserId[sessionId] = userId;
}

function removeUser(sessionId) {
    delete sessionIdToUserId[sessionId];
}

function isUserActiveByUserId(userId) {
    return Object.values(sessionIdToUserId).includes(userId);
}
function forceLogoutUserByUserId(userId) {
    Object.keys(sessionIdToUserId).forEach(sId => {
        const _userId = sessionIdToUserId[sId];
        if (_userId === userId) {
            delete sessionIdToUserId[sId];
        }
    });
}

module.exports = {
    getUser,
    setUser,
    removeUser,
    isUserActiveByUserId,
    forceLogoutUserByUserId,
}
