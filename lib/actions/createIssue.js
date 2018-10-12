"use strict";
const messages = require('elasticio-node').messages;
const JiraConnector = require('../services/JiraConnector');

exports.process = processAction;

/**
 * Creates a Jira Issue
 *
 * @param {object} msg - contains the data for the new issue
 * @param {object} cfg - credentials and config fields
 * @returns {promise}
 */
function processAction(msg, cfg) {

    const jira = new JiraConnector(cfg);
    const issue = msg.body;

    jira.createIssue(issue).then(response => {
        this.emit('data', messages.newMessageWithBody(response));
    }).catch(error => {
        this.emit('error', error);
    }).finally(() => {
        this.emit('end');
    });
}