'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Add comment to Jira issue
 *
 * @typedef {object} msg.body
 * @property {string} issueId - the issue id Coordinate
 * @property {object} comment - the comment data
 *
 * @param {object} msg
 * @param {object} msg.body
 * @param {object} cfg - credentials and config fields
 * @returns {promise}
 */
function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);

    return jira.addComment(msg.body.issueId, msg.body.comment);
}