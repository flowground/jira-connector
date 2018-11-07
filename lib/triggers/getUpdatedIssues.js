"use strict";
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector.js');
const moment = require('moment');

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
 * @param {string} cfg.statusChangedToAndRemainedIn - new status value
 * @param {string} cfg.statuses - status names
 * @param {boolean} cfg.includeComments - should issue be returned with comments
 * @param {boolean} cfg.includeAttachments - should issue be returned with attachments
 * @param {boolean} cfg.hasNewComments - return only issues that have new comments
 * @param {string} cfg.roles - return only issues that are visible only to this group
 * @param {string} cfg.visibility - return only issues that have this visibility
 * @param {string} cfg.excludedAuthors - return only issues that have comments that are not created by authors
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

    if(cfg.includeAttachments) {
        fields += ',attachment';
    }

    let commentedFuncArgs = [];

    if(cfg.roles) {
        commentedFuncArgs.push('"role ' + jira.jqlEncode(cfg.roles, true) + '"');
    }

    if(cfg.visibility) {
        commentedFuncArgs.push('"visibility ' + jira.jqlEncode(cfg.visibility, true) + '"');
    }

    if(cfg.hasNewComments) {
        commentedFuncArgs.push('"after ' + "'" + ((snp.updated && jira.jqlDate(snp.updated)) || cfg.startDateTime) + "'" + '"');
    }

    let projects = this.parseCsvInput(cfg.projects);
    let labels = this.parseCsvInput(cfg.labels);
    let exclLabels = this.parseCsvInput(cfg.exclLabels);
    let statuses = this.parseCsvInput(cfg.statuses);
    let excludedAuthors = this.parseCsvInput(cfg.excludedAuthors);
    let roles = this.parseCsvInput(cfg.roles);

    // first trigger run, use start date; subsequent runs, use last processed id and last processed date time from snapshot
    let jql = 'updated>=$startDateTime';
    jql += projects.length ? ' and project in $projects' : '';
    jql += labels.length ? ' and labels in $labels' : '';
    jql += exclLabels.length ? ' and labels not in $exclLabels' : '';
    jql += statuses.length ? ' and status in $statuses' : '';
    jql += cfg.statusChangedToAndRemainedIn ? ' and status changed to $statusChangedToAndRemainedIn after $startDateTime' : '';
    jql += commentedFuncArgs.length ? ' and issueFunction in commented (' + commentedFuncArgs.join(' ') + ')' : '';
    jql += ' order by id';

    let loadNextPage = true;

    for(let startAt = 0; loadNextPage; startAt += maxResults) {
        loadNextPage = await jira.searchIssues(jql, {
            projects: projects,
            startDateTime: snp.updated ? jira.jqlDate(snp.updated) : cfg.startDateTime,
            labels: labels,
            exclLabels: exclLabels,
            statuses: statuses,
            statusChangedToAndRemainedIn: cfg.statusChangedToAndRemainedIn,
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
                let since = moment(snp.updated || jira.addTimezone(cfg.startDateTime, issue.fields.updated));
                for(let att of issue.fields.attachment || []) {
                    att._isNew = since.isBefore(att.created);
                    att._isHit = !excludedAuthors.length || !excludedAuthors.includes(att.author.name);
                    att._isReferencedByComments = false;
                }
                for(let comment of (issue.fields.comment && issue.fields.comment.comments) || []){
                    comment._isNew = since.isBefore(comment.created);
                    comment._isUpdated = since.isBefore(comment.updated);
                    comment._isHit =
                        (!excludedAuthors.length || !excludedAuthors.includes(comment.author.name)) &&
                        (cfg.visibility !== 'internal' || comment.properties.find(p => p.key === 'sd.public.comment' && p.value.internal)) &&
                        (cfg.visibility !== 'external' || !comment.properties.find(p => p.key === 'sd.public.comment' && p.value.internal)) &&
                        (!roles.length || roles.includes(comment.visibility.value));

                    comment._attachments = [];
                    for(let att of issue.fields.attachment || []) {
                        if(comment.body.includes('!' + att.filename + '!') || comment.body.includes('!' + att.filename + '|')) {
                            comment._attachments.push(att.id);
                            att._isReferencedByComments = true;
                        }
                    }
                }

                this.emitData({
                    issue: issue,
                    meta: {
                        startDateTime: since.format(),
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
