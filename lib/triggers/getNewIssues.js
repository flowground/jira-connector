"use strict";
const request = require('request-promise');
const messages = require('elasticio-node').messages;
const gard = require('../services/jira');

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

    snapshot.date = snapshot.date || new Date(cfg.startDate);
    
    function searchIssues() {
        return gard.jql('search?jql=project=$project and created>=$startDate', {project: cfg.project, startDate: cfg.startDate.toString()});
    }    

    const query = searchIssues();

    console.log('````````````````````````', cfg.baseUrl + query);

    const requestOptions = {
        uri: cfg.baseUrl + query,
        headers: {
            Cookie: cfg.apiKey
        },
        json: true
    };
    
    return request.get(requestOptions)
        .then((issues) => {
            console.log('Got %s issues', issues.length);
            console.log('Issues are', JSON.stringify(issues));
            this.emit('snapshot', snp);

            if (!issues.lengh) {
                return messages.newMessageWithBody({ issues });
            }
        }).catch(err => this.emit('error', err));
}