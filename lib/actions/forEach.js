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

module.exports = util.eioModule(processAction);

/**
 * Emits a message for each element in the input array.
 *
 * @alias forEach
 * @param {object} msg - incoming message
 * @param {object} msg.body - incoming object
 * @param {undefined|object|object[]} msg.body.list - list of objects to be emitted
 * @param {object} cfg - configuration
 */
function processAction(msg, cfg) {
    // undefined is interpreted as an empty list
    // a single value is interpreted as a list containing that single value
    let list = util.arrayize(msg.body.list);

    for(let item of list) {
        this.emitData(item);
    }
}