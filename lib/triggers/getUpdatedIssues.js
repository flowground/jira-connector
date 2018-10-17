"use strict";
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector.js');

module.exports = util.eioModule(processTrigger);

/**
 * Returns new updated from Jira
 *
 * @param {object} msg - incoming message. empty for triggers.
 * @param {object} cfg - credentials and config fields
 * @param {object} snp - the snapshot; empty object for the first run
 */
async function processTrigger(msg, cfg, snp) {

    const jira = new JiraConnector(cfg);

    if(!cfg.startDateTime) {
        throw new Error('"Issues updated since" field is required.');
    }

    let maxResults = cfg.maxResults ? Number(cfg.maxResults) : 50;

    if(!(maxResults>0)) {
        throw new Error('"Maximum number of issues to retrieve" must be a number greater than zero.');
    }

    let projects = this.parseCsvInput(cfg.projects);
    let labels = this.parseCsvInput(cfg.labels);
    let exclLabels = this.parseCsvInput(cfg.exclLabels);

    // first trigger run, use start date; subsequent runs, use last processed id and last processed date time from snapshot
    let jql = 'updated>=$startDateTime';
    jql += projects.length ? ' and project in $projects' : '';
    jql += labels.length ? ' and labels in $labels' : '';
    jql += exclLabels.length ? ' and labels not in $exclLabels' : '';
    jql += ' order by id';

    let loadNextPage = true;

    for(let startAt = 0; loadNextPage; startAt += maxResults) {
        loadNextPage = await jira.searchIssues(jql, {
            projects: projects,
            startDateTime: snp.updated ? jira.jqlDate(snp.updated) : cfg.startDateTime,
            labels: labels,
            exclLabels: exclLabels,
        }, {
            maxResults: maxResults,
            startAt: startAt
        }).then(res => {
            let issues = res.issues;

            if(snp.updated) {
                issues = issues.filter(issue =>
                    issue.updated > snp.updated ||
                    (issue.updated === snp.updated && Number(issue.id) > snp.id)
                );
            }

            issues.forEach(issue => {
                this.emitData(issue);
                this.emitSnapshot({
                    id: Number(issue.id),
                    updated: issue.updated
                });
            });
            return issues.length === 0 && res.total > startAt + maxResults;
        });
    }
}
