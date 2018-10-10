"use strict";
const messages = require('elasticio-node').messages;
const JiraConnector = require('../services/JiraConnector.js');

exports.process = processTrigger;

/**
 * Returns new issues from Jira
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

    if(!cfg.projects) {
        throw new Error('projects field is required.');
    }

    let projects = cfg.projects.trim().split(/[ ,]+/);
    let labels = cfg.labels.trim().split(/[ ,]+/);
    let exclLabels = cfg.exclLabels.trim().split(/[ ,]+/);

    // first trigger run, use start date; subsequent runs, use last processed id
    let jql = snp.lastProcessedIssueId ? 'id>$id' : 'created>=$startDateTime';
    jql += cfg.projects.length ? ' and project in $projects' : '';
    jql += cfg.labels.length ? ' and labels in $labels' : '';
    jql += cfg.exclLabels.length ? ' and labels not in $exclLabels' : '';
    jql += ' order by id';
    
    jira.searchIssues(jql, { 
        projects: projects,
        id: snp.lastProcessedIssueId || 0,
        startDateTime: cfg.startDateTime,
        labels: labels, 
        exclLabels: exclLabels,
    }).then(res => {
        res.issues.forEach(issue => {
            this.emit('data', messages.newMessageWithBody(issue));
            this.emit('snapshot', {lastProcessedIssueId: Number(issue.id)});
        });
    }).catch(error => {
        this.emit('error', error);
    });
}