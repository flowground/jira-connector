/**
 * flowground :- Telekom iPaaS / jira-connector
 * Copyright © 2020, Deutsche Telekom AG
 * contact: https://flowground.net/en/support-and-contact
 *
 * All files of this connector are licensed under the Apache 2.0 License. For details
 * see the file LICENSE on the top-level directory.
 */

'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector.js');

module.exports = util.eioModule(processTrigger);

/**
 * Returns new issues from Jira
 *
 * @alias getNewIssues
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
 * @param {string} cfg.statuses - status names
 * @param {boolean} cfg.includeComments - should issue be returned with comments
 * @param {object} snp - the snapshot; empty object for the first run
 */
function processTrigger(msg, cfg, snp) {
    const jira = new JiraConnector(cfg);

    if(!cfg.startDateTime) {
        throw new Error('"Issues created since" field is required.');
    }

    if(!jira.isValidJqlDate(cfg.startDateTime)) {
        throw new Error('"Issues created since" field is invalid. Valid formats are "yyyy-mm-dd" and "yyyy-mm-dd hh:mm"');
    }

    if(cfg.startDateTime.length === 10) {
        cfg.startDateTime += ' 00:00'; // normalize
    }

    let maxResults = cfg.maxResults ? Number(cfg.maxResults) : 50;

    if(!(maxResults>0)) {
        throw new Error('maxResults must be a number greater than zero.');
    }

    let fields = '*navigable';

    if(cfg.includeComments) {
        fields += ',comment';
    }

    let projects = this.parseCsvInput(cfg.projects);
    let labels = this.parseCsvInput(cfg.labels);
    let exclLabels = this.parseCsvInput(cfg.exclLabels);
    let statuses = this.parseCsvInput(cfg.statuses);

    // first run, use start date; subsequent runs, use last processed id
    let jql = snp.lastProcessedIssueId ? 'id>$id' : 'created>=$startDateTime';
    jql += projects.length ? ' and project in $projects' : '';
    jql += labels.length ? ' and labels in $labels' : '';
    jql += exclLabels.length ? ' and labels not in $exclLabels' : '';
    jql += statuses.length ? ' and status in $statuses' : '';
    jql += ' order by id';

    return jira.searchIssues(jql, {
        projects: projects,
        id: snp.lastProcessedIssueId || 0,
        startDateTime: cfg.startDateTime,
        labels: labels, 
        exclLabels: exclLabels,
        statuses: statuses,
    }, {
        fields: fields,
        maxResults: maxResults
    }).then(res => {
        res.issues.forEach(issue => {
            this.emitData({
                issue: issue,
                meta: {
                    startDateTime: snp.updated || jira.addTimezone(cfg.startDateTime, issue.fields.created),
                },
            });

            this.emitSnapshot({lastProcessedIssueId: Number(issue.id)});
        });
    });
}