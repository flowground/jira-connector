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
    return jira.request('GET', '/search', {maxResults: 0});
}