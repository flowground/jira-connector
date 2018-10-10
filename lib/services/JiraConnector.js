const request = require('request-promise');

module.exports = class JiraConnector {

    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    jqlEncode(val) {
        if(Array.isArray(val)) {
            return '(' + val.map(this.jqlEncode).join(', ') + ')'; 
        }

        if(typeof val === 'string') {
            return '"' + val + '"';
        }
        
        return val;
    }

    jql(jql, data) {
        return jql.replace(/\$([a-z0-9]+)/ig, (match, p1) => this.jqlEncode(data[p1]));
    }

    request(method, url, params, data) {
        url = this.baseUrl + url;

        if(params) {
            url += '?';
            url += Object.entries(params).map(pair => encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1])).join('&');
        }

        const requestOptions = {
            method: method,
            uri: url,
            headers: {
                Cookie: this.apiKey
            },
            json: true,
            body: data
        };

        return request(requestOptions);

    }

    searchIssues(jql, data) {
        return this.request('GET', '/search', {
            jql: this.jql(jql, data)
        });
    }

    createIssue(data) {
        return this.request('POST', '/issue', null, data);
    }
};
