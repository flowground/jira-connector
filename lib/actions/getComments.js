'use strict';

const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);


/**
 * Get all or updated or newly created comments for an issue
 * @param {object} msg - message
 * @param {object} cfg - configuration object
 * @param {string} cfg.createdAfter - date
 * @param {string} cfg.updatedAfter - date
 * @param {string} cfg.excludedAuthors - comment author
 * @param {string} cfg.maxResults - max num of results from jira (number); can be empty
 */
async function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);
    const issueId = msg.body.issue.id;
    let authors = this.parseCsvInput(cfg.excludedAuthors);

    if(!issueId) {
        throw new Error('Issue ID is required.');
    }

    let maxResults = cfg.maxResults ? Number(cfg.maxResults) : 50;

    if(!(maxResults>0)) {
        throw new Error('"Maximum number of issues to retrieve" must be a number greater than zero.');
    }

    let loadNextPage = true;

    for(let startAt = 0; loadNextPage; startAt += maxResults) {
        loadNextPage = await jira.getComments(issueId).then(issue => issue.comment).then(comments => {
            let newComments = comments.filter(comment => {
                if((msg.meta.startDateTime || cfg.createdAfter) && (comment.created > msg.meta.startDateTime || cfg.createdAfter)){
                    return true;
                }
                if((msg.meta.startDateTime || cfg.updatedAfter) && (comment.updated > msg.meta.startDateTime || cfg.createdAfter)) {
                    return true;
                }
                if(authors.length){
                    authors.forEach(author => {
                        if(comment.author.name !== author) {
                            return true;
                        }
                    })
                }
                return false;
            });
            newComments.forEach(comment => {
                this.emitData({
                    comment: comment,
                });
            });
            return comments.length === 0 && comments.total > startAt + maxResults;
        });
    }
}