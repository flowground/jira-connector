'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Add Attachment to Jira issue
 *
 * @param {object} msg
 * @param {object} msg.body
 * @param {string} msg.body.issueId - the issue to add the attachment to
 * @param {object} msg.body.attachment - the data for the attached file
 * @param {string} msg.body.attachment.filename
 * @param {string} msg.body.attachment.url - the url for downloading the attachment
 * @param {string} msg.body.attachment.contentType
 * @param {object} cfg - credentials and config fields
 * @returns {Promise}
 */
async function processAction(msg, cfg) {
    const {url, filename, contentType} = msg.body.attachment;
    const jira = new JiraConnector(cfg);

    return jira.addAttachment(msg.body.issueId, filename, url, contentType);
}