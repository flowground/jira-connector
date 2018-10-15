"use strict";
const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Update a Jira Issue
 *
 * @param {object} msg - contains the data for the updated issue
 * @param {object} cfg - credentials and config fields
 * @returns {promise}
 */
function processAction(msg, cfg) {

    const jira = new JiraConnector(cfg);
    const issue = msg.body;

    return jira.updateIssue(issue.id, issue);
}