// controllers/crewController.js
const { pool, getOne, getAll, query } = require('../db/db');

async function getPositions(req, res, next) {
    try {
        const positions = await getAll(
            `SELECT id, name, description, created_at, updated_at
             FROM positions
             ORDER BY name ASC`
        );

        return res.json(positions);
    } catch (error) {
        next(error);
    }
}

async function createPosition(req, res, next) {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Название должности обязательно' });
        }

        const existing = await getOne(
            'SELECT id FROM positions WHERE name = $1',
            [name]
        );

        if (existing) {
            return res.status(409).json({ error: 'Должность с таким названием уже существует' });
        }

        const position = await getOne(
            `INSERT INTO positions (name, description, created_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             RETURNING id, name, description, created_at, updated_at`,
            [name, description || null]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.user.id, 'CREATE', 'position', position.id, JSON.stringify(position), req.ip]
        );

        return res.status(201).json(position);
    } catch (error) {
        next(error);
    }
}

async function getVesselCrew(req, res, next) {
    try {
        const { vessel_id } = req.params;

        const crew = await getAll(
            `SELECT 
                cm.id, cm.vessel_id, cm.position_id, cm.first_name, cm.last_name, cm.patronymic,
                cm.passport_number, cm.nationality, cm.date_of_birth, cm.is_active,
                p.name as position_name,
                v.name as vessel_name,
                cm.created_at, cm.updated_at
             FROM crew_members cm
             LEFT JOIN positions p ON cm.position_id = p.id
             LEFT JOIN vessels v ON cm.vessel_id = v.id
             WHERE cm.vessel_id = $1
             ORDER BY cm.last_name ASC`,
            [vessel_id]
        );

        return res.json(crew);
    } catch (error) {
        next(error);
    }
}

async function getCrewMember(req, res, next) {
    try {
        const { id } = req.params;

        const member = await getOne(
            `SELECT 
                cm.id, cm.vessel_id, cm.position_id, cm.first_name, cm.last_name, cm.patronymic,
                cm.passport_number, cm.nationality, cm.date_of_birth, cm.is_active,
                p.name as position_name,
                v.name as vessel_name,
                cm.created_at, cm.updated_at
             FROM crew_members cm
             LEFT JOIN positions p ON cm.position_id = p.id
             LEFT JOIN vessels v ON cm.vessel_id = v.id
             WHERE cm.id = $1`,
            [id]
        );

        if (!member) {
            return res.status(404).json({ error: 'Член экипажа не найден' });
        }

        return res.json(member);
    } catch (error) {
        next(error);
    }
}

async function addCrewMember(req, res, next) {
    try {
        const { vessel_id, position_id, first_name, last_name, patronymic, passport_number, nationality, date_of_birth} = req.body;

        if (!vessel_id || !position_id || !first_name || !last_name) {
            return res.status(400).json({ 
                error: 'Требуются: vessel_id, position_id, first_name, last_name' 
            });
        }

        const vessel = await getOne('SELECT id FROM vessels WHERE id = $1', [vessel_id]);
        if (!vessel) {
            return res.status(400).json({ error: 'Судно не найдено' });
        }

        const position = await getOne('SELECT id FROM positions WHERE id = $1', [position_id]);
        if (!position) {
            return res.status(400).json({ error: 'Должность не найдена' });
        }

        const member = await getOne(
            `INSERT INTO crew_members (vessel_id, position_id, first_name, last_name, patronymic, passport_number, nationality, date_of_birth, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             RETURNING id, vessel_id, position_id, first_name, last_name, patronymic, passport_number, nationality, date_of_birth, is_active, created_at`,
            [vessel_id, position_id, first_name, last_name, patronymic || null, passport_number || null, nationality || null, date_of_birth || null]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.user.id, 'CREATE', 'crew_member', member.id, JSON.stringify(member), req.ip]
        );

        return res.status(201).json(member);
    } catch (error) {
        next(error);
    }
}

async function updateCrewMember(req, res, next) {
    try {
        const { id } = req.params;
        const { position_id, first_name, last_name, patronymic, passport_number, nationality, date_of_birth, is_active } = req.body;

        const existing = await getOne('SELECT * FROM crew_members WHERE id = $1', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Член экипажа не найден' });
        }

        if (position_id) {
            const position = await getOne('SELECT id FROM positions WHERE id = $1', [position_id]);
            if (!position) {
                return res.status(400).json({ error: 'Должность не найдена' });
            }
        }

        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (position_id !== undefined) {
            updates.push(`position_id = $${paramIndex}`);
            params.push(position_id);
            paramIndex++;
        }
        if (first_name !== undefined) {
            updates.push(`first_name = $${paramIndex}`);
            params.push(first_name);
            paramIndex++;
        }
        if (last_name !== undefined) {
            updates.push(`last_name = $${paramIndex}`);
            params.push(last_name);
            paramIndex++;
        }
        if (patronymic !== undefined) {
            updates.push(`patronymic = $${paramIndex}`);
            params.push(patronymic);
            paramIndex++;
        }
        if (passport_number !== undefined) {
            updates.push(`passport_number = $${paramIndex}`);
            params.push(passport_number);
            paramIndex++;
        }
        if (nationality !== undefined) {
            updates.push(`nationality = $${paramIndex}`);
            params.push(nationality);
            paramIndex++;
        }
        if (date_of_birth !== undefined) {
            updates.push(`date_of_birth = $${paramIndex}`);
            params.push(date_of_birth);
            paramIndex++;
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex}`);
            params.push(is_active);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Нет полей для обновления' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const member = await getOne(
            `UPDATE crew_members SET ${updates.join(', ')} WHERE id = $${paramIndex}
             RETURNING id, vessel_id, position_id, first_name, last_name, patronymic, passport_number, nationality, date_of_birth, is_active, updated_at`,
            params
        );

        // Логирование
        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [req.user.id, 'UPDATE', 'crew_member', id, JSON.stringify(existing), JSON.stringify(member), req.ip]
        );

        return res.json(member);
    } catch (error) {
        next(error);
    }
}

async function deleteCrewMember(req, res, next) {
    try {
        const { id } = req.params;

        const member = await getOne('SELECT * FROM crew_members WHERE id = $1', [id]);
        if (!member) {
            return res.status(404).json({ error: 'Член экипажа не найден' });
        }

        await query('DELETE FROM crew_members WHERE id = $1', [id]);

        // Логирование
        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.user.id, 'DELETE', 'crew_member', id, JSON.stringify(member), req.ip]
        );

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPositions,
    createPosition,
    getVesselCrew,
    getCrewMember,
    addCrewMember,
    updateCrewMember,
    deleteCrewMember,
};
