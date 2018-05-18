const Q = require('q');
const { messages } = require('elasticio-node');
const JiraClient = require('../jiraClient.js');


// >> helper
function genMetaModel(meta) {
    function pathMapping(field, schema) {
        if (schema.type === 'user') {
            return { path: `${field}.name` };
        };
        if ((schema.type === 'array') && (schema.items === 'string')) {
            return { path: `${field}`, transform: 's2as' };
        };
        return { path: field };
    }
    function typeMapping(schema) {
        const map = {
            string: 'lstring',
            user: 'string',
            // date: 'string',
        };
        const mapArray = {
            string: 'string',
        };

        if (schema.custom) {
            console.error(`No custom type mapping ${schema.custom}`);
            return null;
        };
        if (schema.type === 'array') {
            if (mapArray[schema.items]) {
                return mapArray[schema.items];
            };
            // >=
            console.error(`Mapping for Jira array type ${schema.items} not found`);
            return null;
        };
        // >=
        if (map[schema.type]) {
            return map[schema.type];
        };
        // >=
        console.error(`Mapping for Jira type ${schema.type} not found`);
        return null;
    };

    const { fields } = meta.projects[0].issuetypes[0];
    const output = {};
    const input = {
        type: 'object',
        required: true,
        properties: {
            rqdigest: {
                required: false,
                title: 'Digest',
                type: 'string',
            },
        },
    };
    const persist = [
        { from: 'cfg.project', to: 'project.id' },
        { from: 'cfg.issueType', to: 'issuetype.id' },
        { from: 'cfg.priority', to: 'priority.id' },
    ];
    const stoppWords = [
        'issuetype',
        'project',
        'priority',
    ];
    Object.keys(fields).forEach((field) => {
        if (stoppWords.indexOf(field) === -1) {
            const eioType = typeMapping(fields[field].schema);
            const jiraPathMapping = pathMapping(field, fields[field].schema);
            if (eioType) {
                const inputField = {
                    required: fields[field].required,
                    title: fields[field].name,
                    type: eioType,
                };
                input.properties[field] = inputField;
                persist.push({
                    from: `msg.body.${field}`,
                    to: jiraPathMapping.path,
                    transform: jiraPathMapping.transform,
                });
            };
        };
    });
    return { in: input, out: output, persist };
};

function checkAccess(msg, cfg) {
    return new Promise((resolve, reject) => {
        if (!cfg.digest || (msg.body.rqdigest === cfg.digest)) {
            return resolve();
        };
        // >=
        const errMsg = `access unauthorized cfg: ${cfg.digest}; msg: ${msg.body.rqdigest}`;
        console.error(errMsg);
        return reject(new Error(errMsg));
    });
};

function loadMetaModel(cfg) {
    return new Promise((resolve, reject) => {
        console.log('=============>loadMetaModel<=================');
        const jira = new JiraClient(cfg);
        jira.getIssueCreateMeta(cfg.project, cfg.issueType)
            .then(resolve)
            .catch(reject);
    });
};

// << helper

function processAction(msg, cfg) {
    const self = this;

    console.log(JSON.stringify({ msg }));
    console.log(JSON.stringify({ cfg }));

    function getData() {
        return new Promise((resolve, reject) => {
            const jira = new JiraClient(cfg);
            loadMetaModel(cfg)
                .then(genMetaModel)
                .then((log) => {
                    console.log(JSON.stringify(log, null, 2));
                    return log;
                })
                .then(model => jira.createIssue(cfg, msg, model.persist))
                .then(resolve)
                .catch(reject);
        });
    };

    function emitData(data) {
        self.emit('data', messages.newMessageWithBody(data));
    };
    function emitError(err) {
        const errMsg = err.toString();
        console.error(`error: ${errMsg}`);
        self.emit('error', err);
    };
    function emitEnd() {
        self.emit('end');
    };
    Q()
        .then(() => checkAccess(msg, cfg))
        .then(getData)
        .then(emitData)
        .catch(emitError)
        .done(emitEnd);
};

