const messages = require('elasticio-node').messages;

module.exports = {
    eioModule: eioModule,
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

    return Object.assign({
        init: defaultFn,
        startup: defaultFn,
        shutdown: defaultFn,
        process: eioProcess(process)
    }, mod);
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
        Object.assign(this, messages, {
            parseCsvInput
        });
        return Promise.resolve(process.call(this, msg, cfg, snapshot));
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