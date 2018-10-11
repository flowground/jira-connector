"use strict";
const messages = require('elasticio-node').messages;
const JiraConnector = require('../services/JiraConnector');

exports.process = processAction;

/**
 * Update a Jira Issue
 *
 * @param {object} msg - contains the data for the new issue
 * @param {object} cfg - credentials and config fields
 * @returns {promise}
 */
function processAction(msg, cfg) {

    const jira = new JiraConnector(cfg);
    const {issueId, updateData} = msg.body;

    jira.updateIssue(issueId, updateData).then(response => {
        this.emit('data', messages.newMessageWithBody(response));
    }).catch(error => {
        this.emit('error', error);
    }).finally(() => {
        this.emit('done');
    });
}