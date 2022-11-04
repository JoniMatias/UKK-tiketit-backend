
const crypto = require('crypto');
const sql = require('../../routes/sql');

var authsBySession = new Object();
var sessionsByLogin = new Object();

module.exports = {

    startLogin: function(codeChallenge, logintype) {
        return new Promise(function(resolve, reject) {
            if (logintype === 'own') {
                let loginid = crypto.randomUUID();
                let fronttunnus = crypto.randomUUID();
                resolve({cc: codeChallenge, lid: loginid, fcode: fronttunnus})
            } else {
                reject(500);
            }
        }).then((data) => {
            return sql.users.createLoginUrl(data.lid, data.cc, data.fcode);
        }).then((data) => {
            return {'login-url': data};
        });
    },

    login: function(username, password, loginid) {
        return new Promise(function(resolve, reject) {
            sql.users.getSalt(username).then((saltData) => {
                if (saltData.length === 1) {
                    let hash = module.exports.hash(password, saltData[0].salt);
                    sql.users.checkUserAccount(username, hash).then((accountData) => {
                        if (accountData.length === 1) {
                            sql.users.updateLoginAttemptWithAccount(loginid, accountData[0].tili).then((updateData) => {
                                sql.users.getLoginAttemptWithId(loginid).then((attemptData) => {
                                    if (attemptData.length === 1) {
                                        resolve({success: true, 'login-code': attemptData[0].fronttunnus});
                                    } else {
                                        reject(403);
                                    }
                                });
                            });
                        } else {
                            reject(403)
                        }
                    });
                } else {
                    reject(500);
                }
            });
        });
    },

    requestAccess: function(accessCode, codeVerify) {
        return new Promise(function(resolve, reject) {
            sql.users.getLoginAttemptWithAccessCode(accessCode)
            .then((loginData) => {
                if (loginData.length > 0) {
                    sql.users.createSession(loginData[0].tili)
                    .then((sessionData) => {
                        resolve(sessionData);
                    });
                } else {
                    reject(403);
                }
            })
            .catch((error) => {
                reject(error);
            });
        });
    },

    createAccount: function(username, password) {
        return sql.users.createEmptyUser(username)
        .then((newuserId) => {
            let salt = crypto.randomBytes(8).toString('hex');
            let hash = module.exports.hash(password, salt);
            return sql.users.createAccount(username, hash, salt, newuserId);
        });
    },

    hash: function(hashable, salt) {
        return crypto.createHash('sha256').update(hashable).update(salt).digest('hex');
    },

    authenticatedUser: function(httpRequest) {
        var sessionid = httpRequest.header('session-id');
        if (sessionid == undefined) {
            return Promise.reject(300);
        }

        return sql.users.userIdForSession(sessionid)
        .then((userids) => {
            if (userids.length == 1) {
                return userids[0].tili;
            } else {
                return Promise.reject(100);
            }
        });
    }
  
};