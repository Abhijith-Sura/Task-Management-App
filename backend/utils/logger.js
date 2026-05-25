/**
 * Outputs a formatted log message to the console.
 *
 * @param {string} message - The message content to be logged.
 */
export const logger = (message) => {
    // Prefix the log output to distinguish application logs from standard stdout
    console.log(`[LOG]: ${message}`);
}