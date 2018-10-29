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
 * @param {string} msg.body.attachment.getAttachmentUrl - the url for downloading the attachment
 * @param {object} cfg - credentials and config fields
 * @returns {Promise}
 */
async function processAction(msg, cfg) {
    const {attachment} = msg.body;
    const jira = new JiraConnector(cfg);

    const attachFile = await util.downloadAttachment(attachment.getAttachmentUrl);

    const formData = {
        file: {
            value: attachFile,
            options: {
                filename: attachment.filename,
                contentType: attachment.contentType
            }
        }
    };

    return jira.addAttachment(msg.body.issueId, formData);
}