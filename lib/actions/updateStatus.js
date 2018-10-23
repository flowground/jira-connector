"use strict";
const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Update a Jira Issue status
 *
 * @param {object} msg - contains the data for the updated issue
 * @param {object} cfg - credentials and config fields
 * @returns {promise}
 */
function processAction(msg, cfg) {


    const jira = new JiraConnector(cfg);
    const issue = jira.mapInputToIssue(msg.body);
    let id;

    if(!issue || !issue.id) {
        throw new Error('Issue ID not specified.');
    }

    if(cfg.newStatusName) {
        id = issue.transitions.find(tr => tr.name.toLowerCase() === cfg.newStatusName.toLowerCase()).id;
    } else {
        id = cfg.newStatusId;
    }

    return jira.updateStatus(issue.id, {transition: {id: id}});
}