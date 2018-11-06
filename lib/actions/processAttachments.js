'use strict';
const util = require('../services/util.js');
const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

/**
 * Process Jira attachments
 *
 * @param {object} msg
 * @param {object} msg.body
 * @param {object[]} msg.body.attachments
 * @param {object} cfg - credentials and config fields
 * @returns {Promise}
 */
async function processAction(msg, cfg) {
    const jira = new JiraConnector(cfg);
    let attachments = msg.body.attachments;

    if(!attachments) {
        attachments = [];
    } else if(!Array.isArray(attachments)) {
        attachments = [attachments];
    }

    await Promise.all(attachments.map(async (att) => {
        let [content, eioAttach] = await Promise.all([
            jira.downloadAttachment(att.content),
            util.createAttachment()
        ]);
        att.content = eioAttach.getDownloadUrl();
        await eioAttach.upload(content);
    }));

    return {attachments: attachments};
}