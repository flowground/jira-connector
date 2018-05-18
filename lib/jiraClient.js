'use strict';

const { JiraApi } = require('./jira.js');

function JiraClient(cfg) {
    const jira = new JiraApi(cfg.schema, cfg.host, cfg.port === '0' ? null : cfg.port, cfg.username, cfg.password, '2');

    return {
        searchJira:
            function searchJira(jql, options) {
                return new Promise((resolve, reject) => {
                    jira.searchJira(jql, options || {}, (error, response) => {
                        if (error) {
                            console.log(error);
                            return reject(error);
                        };
                        return resolve(response);
                    });
                });
            },
        listProjects:
            function listProjects() {
                return new Promise((resolve, reject) => {
                    jira.listProjects((error, response) => {
                        if (error) {
                            console.log(error);
                            return reject(error);
                        };
                        return resolve(response);
                    });
                });
            },
        listIssueTypesForProject:
            function listIssueTypesForProject(projectId) {
                return new Promise((resolve, reject) => {
                    jira.getProject(projectId, (error, project) => {
                        if (error) {
                            console.log(error);
                            return reject(error);
                        };
                        return resolve(project.issueTypes);
                    });
                });
            },
        createIssue:
            function listIssueTypesForProject(cfg, msg, persist) {
                return new Promise((resolve, reject) => {
                    const issue = { fields: {} };
                    persist.forEach((field) => {
                        let path = field.from.split('.');
                        let value = null;
                        if (path[0] === 'cfg') value = cfg;
                        if (path[0] === 'msg') value = msg;
                        for (let i = 1, l = path.length; i < l; i += 1) {
                            try {
                                value = value[path[i]];
                            } catch (error) {
                                value = null;
                            };
                        };
                        if (!value) return;

                        path = field.to.split('.');
                        let target = issue.fields;
                        const l = path.length;
                        for (let i = 0; i < l - 1; i += 1) {
                            if (!target[path[i]]) target[path[i]] = {};
                            target = target[path[i]];
                        };

                        if (field.transform) {
                            if (field.transform === 's2as') {
                                value = value.split(',');
                            }
                        };

                        target[path[l - 1]] = value;
                    });
                    console.log(JSON.stringify(issue, null, 2));
                    jira.addNewIssue(issue, (error, newIssue) => {
                        if (error) {
                            console.error(JSON.stringify(error));
                            return reject(error);
                        };
                        return resolve(newIssue);
                    });
                });
            },
        getIssueCreateMeta:
            function getIssueCreateMeta(projectId, issueTypeId) {
                return new Promise((resolve, reject) => {
                    jira.getIssueCreateMeta(projectId, issueTypeId, (error, newIssue) => {
                        if (error) {
                            console.error(JSON.stringify(error));
                            return reject(error);
                        };
                        return resolve(newIssue);
                    });
                });
            },
    };
};

module.exports = JiraClient;
