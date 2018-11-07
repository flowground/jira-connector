const messages = require('elasticio-node').messages;
const request  = require('request-promise');

module.exports = {
    eioModule: eioModule,
    createAttachment: createAttachment,
    downloadAttachment: downloadAttachment
};

/**
 * Returns an object of hooks to be exported from an elastic.io trigger/action module.
 * Provides default empty implementations for all optional hooks to prevent log warnings from the platform (e.g. "invokeModuleFunction – init is not found")
 * To learn more about the hooks below, please see https://github.com/elasticio/sailor-nodejs
 *
 * Usage:
 * module.exports = util.eioModule(processTriggerOrAction); // simple case, just the process function
 * module.exports = util.eioModule({init: initFn, process: processFn}); // multiple hooks specified
 *
 * @param {object|function} mod - The module hooks or just the process function
 * @param {function} mod.process - The process function, will be further wrapped by eioProcess (see below)
 * @param {function} [mod.init] - init hook
 * @param {function} [mod.startup] - startup hook
 * @param {function} [mod.shutdown] - shutdown hook
 * @returns {{init, startup, shutdown, process}} - the object to be exported
 */
function eioModule(mod) {
    if(typeof mod === 'function') {
        mod = {process: mod}; // simple case
    }

    const defaultFn = function(/*cfg*/) { return Promise.resolve(); };

    mod = Object.assign({
        init: defaultFn,
        startup: defaultFn,
        shutdown: defaultFn
    }, mod);

    mod.process = eioProcess(mod.process);

    return mod;
}

/**
 * Adds additional functionality to an elastic.io trigger/action:
 * - this.emitData(data) // data will automatically be wrapped in a message
 * - this.emitSnapshot(snapshot)
 * - this.parseCsvInput
 * If the process function performs async tasks, it should return a promise that resolves when all tasks have been completed.
 * An error in the process function is handled like a promise fail (an 'error' event is sent).
 * No need to explicitly emit an 'end' event in the process function.
 *
 * If the returned promise resolves to a truthy value, that value is emitted as data, no need to emitData() explicitly.
 *
 * @param {function} process - the trigger/action
 * @returns {Function}
 */
function eioProcess(process) {
    return function(msg, cfg, snapshot) {
        console.log('---PROCESS body 100c: %s', msg.body && JSON.stringify(msg.body).slice(0, 100));
        console.log('---PROCESS body keys: %j', msg.body && Object.keys(msg.body));
        console.log('---PROCESS pass keys: %j', msg.passthrough && Object.keys(msg.passthrough));
        console.log('---PROCESS cfg: %j', cfg);
        console.log('---PROCESS snp: %j', snapshot);
        assignAndBind(this, messages, {
            parseCsvInput,
        });

        // wrapper for emit() so we can log what's emitted
        let emit = this.emit;
        this.emit = (event, data) => {
            console.log('---EMIT %s %s', event, data ? JSON.stringify(data).slice(0, 500) : '');
            return emit.call(this, event, data);
        };

        return Promise.resolve(process.call(this, msg, cfg, snapshot)).then(data => {
            if(data !== undefined) {
                this.emitData(data); // promise returned data, wrap it in a message and emit it
            }
            // eslint-disable-next-line no-useless-return
            return; // return nothing so that sailor won't emit data
        });
    };
}

/**
 * Parses a string containing multiple values separated by commas into an array of strings.
 * Spaces around the commas and at the beginning/end of the whole string are stripped.
 * Returns an empty array if the input is an empty string or a non-string.
 *
 * @param {string} input - The input string containing multiple values separated by comma
 * @returns {string[]} - The output array
 */
function parseCsvInput(input) {
    if(typeof input !== 'string') return [];
    input = input.trim();
    if(!input) return [];
    return input.split(/[ ,]+/);
}

/**
 * Like Object.assign(), but binds function values to the first argument (object)
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
 *
 * Sources that are not objects are ignored.
 *
 * @param {object} dest - The recipient of all properties, and the thisArg of the function values
 * @param {object[]} [sources] - The source object(s)
 * @returns {*}
 */
function assignAndBind(dest, ...sources) {
    sources.forEach(source => {
        if(typeof source === 'object' && source) {
            for (const [key, value] of Object.entries(source)) {
                dest[key] = typeof value === 'function' ? value.bind(dest) : value;
            }
        }
    });

    return dest;
}

let eioReqNumber = 0;

/**
 * Generic function to make requests to the elastic.io platform API
 * @param {string} method - HTTP verb (GET, POST, etc.)
 * @param {string|string[]} path - the url path (string) or an array of path components to be escaped and joined with slash
 * @param {object} [options] - request options, see https://www.npmjs.com/package/request#requestoptions-callback
 * @param {object} [options.qs] - url search parameters (used to produce the query string)
 * @param {object} [options.body] - data to be sent as json in the request body
 * @param {object} [options.formData] - form data to upload
 * @param {boolean} [options.json=true] - serialize options.body (if provided) as json AND parse response as json
 * @returns {Promise}
 */
function eioRequest(method, path, options={}) {
    let req = request.defaults({
        method: method,
        baseUrl: process.env.ELASTICIO_API_URI,
        uri: Array.isArray(path) ? path.map(encodeURIComponent).join('/') : path,
        headers: {
            Authorization: 'Basic ' + new Buffer(process.env.ELASTICIO_API_USERNAME + ':' + process.env.ELASTICIO_API_KEY).toString('base64'),
        },
        json: true,
    })(options);

    console.log('---EIO REQUEST-%d: %s %s %s', ++eioReqNumber, req.method, req.uri.href, JSON.stringify(options.body));

    return req;
}

/**
 * Get the urls for the api required for storing and retrieving attachments
 *
 * @returns {Promise}
 */
async function createAttachment () {
    const urls = await eioRequest('POST', '/v2/resources/storage/signed-url');

    return {
        /**
         * Upload a file to platform
         * @param {string|Buffer} content - file content, binary or base64 encoded
         * @returns {Promise}
         */
        upload: (content) => {
            if(typeof content === 'string') {
                content = Buffer.from(content, 'base64');
            }
            return request.put({uri: urls.put_url, body: content});
        },
        getDownloadUrl: () => urls.get_url
    };
}

/**
 * Downloads a platform attachment
 * @param {string} url
 * @returns {Promise}
 */
function downloadAttachment(url) {
    const options = {
        method: 'GET',
        uri: url,
        encoding: null
    };

    return request(options);
}