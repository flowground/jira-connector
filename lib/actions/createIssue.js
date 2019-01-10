'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Creates a Jira Issue
 *
 * @alias createIssue
 * @param {object} msg - contains the data for the new issue
 * @param {object} cfg - credentials and config fields
 * @param {string} cfg.baseUrl
 * @param {string} cfg.username
 * @param {string} cfg.password
 * @returns {Promise}
 */
function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);

    return jira.createIssue(jira.mapInputToIssue(msg.body));
}