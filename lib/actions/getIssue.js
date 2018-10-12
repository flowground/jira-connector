'use strict';

const jsonata = require('@elastic.io/jsonata-moment');
const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);
    return jira.getIssue(jsonata(cfg.idField)(msg.body));
}