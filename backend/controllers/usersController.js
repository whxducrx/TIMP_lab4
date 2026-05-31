const { pool, getOne, getAll, query } = require('../db/db');

async function getAllUsers(req, res, next) {
    try {
        const { page = 1, limit = 10, role } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];

        if (role) {
            whereClause = 'WHERE role = $1';
            params.push(role);
        }

        const users = await getAll(
            `SELECT id, username, email, first_name, last_name, role, is_active, created_at, last_login
             FROM users
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        const countResult = await getOne(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            params
        );

        return res.json({
            users,
            pagination: {
                total: parseInt(countResult.total),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult.total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
}

async function getUserById(req, res, next) {
    try {
        const { id } = req.params;

        const user = await getOne(
            `SELECT id, username, email, first_name, last_name, patronymic, role, is_active, created_at, last_login
             FROM users WHERE id = $1`,
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        return res.json(user);
    } catch (error) {
        next(error);
    }
}

async function changeUserRole(req, res, next) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Неверная роль. Допустимые: user, admin' });
        }

        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ error: 'Вы не можете менять собственную роль' });
        }

        const user = await getOne(
            'SELECT id, role FROM users WHERE id = $1',
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const oldRole = user.role;

        const updatedUser = await getOne(
            `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
             RETURNING id, username, email, first_name, last_name, role, is_active`,
            [role, id]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                'ROLE_CHANGE',
                'user',
                id,
                JSON.stringify({ role: oldRole }),
                JSON.stringify({ role }),
                req.ip,
            ]
        );

        return res.json({
            message: 'Роль пользователя изменена',
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

async function deactivateUser(req, res, next) {
    try {
        const { id } = req.params;

        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ error: 'Вы не можете деактивировать собственный аккаунт' });
        }

        const user = await getOne(
            'SELECT id, is_active FROM users WHERE id = $1',
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const updatedUser = await getOne(
            `UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1
             RETURNING id, username, email, is_active`,
            [id]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                req.user.id,
                'USER_DEACTIVATE',
                'user',
                id,
                JSON.stringify({ is_active: false }),
                req.ip,
            ]
        );

        return res.json({
            message: 'Пользователь деактивирован',
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

async function activateUser(req, res, next) {
    try {
        const { id } = req.params;

        const user = await getOne(
            'SELECT id, is_active FROM users WHERE id = $1',
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const updatedUser = await getOne(
            `UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1
             RETURNING id, username, email, is_active`,
            [id]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                req.user.id,
                'USER_ACTIVATE',
                'user',
                id,
                JSON.stringify({ is_active: true }),
                req.ip,
            ]
        );

        return res.json({
            message: 'Пользователь активирован',
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    changeUserRole,
    deactivateUser,
    activateUser,
};
