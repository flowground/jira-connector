'use strict';

const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

async function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);

    console.log('msg', msg.body.id);
    console.log('cfg', cfg.idField);

    const issue = await jira.getIssue('323398');

    return {
        issue: issue,
        input: msg.body
    };
}