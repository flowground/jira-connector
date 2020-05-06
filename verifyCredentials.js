/**
 * flowground :- Telekom iPaaS / jira-connector
 * Copyright © 2020, Deutsche Telekom AG
 * contact: https://flowground.net/en/support-and-contact
 *
 * All files of this connector are licensed under the Apache 2.0 License. For details
 * see the file LICENSE on the top-level directory.
 */

"use strict";
const JiraConnector = require('./lib/services/JiraConnector');

module.exports = verify;


/**
 * Executes an unfiltered search
 *
 * @param {object} credentials
 * @returns {Promise}
 */
function verify(credentials) {
    const jira = new JiraConnector(credentials);
    return jira.searchIssues('', {}, {maxResults: 0})
        .catch(err => {
            console.log('Verify Credentials error:', JSON.stringify(err));
            return Promise.reject(err);
        });
}