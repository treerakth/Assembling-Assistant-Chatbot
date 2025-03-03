const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Define the log directory
const logDir = path.join(__dirname, 'logs');

// Ensure the log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Get the current date as a string (e.g., "2024-08-13")
const currentDate = new Date().toISOString().split('T')[0];

// Define the path for the current log file
const logFilePath = path.join(logDir, `log-backup-${currentDate}.log`);

// Configure the Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: logFilePath }) // Log to the daily log file
    ]
});

// Capture program exit (e.g., via Ctrl+C) and log a message with a blank line before it
process.on('SIGINT', () => {
    logger.info(''); // Log a blank line
    logger.info('The program has stopped due to SIGINT (Ctrl+C).');
    process.exit();
});

// Capture uncaught exceptions and unhandled rejections to log before exit
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    logger.info('The program has stopped due to an uncaught exception.');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    logger.info('The program has stopped due to an unhandled rejection.');
    process.exit(1);
});

// Export the logger
module.exports = logger;
