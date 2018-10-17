'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector.js');

module.exports = util.eioModule(processTrigger);

/**
 * Returns new issues from Jira
 *
 * @param {object} msg - incoming message. empty for triggers.
 * @param {object} cfg - credentials and config fields
 * @param {string} cfg.baseUrl
 * @param {string} cfg.username
 * @param {string} cfg.password
 * @param {string} cfg.startDateTime - consider issues created after (or equal to) this date and time only
 * @param {string} cfg.maxResults - max num of results from jira (number); can be empty
 * @param {string} cfg.projects - project codes (comma separated)
 * @param {string} cfg.labels - labels (comma separated)
 * @param {string} cfg.exclLabels - exclusion labels (comma separated)
 * @param {object} snp - the snapshot; empty object for the first run
 */
function processTrigger(msg, cfg, snp) {
    const jira = new JiraConnector(cfg);

    let regEx = RegExp(/^([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2})$/);

    if(!regEx.test(cfg.startDateTime)) {
        throw new Error('"Issues updated since" field is required.');
    }

    let maxResults = cfg.maxResults ? Number(cfg.maxResults) : 50;

    if(!(maxResults>0)) {
        throw new Error('maxResults must be a number greater than zero.');
    }

    let projects = this.parseCsvInput(cfg.projects);
    let labels = this.parseCsvInput(cfg.labels);
    let exclLabels = this.parseCsvInput(cfg.exclLabels);

    // first trigger run, use start date; subsequent runs, use last processed id
    let jql = snp.lastProcessedIssueId ? 'id>$id' : 'created>=$startDateTime';
    jql += projects.length ? ' and project in $projects' : '';
    jql += labels.length ? ' and labels in $labels' : '';
    jql += exclLabels.length ? ' and labels not in $exclLabels' : '';
    jql += ' order by id';
    
    return jira.searchIssues(jql, {
        projects: projects,
        id: snp.lastProcessedIssueId || 0,
        startDateTime: cfg.startDateTime,
        labels: labels, 
        exclLabels: exclLabels,
    }, {
        maxResults: maxResults
    }).then(res => {
        res.issues.forEach(issue => {
            this.emitData(issue);
            this.emitSnapshot({lastProcessedIssueId: Number(issue.id)});
        });
    });
}
