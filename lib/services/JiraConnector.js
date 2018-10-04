
const request = require('request-promise');
module.exports = class JiraConnector {

    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    jql(jql, data) {
        return jql.replace(/\$([a-z0-9]+)/ig, (match, p1) => {
            const val = data[p1];
    
            if(typeof val === 'string') {
                return '"' + val + '"';
            }
            
            return val;
        });
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
            json: true
        };

        console.log('request options-----------', requestOptions);
        
        return request(requestOptions);

    }

    searchIssues(jql, data) {
        return this.request('GET', '/search', {
            jql: this.jql(jql, data)
        });
    }
}
