/**
 * flowground :- Telekom iPaaS / jira-connector
 * Copyright © 2020, Deutsche Telekom AG
 * contact: https://flowground.net/en/support-and-contact
 *
 * All files of this connector are licensed under the Apache 2.0 License. For details
 * see the file LICENSE on the top-level directory.
 */

'use strict';

const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Get Jira issue
 *
 * @alias getIssue
 * @param {object} msg
 * @param {string} msg.body.issueId - Jira issue id
 * @param {object} cfg
 * @returns {Promise}
 */
function processAction(msg, cfg) {
    const issueId = msg.body.issueId;
    if(!issueId) {
        throw new Error('Issue ID is required.');
    }

    const jira = new JiraConnector(cfg);
    return jira.getIssue(issueId, {expand: 'transitions'});
}