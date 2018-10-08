"use strict";
const request = require('request-promise');
const JiraConnector = require('./lib/services/jiraConnector');

module.exports = verify;


/**
 * Executes an unfiltered search
 *
 * @param credentials object
 * @returns Promise
 */
function verify(credentials) { 

    const jira = new JiraConnector(credentials.baseUrl, credentials.apiKey);
    return jira.request('GET', '/search', {maxResuts: 0});
}