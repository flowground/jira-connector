"use strict";
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector.js');

module.exports = util.eioModule(processTrigger);

/**
 * Returns new updated from Jira
 *
 * @param {object} msg - incoming message. empty for triggers.
 * @param {object} cfg - credentials and config fields
 * @param {string} cfg.baseUrl
 * @param {string} cfg.username
 * @param {string} cfg.password
 * @param {string} cfg.startDateTime - consider issues updated after (or equal to) this date and time only
 * @param {string} cfg.maxResults - max num of results from jira (number); can be empty
 * @param {string} cfg.projects - project codes (comma separated)
 * @param {string} cfg.labels - labels (comma separated)
 * @param {string} cfg.exclLabels - exclusion labels (comma separated)
 * @param {string} cfg.statusChangedTo - new status value
 * @param {string} cfg.statuses - status names
 * @param {boolean} cfg.includeComments - should issue be returned with comments
 * @param {boolean} cfg.haveNewComments - should issue be returned with new comments
 * @param {string} cfg.haveCommentsForRole - visible only to groups
 * @param {string} cfg.haveCommentsWithVisibility - internal or external
 * @param {object} snp - the snapshot; empty object for the first run
 */
async function processTrigger(msg, cfg, snp) {

    const jira = new JiraConnector(cfg);


    if(!cfg.startDateTime) {
        throw new Error('"Issues updated since" field is required.');
    }

    if(!jira.isValidJqlDate(cfg.startDateTime)) {
        throw new Error('"Issues updated since" field is invalid. Valid formats are "yyyy-mm-dd" and "yyyy-mm-dd hh:mm"');
    }

    if(cfg.startDateTime.length === 10) {
        cfg.startDateTime += ' 00:00'; // normalize
    }

    let maxResults = cfg.maxResults ? Number(cfg.maxResults) : 50;

    if(!(maxResults>0)) {
        throw new Error('"Maximum number of issues to retrieve" must be a number greater than zero.');
    }

    let fields = '*navigable';

    if(cfg.includeComments) {
        fields += ',comment';
    }

    let commentedFunctArgs = [];

    if(cfg.haveNewComments && cfg.haveCommentsForRole) {
        commentedFunctArgs.push('"role ' + "'" + cfg.haveCommentsForRole + "'" + '"');
    }

    if(cfg.haveNewComments && (snp.updated || cfg.startDateTime)) {
        commentedFunctArgs.push('"after ' + "'" + cfg.startDateTime || snp.updated + "'" + '"');
    }

    if(cfg.haveNewComments && cfg.haveCommentsWithVisibility) {
        commentedFunctArgs.push('"visibility ' + "'" + cfg.haveCommentsWithVisibility + "'" + '"');
    }

    let projects = this.parseCsvInput(cfg.projects);
    let labels = this.parseCsvInput(cfg.labels);
    let exclLabels = this.parseCsvInput(cfg.exclLabels);
    let statuses = this.parseCsvInput(cfg.statuses);

    // first trigger run, use start date; subsequent runs, use last processed id and last processed date time from snapshot
    let jql = 'updated>=$startDateTime';
    jql += projects.length ? ' and project in $projects' : '';
    jql += labels.length ? ' and labels in $labels' : '';
    jql += exclLabels.length ? ' and labels not in $exclLabels' : '';
    jql += statuses.length ? ' and status in $statuses' : '';
    jql += cfg.statusChangedTo ? ' and status changed to $statusChangedTo after $startDateTime' : '';
    jql += commentedFunctArgs.length ? ' and issueFunction in commented (' + commentedFunctArgs.join(' ') + ')' : '';
    jql += ' order by id';

    let loadNextPage = true;

    for(let startAt = 0; loadNextPage; startAt += maxResults) {
        loadNextPage = await jira.searchIssues(jql, {
            projects: projects,
            startDateTime: snp.updated ? jira.jqlDate(snp.updated) : cfg.startDateTime,
            labels: labels,
            exclLabels: exclLabels,
            statuses: statuses,
            statusChangedTo: cfg.statusChangedTo,
        }, {
            fields: fields,
            maxResults: maxResults,
            startAt: startAt
        }).then(res => {
            let issues = res.issues;

            if(snp.updated) {
                issues = issues.filter(issue =>
                    issue.fields.updated > snp.updated ||
                    (issue.fields.updated === snp.updated && Number(issue.id) > snp.id)
                );
            }

            issues.forEach(issue => {
                this.emitData({
                    issue: issue,
                    meta: {
                        startDateTime: snp.updated || jira.addTimezone(cfg.startDateTime, issue.fields.updated),
                    },
                });

                this.emitSnapshot({
                    id: Number(issue.id),
                    updated: issue.fields.updated
                });
            });
            return issues.length === 0 && res.total > startAt + maxResults;
        });
    }
}
