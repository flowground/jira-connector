"use strict";
const JiraConnector = require('./lib/services/JiraConnector');

module.exports = verify;


/**
 * Executes an unfiltered search
 *
 * @param credentials object
 * @returns Promise
 */
console.log('verify credentials loaded.');
function verify(credentials) {
    console.log('verifying credentials.....');
    const jira = new JiraConnector(credentials);
    return jira.request('GET', '/search', {maxResults: 0}).then(() => console.log('verify cred success')).catch((err) => {
        console.log('verify credentials error!');
        throw new Error(err);
    });
}