'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Downloads issue attachments from Jira and uploads them to the platform
 *
 * @param {object} msg
 * @param {object} msg.body - issue
 * @param {object|object[]} [msg.body.attachments]
 * @param {object} cfg - credentials and config fields
 * @returns {Promise}
 */
async function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);
    let issue = msg.body;
    let attachments = [].concat(issue.fields.attachment);

    await Promise.all(attachments.map(async (att) => {
        let [content, eioAttach] = await Promise.all([
            jira.downloadAttachment(att.content),
            util.createAttachment()
        ]);
        att.content = eioAttach.getDownloadUrl();
        await eioAttach.upload(content);
    }));

    return issue;
}