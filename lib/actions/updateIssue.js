/**
 * flowground :- Telekom iPaaS / jira-connector
 * Copyright © 2020, Deutsche Telekom AG
 * contact: https://flowground.net/en/support-and-contact
 *
 * All files of this connector are licensed under the Apache 2.0 License. For details
 * see the file LICENSE on the top-level directory.
 */

"use strict";
const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Update a Jira Issue
 *
 * @alias updateIssue
 * @param {object} msg - contains the data for the updated issue
 * @param {object} cfg - credentials and config fields
 * @returns {Promise}
 */
function processAction(msg, cfg) {

    const jira = new JiraConnector(cfg);
    const issue = jira.mapInputToIssue(msg.body);

    if(!issue || !issue.id) {
        throw new Error('Issue ID not specified.');
    }

    return jira.updateIssue(issue.id, issue);
}