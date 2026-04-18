const util = require('util');
const fs = require('fs');
const Path = require('path');
const { chalk, color, bgcolor } = require('./color');
require('dotenv').config();


// Environment Variables Required:
//    - SAVE_LOGGER: Set to 'true' to enable logging to file, otherwise logs will only be printed to console
const SAVE_LOGGER = ['true', 'True'].includes(process.env.SAVE_LOGS);


// -------- Logger directory --------
let directory_log_name = "history-logs";
let directory_log_path = Path.join(process.cwd(), directory_log_name);

// Use for saving logs of message history for discord channels (if SAVE_LOGGER is true),
// So we can keep track of message history in case of bot restarts or crashes.
if (SAVE_LOGGER) {
    directory_log_name = "discord-logs";
    directory_log_path = Path.join(process.cwd(), directory_log_name);
};

// Create the log directory if it doesn't exist
if (!fs.existsSync(directory_log_path)) {
    // Use for saving logs of bot activities, such as message received, message sent, errors, etc.
    fs.mkdirSync(directory_log_path);
};

// -------- Logger Levels --------
const logLevels = {
    'info': { color: chalk.green, label: 'INFO' },
    'warn': { color: chalk.yellow, label: 'WARN' },
    'error': { color: chalk.red, label: 'ERROR' }
};

// --------- My Functionality ---------
const getLocalISOString = (date) => {
    const offset = -date.getTimezoneOffset();
    const diff = offset >= 0 ? '+' : '-';
    const pad = (num) => String(num).padStart(2, '0');

    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        diff + pad(Math.floor(Math.abs(offset) / 60)) +
        ':' + pad(Math.abs(offset) % 60);
};


// --------- Logger Functionality --------
/**
 * 
 * @param {string} options.logFilePath - Path to the log file where logs will be saved (if save_logger is true)
 * @param {boolean} options.use_color - Whether to use colored output in the console
 * @param {boolean} options.use_iso_date - Whether to prepend ISO date format timestamps to logs
 * @param {boolean} options.save_logger - Whether to save logs to a file specified by logFilePath 
 * @returns 
 */
const loggerSetup = (options = {}) => {
    let timeDate = new Date().toISOString().split('T')[0];  // Format: YYYY-MM-DD
    let filename_log = `logger ${timeDate}.log`;    // Format: logger YYYY-MM-DD.log
    // options.logLevel = options.logLevel || 'info';
    options.logFilePath = options.logFilePath || Path.join(directory_log_path, filename_log);
    options.use_color = options.use_color || false;
    options.use_iso_date = options.use_iso_date || false;
    options.save_logger = options.save_logger || false;
    
    // Create a logger function that writes logs to a file and prints to console with optional color formatting
    /**
     * @param {...any} arguments - The log message and optional formatting parameters
     * @return {void} - This function does not return anything, it only performs logging actions
     */
    let logger = function () {
        let log_ = util.format.apply(null, arguments, { color: options.use_color });
        let dateIsoString = getLocalISOString(new Date());
        log_ = options.use_iso_date ? `${color(`[${dateIsoString}]:`, "magenta")} ${log_}` : log_;
        if (options.save_logger) {
            let fileStreamLogs = fs.createWriteStream(options.logFilePath, { flags: 'a' });
            let logForFile = log_.replace(/\x1b\[[0-9;]*m/g, '');   // Remove ANSI color codes for file logging
            fileStreamLogs.write(logForFile + "\n");    // Write a log as text.
        };
        process.stdout.write(log_ + "\n");          // Write a log as terminal.
    };
    return { logger };
};


// const logger = loggerSetup({
//     logLevel: 'info', // Possible values: 'info', 'warn', 'error'
//     logFilePath: Path.join(directory_log_path, `logger ${new Date().toISOString().split('T')[0]}.log`), // Default log file path with date
//     use_color: true, // Enable colored output in console
//     use_iso_date: true // Use ISO date format for timestamps
//     save_logger: SAVE_LOGS // Enable saving logs to file based on environment variable,
// });


// Export the logger function
module.exports = {
    loggerSetup,
    logLevels
};