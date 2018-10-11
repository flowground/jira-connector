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

    let maxResults = maxResults ? Number(cfg.maxResults) : 50;

    if(!(maxResults>0)) {
        throw new Error('maxResults must be a number greater than zero.');
    }

    let projects = parseMultipleValues(cfg.projects);
    let labels = parseMultipleValues(cfg.labels);
    let exclLabels = parseMultipleValues(cfg.exclLabels);

    // first trigger run, use start date; subsequent runs, use last processed id
    let jql = snp.lastProcessedIssueId ? 'id>$id' : 'created>=$startDateTime';
    jql += projects.length ? ' and project in $projects' : '';
    jql += labels.length ? ' and labels in $labels' : '';
    jql += exclLabels.length ? ' and labels not in $exclLabels' : '';
    jql += ' order by id';
    
    jira.searchIssues(jql, { 
        projects: projects,
        id: snp.lastProcessedIssueId || 0,
        startDateTime: cfg.startDateTime,
        labels: labels, 
        exclLabels: exclLabels,
    }, {
        maxResults: maxResults
    }).then(res => {
        res.issues.forEach(issue => {
            this.emit('data', messages.newMessageWithBody(issue));
            this.emit('snapshot', {lastProcessedIssueId: Number(issue.id)});
        });
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