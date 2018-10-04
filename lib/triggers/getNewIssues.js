"use strict";
const request = require('request-promise');
const messages = require('elasticio-node').messages;
const JiraConnector = require('../services/JiraConnector');

//const API_BASE_URI = 'https://api.myjson.com/bins/';

exports.process = processTrigger;


/**
 * Executes the trigger's logic by sending a request to the Petstore API and emitting response to the platform.
 * The function returns a Promise sending a request and resolving the response as platform message.
 *
 * @param msg incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values, such as apiKey and pet status
 * @param snapshot object
 * @returns promise resolving a message to be emitted to the platform
 */
function processTrigger(msg, cfg, snapshot) {

    const jira = new JiraConnector(cfg.baseUrl, cfg.apiKey);

    console.log('msg is', msg, typeof msg);
    console.log('cfg is', cfg, typeof cfg);
    console.log('snapshot is', snapshot, typeof snapshot);
    
    if(!cfg.startDate) {
        throw new Error('You must specify a start date');
    }
    
    if(!cfg.baseUrl) {
        throw new Error('You must specify a host');
    }
    
    if(!cfg.project) {
        throw new Error('You must specify a project');
    }
    
    if(!cfg.apiKey) {
        throw new Error('You must specify a project');
    }

    const snp = {
        date: new Date()
    }

    snapshot.date = snapshot.date || cfg.startDate;
    
    jira.searchIssues('project=$project and created>=$startDate', {project: cfg.project, created: snapshot.date}).then(res => {
        console.log('--------------issues-----------', res);
        if(res.issues.length) {
            this.emit('data', messages.newMessageWithBody({issues: res.issues}));
        }
    });
}