function verify(credentials, cb) {

    console.log('About to verify credentials');
    cb(null, { verified: true });
};

module.exports = verify;
