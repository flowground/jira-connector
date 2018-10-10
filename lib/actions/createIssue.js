"use strict";
const messages = require('elasticio-node').messages;
const JiraConnector = require('../services/JiraConnector');

exports.process = processAction;

/**
 * Executes the action's logic by sending a request to the Petstore API and emitting response to the platform.
 * The function returns a Promise sending a request and resolving the response as platform message.
 *
 * @param msg - contains the data for the new issue
 * @param cfg object to retrieve triggers configuration values, such as apiKey, baseUrl and projects
 * @returns promise resolving a message to be emitted to the platform
 */
function processAction(msg, cfg) {

    const issue = msg.body;
    const {baseUrl, apiKey, project} = cfg;

    if(!baseUrl) {
        throw new Error('You must specify a base URL');
    }

    if(!project) {
        throw new Error('You must specify at least one project');
    }

    if(!apiKey) {
        throw new Error('You must specify the API Key');
    }

    const jira = new JiraConnector(cfg.baseUrl, cfg.apiKey);

    return jira.createIssue(issue)
        .then(response => {
            this.emit('data', messages.newMessageWithBody(response));
        })
        .catch(error => {
            this.emit('error', error);
        })
        .finally(() => {
            this.emit('done');
        });


}