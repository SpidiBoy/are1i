import { pool } from '../config/bd.js';

// GET /api/perfiles
export const getPerfiles = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id_perfil, nombre, descripcion, estado, created_at
            FROM perfiles
            WHERE estado != 2
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener perfiles' });
    }
};

// POST /api/perfiles
export const createPerfil = async (req, res) => {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ message: 'El nombre es requerido' });
    try {
        const result = await pool.query(
            `INSERT INTO perfiles (nombre, descripcion, creado_por)
             VALUES ($1, $2, $3) RETURNING *`,
            [nombre.trim(), descripcion || null, req.usuario.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear perfil' });
    }
};

// PUT /api/perfiles/:id
export const updatePerfil = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;
    try {
        const result = await pool.query(
            `UPDATE perfiles SET nombre=$1, descripcion=$2, estado=$3
             WHERE id_perfil=$4 RETURNING *`,
            [nombre, descripcion || null, estado ?? 1, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Perfil no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar perfil' });
    }
};

// DELETE /api/perfiles/:id (soft delete: estado=2)
export const deletePerfil = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE perfiles SET estado=2, eliminado_por=$1 WHERE id_perfil=$2 RETURNING id_perfil`,
            [req.usuario.id, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Perfil no encontrado' });
        res.json({ message: 'Perfil eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar perfil' });
    }
};
