const Q = require('q');
const { messages } = require('elasticio-node');
const JiraClient = require('../jiraClient.js');

function processTrigger(msg, cfg, snapshot) {
    const self = this;
    const snp = snapshot;
    let newLastCreated = null;
    const inMemory = process.memoryUsage();

    snp.polling = snp.polling || { };

    if (!cfg.projects) {
        const errMsg = 'no projects defined';
        console.error(errMsg);
        throw new Error(errMsg);
    };
    const projects = cfg.projects
        .split(',')
        .map(project => `project = ${project}`)
        .join(' or ');

    function getData() {
        return new Promise((resolve, reject) => {
            let jql = null;
            let optional = null;
            if (snp.polling.lastCreated) {
                // there already was an polling run, find all new tickets from last 2 hours
                jql = `( ${projects}) and (created >= -120m) order by created asc`;
                optional = {
                    fields: ['created', 'summary', 'status', 'assignee', 'description'],
                    maxResults: 100,
                };
            } else {
                // this ist the first polling run, find the latest created ticket
                jql = `( ${projects}) order by created desc`;
                optional = {
                    fields: ['created', 'summary', 'status', 'assignee', 'description'],
                    starAt: 0,
                    maxResults: 1,
                };
            }
            console.log(jql);
            const jira = new JiraClient(cfg);
            jira.searchJira(jql, optional)
                .then(response => resolve(response))
                .catch((error) => {
                    console.log(error);
                    return reject(error);
                });
        });
    };

    function emitData(data) {
        data.issues.forEach((issue) => {
            if (!snp.polling.lastCreated) {
                console.log(`first polling run: ${issue.key}`);
                self.emit('data', messages.newMessageWithBody(issue));
                newLastCreated = issue.fields.created;
            } else if (issue.fields.created > snp.polling.lastCreated) {
                console.log(`new: ${issue.key}`);
                newLastCreated = issue.fields.created;
                self.emit('data', messages.newMessageWithBody(issue));
            } else {
                console.log(`skip: ${issue.fields.key}`);
            }
        });
    };

    function emitError(err) {
        console.error(`error: ${err}`);
        self.emit('error', err);
    };
    function emitEnd() {
        self.emit('end');
        if (newLastCreated) {
            console.log(`update Snapshot: ${newLastCreated}`);
            snp.polling.lastCreated = newLastCreated;
            self.emit('snapshot', snp);
        };

        console.log(JSON.stringify({ inMemory_: inMemory }));
        console.log(JSON.stringify({ outMemory: process.memoryUsage() }));
    };

    Q()
        .then(getData)
        .then(emitData)
        .catch(emitError)
        .done(emitEnd);
};

module.exports.process = processTrigger;
