const bcrypt = require('bcrypt');
const { pool, getOne, getAll, query } = require('../db/db');
const { generateToken, generateRefreshToken } = require('../middlewares/jwtAuth');

async function register(req, res, next) {
    try {
        const { username, email, password, first_name, last_name, patronymic } = req.body;

        if (!username || !email || !password || !first_name || !last_name) {
            return res.status(400).json({ error: 'Требуются username, email, password, first_name и last_name' });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({ error: 'Username должен содержать от 3 до 50 символов' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
        }

        const existingUser = await getOne(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser) {
            return res.status(409).json({ error: 'Пользователь с таким username или email уже существует' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await getOne(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, patronymic, role)
             VALUES ($1, $2, $3, $4, $5, $6, 'user')
             RETURNING id, username, email, first_name, last_name, patronymic, role, created_at`,
            [username, email, passwordHash, first_name, last_name, patronymic || null]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                null,
                'REGISTER',
                'user',
                newUser.id,
                JSON.stringify({ username, email, role: 'user' }),
                req.ip,
            ]
        );

        return res.status(201).json({
            message: 'Регистрация успешна',
            user: newUser,
        });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Требуются username и password' });
        }

        const user = await getOne(
            'SELECT id, username, email, password_hash, first_name, last_name, patronymic, role, is_active FROM users WHERE username = $1',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Аккаунт деактивирован' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, ip_address)
             VALUES ($1, $2, $3, $4)`,
            [user.id, 'LOGIN', 'user', req.ip]
        );

        return res.json({
            message: 'Вход выполнен успешно',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                patronymic: user.patronymic,
                role: user.role,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        next(error);
    }
}

async function refreshAccessToken(req, res, next) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh токен требуется' });
        }

        const jwt = require('jsonwebtoken');
        
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            const user = await getOne(
                'SELECT id, username, email, first_name, last_name, patronymic, role FROM users WHERE id = $1 AND is_active = true',
                [decoded.id]
            );

            if (!user) {
                return res.status(401).json({ error: 'Пользователь не найден' });
            }

            const newAccessToken = generateToken(user);
            
            return res.json({
                accessToken: newAccessToken,
            });
        } catch (tokenError) {
            return res.status(401).json({ error: 'Неверный refresh токен' });
        }
    } catch (error) {
        next(error);
    }
}

async function getProfile(req, res, next) {
    try {
        const user = await getOne(
            'SELECT id, username, email, first_name, last_name, patronymic, role, is_active, created_at, last_login FROM users WHERE id = $1',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        return res.json(user);
    } catch (error) {
        next(error);
    }
}

async function updateProfile(req, res, next) {
    try {
        const { first_name, last_name, patronymic, email } = req.body;

        if (email) {
            const existingUser = await getOne(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, req.user.id]
            );

            if (existingUser) {
                return res.status(409).json({ error: 'Email уже используется' });
            }
        }

        const updatedUser = await getOne(
            `UPDATE users 
             SET first_name = COALESCE($1, first_name), 
                 last_name = COALESCE($2, last_name),
                 patronymic = COALESCE($3, patronymic),
                 email = COALESCE($4, email),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING id, username, email, first_name, last_name, patronymic, role, is_active, created_at, updated_at`,
            [first_name || null, last_name || null, patronymic || null, email || null, req.user.id]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                req.user.id,
                'UPDATE',
                'user',
                req.user.id,
                JSON.stringify({ first_name, last_name, patronymic, email }),
                req.ip,
            ]
        );

        return res.json({
            message: 'Профиль обновлён',
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

async function changePassword(req, res, next) {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({error: 'Требуются старый и новый пароль'});
        }

        if (newPassword.length < 6) {
            return res.status(400).json({error: 'Новый пароль должен содержать минимум 6 символов' });
        }

        const user = await getOne(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newPasswordHash, req.user.id]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'CHANGE_PASSWORD', 'user', req.user.id, req.ip]
        );

        return res.json({ message: 'Пароль изменён успешно' });
    } catch (error) {
        next(error);
    }
}

async function getAllUsers(req, res, next) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const users = await getAll(
            `SELECT id, username, email, full_name, role, is_active, created_at, last_login
             FROM users
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await getOne('SELECT COUNT(*) as total FROM users');

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

module.exports = {
    register,
    login,
    refreshAccessToken,
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
};
