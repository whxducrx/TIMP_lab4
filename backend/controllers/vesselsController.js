const { getOne, getAll, query } = require('../db/db');

async function getVessels(req, res, next) {
    try {
        const vessels = await getAll(
            `SELECT id, name, imo_number, type, flag, built_year, description, created_at, updated_at
             FROM vessels
             ORDER BY name ASC`
        );

        return res.json(vessels);
    } catch (error) {
        next(error);
    }
}

async function getVesselById(req, res, next) {
    try {
        const { id } = req.params;

        const vessel = await getOne(
            `SELECT id, name, imo_number, type, flag, built_year, description, created_at, updated_at
             FROM vessels
             WHERE id = $1`,
            [id]
        );

        if (!vessel) {
            return res.status(404).json({ error: 'Судно не найдено' });
        }

        return res.json(vessel);
    } catch (error) {
        next(error);
    }
}

async function createVessel(req, res, next) {
    try {
        const { name, imo_number, type, flag, built_year, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Название судна требуется' });
        }

        const existing = await getOne('SELECT id FROM vessels WHERE name = $1', [name]);
        if (existing) {
            return res.status(409).json({ error: 'Судно с таким названием уже существует' });
        }

        const newVessel = await getOne(
            `INSERT INTO vessels (name, imo_number, type, flag, built_year, description, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             RETURNING id, name, imo_number, type, flag, built_year, description, created_at, updated_at`,
            [name, imo_number || null, type || null, flag || null, built_year || null, description || null]
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                req.user.id,
                'CREATE',
                'vessel',
                newVessel.id,
                JSON.stringify(newVessel),
                req.ip,
            ]
        );

        return res.status(201).json(newVessel);
    } catch (error) {
        next(error);
    }
}

async function updateVessel(req, res, next) {
    try {
        const { id } = req.params;
        const { name, imo_number, type, flag, built_year, description } = req.body;

        const currentVessel = await getOne('SELECT * FROM vessels WHERE id = $1', [id]);
        if (!currentVessel) {
            return res.status(404).json({ error: 'Судно не найдено' });
        }

        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (name !== undefined) {
            const existing = await getOne(
                'SELECT id FROM vessels WHERE name = $1 AND id != $2',
                [name, id]
            );
            if (existing) {
                return res.status(409).json({ error: 'Судно с таким названием уже существует' });
            }
            updates.push(`name = $${paramIndex}`);
            params.push(name);
            paramIndex++;
        }
        if (imo_number !== undefined) {
            updates.push(`imo_number = $${paramIndex}`);
            params.push(imo_number || null);
            paramIndex++;
        }
        if (type !== undefined) {
            updates.push(`type = $${paramIndex}`);
            params.push(type || null);
            paramIndex++;
        }
        if (flag !== undefined) {
            updates.push(`flag = $${paramIndex}`);
            params.push(flag || null);
            paramIndex++;
        }
        if (built_year !== undefined) {
            updates.push(`built_year = $${paramIndex}`);
            params.push(built_year || null);
            paramIndex++;
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            params.push(description || null);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Нет полей для обновления' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const updatedVessel = await getOne(
            `UPDATE vessels 
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex}
             RETURNING id, name, imo_number, type, flag, built_year, description, created_at, updated_at`,
            params
        );

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                'UPDATE',
                'vessel',
                id,
                JSON.stringify(currentVessel),
                JSON.stringify(updatedVessel),
                req.ip,
            ]
        );

        return res.json(updatedVessel);
    } catch (error) {
        next(error);
    }
}

async function deleteVessel(req, res, next) {
    try {
        const {id} = req.params;

        const vessel = await getOne('SELECT * FROM vessels WHERE id = $1', [id]);
        if (!vessel) {
            return res.status(404).json({ error: 'Судно не найдено' });
        }

        const incidentsCount = await getOne(
            'SELECT COUNT(*) as count FROM incidents WHERE vessel_id = $1',
            [id]
        );

        if (parseInt(incidentsCount.count) > 0) {
            return res.status(409).json({ 
                error: 'Невозможно удалить судно. Существуют связанные инциденты.' 
            });
        }

        await query('DELETE FROM vessels WHERE id = $1', [id]);

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.user.id, 'DELETE', 'vessel', id, JSON.stringify(vessel), req.ip]
        );

        return res.json({ message: 'Судно удалено' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getVessels,
    getVesselById,
    createVessel,
    updateVessel,
    deleteVessel,
};
