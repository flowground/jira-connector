/**
 * flowground :- Telekom iPaaS / jira-connector
 * Copyright © 2020, Deutsche Telekom AG
 * contact: https://flowground.net/en/support-and-contact
 *
 * All files of this connector are licensed under the Apache 2.0 License. For details
 * see the file LICENSE on the top-level directory.
 */

"use strict";
const util = require('../services/util');
const JiraConnector = require('../services/JiraConnector');
const moment = require('moment');


module.exports = util.eioModule(processAction);

/**
 * Get Jira issue comments
 *
 * @alias getComments
 * @param {object} msg
 * @param {object} msg.body
 * @param {string} msg.body.issueId - id of issue to get comments from
 * @param {string} [msg.body.createdAfter] - date
 * @param {string} [msg.body.updatedAfter] - date
 * @param {object} cfg - credentials and config fields
 * @param {string} [cfg.excludedAuthors] - filter for comments
 * @param {string} [cfg.visibility] - filter for comments
 * @param {string} [cfg.roles] - filter for comments
 * @returns {Promise}
 */
async function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);
    let input = msg.body;
    let excludedAuthors = this.parseCsvInput(cfg.excludedAuthors);
    let visibility = cfg.visibility;
    let roles = this.parseCsvInput(cfg.roles);
    let createdAfter = input.createdAfter && moment(input.createdAfter);
    let updatedAfter = input.updatedAfter && moment(input.updatedAfter);

    let allComments = [];
    let startAt = 0;
    let res;

    if(!input.issueId) {
        throw new Error('Issue ID not present in the incoming message.');
    }

    do {
        res = await jira.getComments(input.issueId, {startAt: startAt, maxResults: 100, expand: 'renderedBody,properties', orderBy: 'created'});

        allComments.push(...res.comments.filter(comment => {
            return (
                (!input.createdAfter || moment(comment.created).isAfter(createdAfter)) &&
                (!input.updatedAfter || moment(comment.updated).isAfter(updatedAfter)) &&
                (!excludedAuthors.length || !excludedAuthors.includes(comment.author.name)) &&
                (visibility !== 'internal' || comment.properties.find(p => p.key === 'sd.public.comment' && p.value.internal)) &&
                (visibility !== 'external' || !comment.properties.find(p => p.key === 'sd.public.comment' && p.value.internal)) &&
                (!roles.length || roles.includes(comment.visibility.value))
            )
        }));

        startAt += res.comments.length;
    } while(res.total > startAt);

    allComments.forEach(comment => this.emitData(comment));
}