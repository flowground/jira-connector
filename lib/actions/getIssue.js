'use strict';

//const jsonata = require('@elastic.io/jsonata-moment');
const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

function processAction(msg, cfg) {
    const issueId = msg.body.IssueID;
    if(!issueId) {
        throw new Error('IssueID not specified.');
    }
    const jira = new JiraConnector(cfg);
    console.log('using issue id', issueId);
    return jira.getIssue(issueId);
}