'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector');

exports.process = util.eioProcess(processAction);

/**
 * Creates a Jira Issue
 *
 * @param {object} msg - contains the data for the new issue
 * @param {object} cfg - credentials and config fields
 * @param {string} cfg.baseUrl
 * @param {string} cfg.username
 * @param {string} cfg.password
 * @returns {Promise}
 */
function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);
    const issue = msg.body;

    return jira.createIssue(issue);
}