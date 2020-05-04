/**
 * flowground :- Telekom iPaaS / jira-connector
 * Copyright © 2020, Deutsche Telekom AG
 * contact: https://flowground.net/en/support-and-contact
 *
 * All files of this connector are licensed under the Apache 2.0 License. For details
 * see the file LICENSE on the top-level directory.
 */

'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Add comment to Jira issue
 *
 * @alias addComment
 * @param {object} msg
 * @param {object} msg.body
 * @param {string} msg.body.issueId - the issue to add the comment to
 * @param {object} msg.body.comment - the comment data
 * @param {object} cfg - credentials and config fields
 * @returns {Promise}
 */
function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);

    return jira.addComment(msg.body.issueId, msg.body.comment);
}