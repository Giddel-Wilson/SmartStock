const db = require('../config/database');

const logActivity = async (userId, action, entityType, entityId = null, details = {}, req = null) => {
    try {
        const ip = req ? req.ip || req.connection.remoteAddress : null;
        const userAgent = req ? req.get('User-Agent') : null;

        await db.query(`
            INSERT INTO activity_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [userId, action, entityType, entityId, JSON.stringify(details), ip, userAgent]);
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error to avoid breaking the main operation
    }
};

const activityLogger = (action, entityType) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                const entityId = req.params.id || (typeof data === 'string' ? JSON.parse(data)?.id : data?.id);
                logActivity(req.user.id, action, entityType, entityId, {
                    method: req.method,
                    url: req.originalUrl,
                    body: req.method !== 'GET' ? req.body : undefined
                }, req);
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = { logActivity, activityLogger };
