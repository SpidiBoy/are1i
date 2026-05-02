import bcrypt from 'bcryptjs';
import { pool } from '../config/bd.js';

// GET /api/usuarios
export const getUsuarios = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id_usuario, u.nombre, u.apellido, u.username, u.email,
                   u.alias_asesor, u.estado, u.created_at,
                   p.nombre AS perfil
            FROM usuarios u
            JOIN perfiles p ON p.id_perfil = u.id_perfil
            WHERE u.estado != 2
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// POST /api/usuarios
export const createUsuario = async (req, res) => {
    const { nombre, apellido, username, email, password, id_perfil, alias_asesor } = req.body;
    if (!nombre || !apellido || !username || !email || !password || !id_perfil)
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    try {
        const existe = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE username=$1 OR email=$2',
            [username, email]
        );
        if (existe.rows.length > 0)
            return res.status(409).json({ message: 'Username o email ya existe' });

        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO usuarios (id_perfil, nombre, apellido, username, email, password_hash, alias_asesor, creado_por)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_usuario, nombre, apellido, username, email, estado`,
            [id_perfil, nombre.trim(), apellido.trim(), username.trim(), email.trim(), hash, alias_asesor || null, req.usuario.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

// PUT /api/usuarios/:id
export const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, id_perfil, alias_asesor, estado, password } = req.body;
    try {
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await pool.query(
                `UPDATE usuarios SET nombre=$1, apellido=$2, email=$3, id_perfil=$4,
                 alias_asesor=$5, estado=$6, password_hash=$7 WHERE id_usuario=$8`,
                [nombre, apellido, email, id_perfil, alias_asesor || null, estado ?? 1, hash, id]
            );
        } else {
            await pool.query(
                `UPDATE usuarios SET nombre=$1, apellido=$2, email=$3, id_perfil=$4,
                 alias_asesor=$5, estado=$6 WHERE id_usuario=$7`,
                [nombre, apellido, email, id_perfil, alias_asesor || null, estado ?? 1, id]
            );
        }
        res.json({ message: 'Usuario actualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

// DELETE /api/usuarios/:id (soft delete)
export const deleteUsuario = async (req, res) => {
    const { id } = req.params;
    if (Number(id) === req.usuario.id)
        return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
    try {
        const result = await pool.query(
            `UPDATE usuarios SET estado=2, eliminado_por=$1 WHERE id_usuario=$2 RETURNING id_usuario`,
            [req.usuario.id, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};
