const request = require('request-promise');
const moment = require('moment');
const util = require('./util');

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
     * @param {object} [params] - url search parameters
     * @param {object} [data] - data to be sent as json in the request body
     * @param {object} [formData] - form data to upload
     * @returns {Promise}
     */
    request(method, path, params, data, formData) {
        if(Array.isArray(path)) {
            path = '/' + path.map(encodeURIComponent).join('/');
        }

        let url = this.baseUrl + path;

        if(params) {
            url += '?';
            url += Object.entries(params).map(pair => encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1])).join('&');
        }

        let headers = {
            Authorization: 'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
        };

        if(formData) {
            headers['X-Atlassian-Token'] = 'no-check';
        }

        const requestOptions = {
            method: method,
            uri: url,
            headers: headers,
            body: data,
            formData: formData,
            json: true,
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
     * Update a Jira issue
     * @param {string} issueId - the issue id
     * @param {object} issue - data to update
     * @returns {Promise}
     */
    updateIssue(issueId, issue) {
        return this.request('PUT', ['issue', issueId], null, issue).then(() => issue);
    }

    /**
     * Add a comment to issue
     * @param {string} issueId - the issue id
     * @param {Object} comment - comment data to add
     * @returns {Promise}
     */
    addComment(issueId, comment) {
        return this.request('POST', ['issue', issueId, 'comment'], null, comment);
    }

    /**
     * Execute transition to change issue status
     * @param {string} issueId - id of issue to be updated
     * @param {string} transitionId - id of the corresponding transition
     * @return {Promise}
    */
    doTransition(issueId, transitionId) {
        return this.request('POST', ['issue', issueId, 'transitions'], null, {transition: {id: transitionId}});
    }

    /**
     * Loads a Jira issue by id
     * @param {string} id - The Jira issue id (not key)
     * @param {object} params - url params
     * @returns {Promise} - resolves to the Jira issue
     */
    getIssue(id, params) {
        return this.request('GET', ['issue', id], params);
    }

    /**
     * Add attachment to a Jira issue by id
     * @param {string} issueId - The Jira issue id (not key)
     * @param {string} filename
     * @param {string} url - the url for downloading the attachment
     * @param {string} contentType
     * @returns {Promise}
     */
    async addAttachment(issueId, filename, url, contentType) {
        const content = await util.downloadAttachment(url);

        const formData = {
            file: {
                value: content,
                options: {
                    filename: filename,
                    contentType: contentType
                }
            }
        };

        return this.request('POST', ['issue', issueId, 'attachments'], null, null, formData);
    }

    /**
     * Converts a date as returned by Jira to a date to be used in JQL
     * @param {string} jiraDate - format: 'yyyy-mm-ddThh:mm:ss.uuuZ'
     * @returns {string} - format: 'yyyy-mm-dd' or 'yyyy-mm-dd hh:mm'
     */
    jqlDate(jiraDate) {
        return jiraDate.slice(0, 16).replace('T', ' ');
    }

    /**
     * Validates a date for usage in JQL.
     * @param {string} date - 'yyyy-mm-dd' or 'yyyy-mm-dd hh:mm'
     * @returns {boolean}
     */
    isValidJqlDate(date) {
        return !!date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}(?: [0-9]{2}:[0-9]{2})?$/);
    }

    /**
     * Add to a given date the extracted timezone from another date
     * @param {string} date - date without timezone (YYYY-MM-DD HH:mm)
     * @param {string} tzSourceDate - date from which the timezone is extracted
     * @returns {string} - date with timezone
     */
    addTimezone(date, tzSourceDate) {
        return moment.parseZone(date + moment.parseZone(tzSourceDate).format('Z')).format();
    }

    /**
     * Convert input object received from mapper to a Jira issue representation (object)
     * @param {object} input - object received from elastic.io mapper
     * @param {object} input.fields - standard Jira fields
     * @param {object} input.fields.OTHER - other Jira fields (including custom fields)
     * @returns {object} - Jira issue object
     */
    mapInputToIssue(input) {
        let issue = JSON.parse(JSON.stringify(input));

        if(issue.fields && 'OTHER' in issue.fields) {
            Object.assign(issue.fields, issue.fields.OTHER);
            delete issue.fields.OTHER;
        }

        return issue;
    }
}

module.exports = JiraConnector;