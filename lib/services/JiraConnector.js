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
            return '"' + val.replace(/["\\]/g, '\\$&') + '"';
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
     * @param {string|string[]} path - the url path (string) or an array of path components to be escaped and joined with slash
     * @param {object} params - url search parameters
     * @param {object} data - data to be sent as json in the request body
     * @returns {promise}
     */
    request(method, path, params, data) {
        if(Array.isArray(path)) {
            path = '/' + path.map(encodeURIComponent).join('/');
        }

        let url = this.baseUrl + path;

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

        console.log('---REQUEST: %s %s', method, url);
        console.log('---REQUEST BODY: %j', data);

        return request(requestOptions);
    }

    /**
     * Search for Jira issues using JQL.
     * @param {string} jql - the JQL template
     * @param {object} jqlValues - values for the placeholders in the JQL template
     * @param {object} params - other params to send to jira (like maxResults)
     * @returns {promise} - resolves to an object containing a list of Jira issues
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
     * @returns {promise}
     */
    createIssue(issue) {
        return this.request('POST', '/issue', null, issue);
    }

    /**
     * Update a Jira issue
     * @param {string} issueId - the issue id unique identifier
     * @param {object} updateData - the updated data for the issue
     * @returns {promise}
     */
    updateIssue(issueId, updateData) {
        return this.request('PUT', ['issue', issueId], null, updateData);
    }

    /**
     * Loads a Jira issue by id
     * @param {string} id - The Jira issue id (not key)
     * @returns {promise} - resolves to the Jira issue
     */
    getIssue(id) {
        return this.request('GET', ['issue', id]);
    }


    jqlDate(jiraDate) {
        return jiraDate.slice(0, 16).replace('T', ' ');
    }

    isValidJqlDate(date) {
        return !!date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}(?: [0-9]{2}:[0-9]{2})?$/);
    }
}

module.exports = JiraConnector;