import { pool } from '../config/bd.js';
import { v4 as uuidv4 } from 'uuid';

// GET /api/clientes
export const getClientes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.id_cliente, c.dni, c.nombre, c.apellido, c.telefono,
                   c.fecha_nacimiento, c.fecha_registro, c.activo, c.created_at,
                   u.nombre || ' ' || u.apellido AS registrado_por
            FROM cliente c
            JOIN usuarios u ON u.id_usuario = c.id_usuario_reg
            WHERE c.deleted_at IS NULL
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
};

// POST /api/clientes
export const createCliente = async (req, res) => {
    const { dni, nombre, apellido, telefono, fecha_nacimiento } = req.body;
    if (!dni || !nombre || !apellido)
        return res.status(400).json({ message: 'DNI, nombre y apellido son requeridos' });
    try {
        const existe = await pool.query('SELECT id_cliente FROM cliente WHERE dni=$1', [dni]);
        if (existe.rows.length > 0)
            return res.status(409).json({ message: 'Ya existe un cliente con ese DNI' });

        const qr_code = uuidv4();
        const result = await pool.query(
            `INSERT INTO cliente (id_usuario_reg, dni, nombre, apellido, telefono, fecha_nacimiento, qr_code, creado_por)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [req.usuario.id, dni.trim(), nombre.trim(), apellido.trim(),
             telefono || null, fecha_nacimiento || null, qr_code, req.usuario.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear cliente' });
    }
};

// PUT /api/clientes/:id
export const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, telefono, fecha_nacimiento, activo } = req.body;
    try {
        const result = await pool.query(
            `UPDATE cliente SET nombre=$1, apellido=$2, telefono=$3,
             fecha_nacimiento=$4, activo=$5
             WHERE id_cliente=$6 RETURNING *`,
            [nombre, apellido, telefono || null, fecha_nacimiento || null, activo ?? true, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar cliente' });
    }
};

// DELETE /api/clientes/:id (soft delete)
export const deleteCliente = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE cliente SET activo=false, eliminado_por=$1, deleted_at=NOW()
             WHERE id_cliente=$2 RETURNING id_cliente`,
            [req.usuario.id, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
        res.json({ message: 'Cliente eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar cliente' });
    }
};
