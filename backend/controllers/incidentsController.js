const { pool, getOne, getAll, query } = require('../db/db');
const nodemailer = require('nodemailer');

const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    ignoreTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

async function sendHighCriticalityNotification(incident, vesselName) {
    try {
        if (incident.criticality !== 'Высокая') {
            return;
        }

        const subject = `Создан инцидент высокой критичности: ${incident.title}`;
        const text = `
Создан новый инцидент высокой критичности.

id: ${incident.id}
Название: ${incident.title}
Судно: ${vesselName}
Тип: ${incident.type}
Место: ${incident.placement}
Критичность: ${incident.criticality}
Статус: ${incident.status}
Дата создания: ${incident.created_at}

Описание:
${incident.description || 'Описание отсутствует'}
        `;

        await mailTransporter.sendMail({
            from: `"Система мониторинга инцидентов" <${process.env.MAIL_FROM}>`,
            to: process.env.MAIL_TO,
            subject,
            text,
        });

        console.log(`Уведомление о высокой критичности отправлено для инцидента #${incident.id}`);
    } catch (error) {
        console.error('Ошибка при отправке уведомления:', error.message);
    }
}

async function getIncidents(req, res, next) {
    try {
        const { page = 1, limit = 10, status, criticality, vessel_id, ship } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];

        const filters = [];

        if (req.user.role !== 'admin') {
            filters.push(`i.created_by = $${params.length + 1}`);
            params.push(req.user.id);
        }

        if (status) {
            filters.push(`i.status = $${params.length + 1}`);
            params.push(status);
        }

        if (criticality) {
            filters.push(`i.criticality = $${params.length + 1}`);
            params.push(criticality);
        }

        if (vessel_id) {
            filters.push(`i.vessel_id = $${params.length + 1}`);
            params.push(parseInt(vessel_id));
        }

        if (ship) {
            filters.push(`v.name ILIKE $${params.length + 1}`);
            params.push(`%${ship}%`);
        }

        if (filters.length > 0) {
            whereClause = 'WHERE ' + filters.join(' AND ');
        }

        params.push(parseInt(limit));
        params.push(parseInt(offset));

        const incidents = await getAll(
            `SELECT 
                i.id, i.title, i.description, i.vessel_id, v.name as vessel_name,
                i.type, i.placement, i.criticality, i.status, 
                i.created_by, u.username as created_by_username,
                i.created_at, i.updated_at, i.resolved_at
             FROM incidents i
             LEFT JOIN vessels v ON i.vessel_id = v.id
             LEFT JOIN users u ON i.created_by = u.id
             ${whereClause}
             ORDER BY i.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        const countParams = params.slice(0, -2);
        const countResult = await getOne(
            `SELECT COUNT(*) as total FROM incidents i
             LEFT JOIN vessels v ON i.vessel_id = v.id
             ${whereClause}`,
            countParams
        );

        return res.json({
            incidents,
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

async function getIncidentById(req, res, next) {
    try {
        const { id } = req.params;

        const incident = await getOne(
            `SELECT 
                i.id, i.title, i.description, i.vessel_id, v.name as vessel_name,
                i.type, i.placement, i.criticality, i.status, 
                i.created_by, u.username as created_by_username,
                i.created_at, i.updated_at, i.resolved_at
             FROM incidents i
             LEFT JOIN vessels v ON i.vessel_id = v.id
             LEFT JOIN users u ON i.created_by = u.id
             WHERE i.id = $1`,
            [id]
        );

        if (!incident) {
            return res.status(404).json({error: 'Инцидент не найден'});
        }

        return res.json(incident);
    } catch (error) {
        next(error);
    }
}

async function createIncident(req, res, next) {
    try {
        const {title, vessel_id, type, placement, description, criticality} = req.body;
        if (!title || !vessel_id || !type || !placement || !criticality) {
            return res.status(400).json({ 
                error: 'Требуются: title, vessel_id, type, placement, criticality' 
            });
        }

        const vessel = await getOne('SELECT name FROM vessels WHERE id = $1', [vessel_id]);
        if (!vessel) {
            return res.status(400).json({ error: 'Судно не найдено' });
        }

        const newIncident = await getOne(
            `INSERT INTO incidents 
             (title, vessel_id, type, placement, description, criticality, status, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'Открыт', $7, CURRENT_TIMESTAMP)
             RETURNING id, title, vessel_id, type, placement, description, criticality, status, created_by, created_at, updated_at, resolved_at`,
            [title, vessel_id, type, placement, description || '', criticality, req.user.id]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                req.user.id,
                'CREATE',
                'incident',
                newIncident.id,
                JSON.stringify(newIncident),
                req.ip,
            ]
        );

        await sendHighCriticalityNotification(newIncident, vessel.name);

        return res.status(201).json({
            ...newIncident,
            vessel_name: vessel.name,
        });
    } catch (error) {
        next(error);
    }
}

async function updateIncident(req, res, next) {
    try {
        const {id} = req.params;
        const {title, vessel_id, type, placement, description, criticality, status, resolved_at} = req.body;
        const currentIncident = await getOne(
            'SELECT * FROM incidents WHERE id = $1',
            [id]
        );

        if (!currentIncident) {
            return res.status(404).json({ error: 'Инцидент не найден' });
        }

        if (req.user.role !== 'admin' && req.user.id !== currentIncident.created_by) {
            return res.status(403).json({ error: 'У вас нет прав для изменения этого инцидента' });
        }

        if (vessel_id) {
            const vessel = await getOne('SELECT id FROM vessels WHERE id = $1', [vessel_id]);
            if (!vessel) {
                return res.status(400).json({ error: 'Судно не найдено' });
            }
        }

        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIndex}`);
            params.push(title);
            paramIndex++;
        }
        if (vessel_id !== undefined) {
            updates.push(`vessel_id = $${paramIndex}`);
            params.push(vessel_id);
            paramIndex++;
        }
        if (type !== undefined) {
            updates.push(`type = $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }
        if (placement !== undefined) {
            updates.push(`placement = $${paramIndex}`);
            params.push(placement);
            paramIndex++;
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            params.push(description);
            paramIndex++;
        }
        if (criticality !== undefined) {
            updates.push(`criticality = $${paramIndex}`);
            params.push(criticality);
            paramIndex++;
        }
        if (status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;

            if (status === 'Закрыт' && !resolved_at) {
                updates.push(`resolved_at = CURRENT_TIMESTAMP`);
            }
        }
        if (resolved_at !== undefined && status === 'Закрыт') {
            updates.push(`resolved_at = $${paramIndex}`);
            params.push(resolved_at);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Нет полей для обновления' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const updatedIncident = await getOne(
            `UPDATE incidents 
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex}
             RETURNING *`,
            params
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                'UPDATE',
                'incident',
                id,
                JSON.stringify(currentIncident),
                JSON.stringify(updatedIncident),
                req.ip,
            ]
        );

        return res.json(updatedIncident);
    } catch (error) {
        next(error);
    }
}

async function deleteIncident(req, res, next) {
    try {
        const { id } = req.params;

        const incident = await getOne(
            'SELECT * FROM incidents WHERE id = $1',
            [id]
        );

        if (!incident) {
            return res.status(404).json({ error: 'Инцидент не найден' });
        }

        if (req.user.role !== 'admin' && req.user.id !== incident.created_by) {
            return res.status(403).json({ error: 'У вас нет прав для удаления этого инцидента' });
        }

        await query('DELETE FROM incidents WHERE id = $1', [id]);

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.user.id, 'DELETE', 'incident', id, JSON.stringify(incident), req.ip]
        );

        return res.json({ message: 'Инцидент удалён' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
};
