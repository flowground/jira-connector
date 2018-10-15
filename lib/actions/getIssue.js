'use strict';

const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

function processAction(msg, cfg) {
    const issueId = msg.body.issueId;
    if(!issueId) {
        throw new Error('Issue ID is required.');
    }
    const jira = new JiraConnector(cfg);
    return jira.getIssue(issueId);
}