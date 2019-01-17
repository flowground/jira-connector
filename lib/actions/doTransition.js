"use strict";
const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Update a Jira Issue status
 *
 * @alias doTransition
 * @param {object} msg
 * @param {object} msg.body
 * @param {string} msg.body.issueId - id of the issue to be updated
 * @param {string} [msg.body.transitions] - list of possible transitions
 * @param {string} [msg.body.statusName] - new status name
 * @param {object} cfg - credentials and config fields
 * @returns {Promise}
 */
function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);
    let issueId = msg.body.issueId;
    let transitions = msg.body.transitions;
    let statusName = msg.body.statusName;

    if(!issueId) {
        throw new Error('Issue ID is not specified.');
    }
    if(!transitions) {
        //TODO: load transitions from JIRA
        throw new Error('Transitions are not specified.');
    }
    if(!statusName) {
        //TODO: look for transitionId, statusId...
        throw new Error('Status Name is not specified.');
    }

    let transition = transitions.find(tr => tr.to.name.toLowerCase() === statusName.toLowerCase());
    if(!transition) {
        throw new Error('Could not find transition to status: ' + statusName);
    }

    return jira.doTransition(issueId, transition.id).then(() => ({success: true}));
}