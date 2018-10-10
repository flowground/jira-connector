"use strict";
const messages = require('elasticio-node').messages;
const JiraConnector = require('../services/JiraConnector');

exports.process = processTrigger;

/**
 * Executes the trigger's logic by sending a request to the Petstore API and emitting response to the platform.
 * The function returns a Promise sending a request and resolving the response as platform message.
 *
 * @param msg incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values, such as apiKey and pet status
 * @param snp object
 * @returns promise resolving a message to be emitted to the platform
 */
function processTrigger(msg, cfg, snp) {

    const jira = new JiraConnector(cfg);

    if(!cfg.startDateTime) {
        throw new Error('startDateTime field is required.');
    }

    if(!cfg.projects) {
        throw new Error('projects field is required.');
    }

    let projects = cfg.projects.split(/[ ,]+/);
    let labels = cfg.labels.split(/[ ,]+/);
    let exclLabels = cfg.exclLabels.split(/[ ,]+/);

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