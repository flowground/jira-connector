"use strict";
const JiraConnector = require('./lib/services/JiraConnector');

module.exports = verify;


/**
 * Executes an unfiltered search
 *
 * @param {object} credentials
 * @returns {Promise}
 */

console.log('vc loaded');
function verify(credentials) {
    console.log('vc verify');
    const jira = new JiraConnector(credentials);
    return jira.request('GET', '/search', {maxResults: 0});
}