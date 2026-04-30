const EventEmitter = require("events");

class AppEventEmitter extends EventEmitter {}

const appEventEmitter = new AppEventEmitter();

module.exports = appEventEmitter;
