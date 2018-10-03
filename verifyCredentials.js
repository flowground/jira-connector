"use strict";
const request = require('request-promise');
module.exports = verify;

const API_BASE_URI = '';

/**
 * Executes the verification logic by sending a simple to the Petstore API using the provided apiKey.
 * If the request succeeds, we can assume that the apiKey is valid. Otherwise it is not valid.
 *
 * @param credentials object
 *
 * @returns
 */
function verify(credentials) { }