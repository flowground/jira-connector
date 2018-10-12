'use strict';

const util = require('../services/util');
//const JiraConnector = require('../services/JiraConnector');

module.exports = util.eioModule(processAction);

async function processAction(msg, cfg) {
    console.log('msg', msg);
    console.log('cfg', cfg);

    return Promise.resolve({x: 1, y:2});
}