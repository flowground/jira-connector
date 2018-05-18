const Q = require('q');
const { messages } = require('elasticio-node');
const { JiraApi } = require('jira');


function processAction(msg, cfg) {
    const self = this;

    function getData() {
        return new Promise((resolve, reject) => {
            const jira = new JiraApi(cfg.protocol, cfg.host, cfg.port, cfg.user, cfg.password, '2');
            jira.searchUsers(cfg.username, undefined, undefined, undefined, undefined, function dummy(error, user) {
                if (error) {
                    console.log(error);
                    return reject(error);
                };
                console.log(user);
                return resolve(user);
            });
        });
    };

    function emitData(data) {
        self.emit('data', messages.newMessageWithBody(data));
    };
    function emitError(err) {
        console.error(`error: ${err}`);
        self.emit('error', err);
    };
    function emitEnd() {
        self.emit('end');
    };

    Q()
        .then(getData)
        .then(emitData)
        .catch(emitError)
        .done(emitEnd);
};

exports.process = processAction;