function listProjects(cfg, callback) {
    console.log(JSON.stringify({ cfg }));

    function getData() {
        return new Promise((resolve) => {
            const list = {};
            const jira = new JiraClient(cfg);
            jira.listProjects()
                .then((projects) => {
                    projects.forEach((project) => {
                        list[project.id] = `${project.key}: ${project.name}`;
                    });
                    console.log(JSON.stringify(list, null, 2));
                    return resolve(list);
                })
                .catch((error) => {
                    console.log(error);
                    list.error = JSON.stringify(error);
                    console.log(JSON.stringify(list, null, 2));
                    return resolve(list);
                });
        });
    };
    Q().then(getData)
        .then(list => callback(null, list))
        .fail(err => callback(err));
};

function listIssueTypes(cfg, callback) {
    function getData() {
        return new Promise((resolve) => {
            const list = {};
            const jira = new JiraClient(cfg);
            jira.listIssueTypesForProject(cfg.project)
                .then((issueTypes) => {
                    issueTypes.forEach((issueType) => {
                        list[issueType.id] = issueType.name;
                    });
                    console.log(JSON.stringify(list, null, 2));
                    return resolve(list);
                })
                .catch((error) => {
                    console.log(error);
                    list.error = JSON.stringify(error);
                    console.log(JSON.stringify(list, null, 2));
                    return resolve(list);
                    // return reject(error);
                });
        });
    };
    Q().then(getData)
        .then(list => callback(null, list))
        .fail(err => callback(err));
};

function listPriorities(cfg, callback) {
    function getData() {
        return new Promise((resolve) => {
            const list = {};
            loadMetaModel(cfg)
                .then((meta) => {
                    const prios = meta.projects[0].issuetypes[0].fields.priority.allowedValues;
                    prios.forEach((prio) => {
                        list[prio.id] = prio.name;
                    });
                    console.log(JSON.stringify(list, null, 2));
                    return resolve(list);
                })
                .catch((error) => {
                    console.log(error);
                    list.error = JSON.stringify(error);
                    return resolve(list);
                    // return reject(error);
                });
        });
    };
    Q().then(getData)
        .then(list => callback(null, list))
        .fail(err => callback(err));
};

function getMetaModel(cfg, callback) {
    function getData() {
        return new Promise((resolve/* , reject */) => {
            loadMetaModel(cfg)
                .then(genMetaModel)
                .then((list) => {
                    const out = {
                        in: list.in,
                        out: list.out,
                    };
                    console.log(JSON.stringify(out, null, 2));
                    return resolve(out);
                })
                .then(resolve)
                .catch((error) => {
                    const out = {
                        in: {
                            type: 'object',
                            required: true,
                            properties: {
                                error: {
                                    viewClass: 'TextFieldView',
                                    required: false,
                                    label: `error: ${error.toString()}`,
                                },
                            },
                        },
                        out: {},
                    };
                    console.log(JSON.stringify(out, null, 2));
                    return resolve({ out });
                });
        });
    };
    Q().then(getData)
        .then(list => callback(null, { in: list.in, out: list.out }))
        .fail(err => callback(err));
};

function logCfg(cfg, callback) {
    const list = {};
    Object.keys(cfg).forEach((key) => {
        const value = JSON.stringify(cfg[key]);
        list[key] = `${key}: ${value}`;
    });
    console.log(list);
    callback(null, list);
};

function xgetMetaModel(x, cfg) { return getMetaModel(cfg); }; // eslint-disable-line no-unused-vars
function xlistPriorities(x, cfg) { return listPriorities(cfg); }; // eslint-disable-line no-unused-vars
function xlistProjects(x, cfg) { return listProjects(cfg); }; // eslint-disable-line no-unused-vars
function xlistIssueTypes(x, cfg) { return listIssueTypes(cfg); }; // eslint-disable-line no-unused-vars

// exports.process = xlistPriorities;
exports.process = processAction;
exports.listProjects = listProjects;
exports.listIssueTypes = listIssueTypes;
exports.listPriorities = listPriorities;
exports.logCfg = logCfg;
exports.getMetaModel = getMetaModel;
