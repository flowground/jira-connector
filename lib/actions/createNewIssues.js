"use strict";
const request = require('request-promise');
const messages = require('elasticio-node').messages;

exports.process = processAction;

const API_BASE_URI = 'https://api.myjson.com/bins/';

/**
 * Executes the action's logic by sending a request to the Petstore API and emitting response to the platform.
 * The function returns a Promise sending a request and resolving the response as platform message.
 *
 * @param msg incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values, such as apiKey and pet status
 * @returns promise resolving a message to be emitted to the platform
 */
function processAction(msg, cfg) {

    // body contains the mapped data
    const body = msg.body;
    console.log('body is', body);

    const requestOptions = {
        uri: API_BASE_URI + cfg.id,
        headers: {},
        body: body.words,
        json: true
    };

    // return the promise that sends a request to the Petstore API
    return request.put(requestOptions)
        .then((response) => messages.newMessageWithBody({words: response}));
}