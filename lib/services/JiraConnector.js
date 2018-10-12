const request = require('request-promise');

class JiraConnector {

    /**
     * JiraConnector constructor.
     * @param {object} credentials
     * @param {string} credentials.baseUrl
     * @param {string} credentials.username
     * @param {string} credentials.password
     */
    constructor(credentials) {
        if(!credentials.username) {
            throw new Error('username field is required.');
        }

        if(!credentials.password) {
            throw new Error('password field is required');
        }

        if(!credentials.baseUrl) {
            throw new Error('baseUrl field is required.');
        }

        this.baseUrl = credentials.baseUrl;
        this.username = credentials.username;
        this.password = credentials.password;
    }

    /**
     * Encodes a value to be used in a JQL query
     * @param {number|string|array} val
     * @returns {string}
     */
    jqlEncode(val) {
        if(Array.isArray(val)) {
            return '(' + val.map(this.jqlEncode).join(', ') + ')'; 
        }

        if(typeof val === 'string') {
            return '"' + val + '"';
        }
        
        return val;
    }

    /**
     * Parses a JQL template and interpolates values
     * @param {string} jql - JQL template containing $var placeholders
     * @param {object} data - values for placeholders
     * @returns {string} - The interpolated JQL
     */
    jql(jql, data) {
        return jql.replace(/\$([a-z0-9]+)/ig, (match, p1) => this.jqlEncode(data[p1]));
    }

    /**
     * Generic authenticated request to Jira.
     * @param {string} method - HTTP verb (GET, POST, etc.)
     * @param {string} url
     * @param {object} params - url search parameters
     * @param {object} data - data to be sent as json in the request body
     * @returns {Promise}
     */
    request(method, url, params, data) {
        if(Array.isArray(url)) {
            url = '/' + url.map(encodeURIComponent).join('/');
        }

        url = this.baseUrl + url;

        if(params) {
            url += '?';
            url += Object.entries(params).map(pair => encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1])).join('&');
        }

        const requestOptions = {
            method: method,
            uri: url,
            headers: {
                Authorization: 'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
            },
            json: true,
            body: data
        };

        return request(requestOptions);
    }

    /**
     * Search for Jira issues using JQL.
     * @param {string} jql - the JQL template
     * @param {object} jqlValues - values for the placeholders in the JQL template
     * @param {object} params - other params to send to jira (like maxResults)
     * @returns {Promise} - resolves to an object containing a list of Jira issues
     */
    searchIssues(jql, jqlValues, params) {
        params = Object.assign({
            jql: this.jql(jql, jqlValues)
        }, params);
        return this.request('GET', '/search', params);
    }

    /**
     * Creates a Jira issue
     * @param {object} issue - the issue
     * @returns {Promise}
     */
    createIssue(issue) {
        return this.request('POST', '/issue', null, issue);
    }

    /**
     * Loads a Jira issue by id
     * @param {string} id - The Jira issue id (not key)
     * @returns {Promise} - resolves to the Jira issue
     */
    getIssue(id) {
        return this.request('GET', ['issue', id]);
    }
}

module.exports = JiraConnector;