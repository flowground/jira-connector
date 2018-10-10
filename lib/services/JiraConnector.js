
const request = require('request-promise');
module.exports = class JiraConnector {

    constructor(cfg) {
        if(!cfg.username) {
            throw new Error('username field is required.');
        }

        if(!cfg.password) {
            throw new Error('password field is required');
        }

        if(!cfg.baseUrl) {
            throw new Error('baseUrl field is required.');
        }

        this.baseUrl = cfg.baseUrl;
        this.username = cfg.username;
        this.password = cfg.password;
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
                Authorization: 'Basic' + new Buffer(this.username + ':' + this.password).toString('base64')
            },
            json: true
        };

        return request(requestOptions);

    }

    searchIssues(jql, data) {
        return this.request('GET', '/search', {
            jql: this.jql(jql, data)
        });
    }
}
