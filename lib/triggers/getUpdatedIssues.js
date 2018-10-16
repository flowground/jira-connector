"use strict";
const messages = require('elasticio-node').messages;
const JiraConnector = require('../services/JiraConnector.js');

exports.process = processTrigger;

/**
 * Returns new updated from Jira
 *
 * @param {object} msg - incoming message. empty for triggers.
 * @param {object} cfg - credentials and config fields
 * @param {object} snp - the snapshot; empty object for the first run
 */
function processTrigger(msg, cfg, snp) {

    const jira = new JiraConnector(cfg);

    if(!cfg.startDateTime) {
        throw new Error('startDateTime field is required.');
    }

    let projects = parseMultipleValues(cfg.projects);
    let labels = parseMultipleValues(cfg.labels);
    let exclLabels = parseMultipleValues(cfg.exclLabels);

    // first trigger run, use start date; subsequent runs, use last processed id and last processed date time from snapshot
    let jql = 'updated>=$startDateTime';
    jql += projects.length ? ' and project in $projects' : '';
    jql += labels.length ? ' and labels in $labels' : '';
    jql += exclLabels.length ? ' and labels not in $exclLabels' : '';
    jql += ' order by id';

    let dateTime = snp.lastProcessedIssueDateTime || cfg.startDateTime;

    return jira.searchIssues(jql, {
        projects: projects,
        id: snp.lastProcessedIssueId || 0,
        startDateTime: dateTime,
        labels: labels,
        exclLabels: exclLabels,
    }).then(res => {
        let issues = res.issues.filter(issue => formatDate(issue.updated) > dateTime || (formatDate(issue.updated) === dateTime && Number(issue.id) > snp.lastProcessedIssueId ));
        issues.forEach(issue => {
            let dateTime = formatDate(issue.updated);
            this.emit('data', messages.newMessageWithBody(issue));
            this.emit('snapshot', {lastProcessedIssueId: Number(issue.id), lastProcessedIssueDateTime: dateTime});
        })
    }).catch(error => {
        this.emit('error', error);
    });
}

function parseMultipleValues(str) {
    if(typeof str !== 'string') return [];
    str = str.trim();
    if(!str) return [];
    return str.split(/[ ,]+/);
}

function formatDate(date) {
    return date.slice(0, 16).replace('T', ' ');
}