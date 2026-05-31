const fs = require('fs').promises;
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

async function ensureLogsDir() {
    try {
        await fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
        console.error('error create logs dir:', error);
    }
}

async function logError(error, req, userId) {
    try {
        await ensureLogsDir();
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            userId: userId || null,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            error: error.message,
            stack: error.stack,
            body: req.body,
        };

        const logFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
        await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        
        console.error(`[ERROR] ${timestamp}:`, error.message);
    } catch (logError) {
        console.error('failed to log error:', logError);
    }
}

function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Внутренняя ошибка сервера';

    logError(err, req, req.user?.id);

    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(statusCode).json({
        error: message,
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString(),
    });
}

function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Эндпоинт не найден',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
    });
}

module.exports = {
    errorHandler,
    notFoundHandler,
    logError,
};
