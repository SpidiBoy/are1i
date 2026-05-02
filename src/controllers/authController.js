import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/bd.js';

export const login = async (req, res) => {
    const { username, password } = req.body;

    // Validar que lleguen los campos
    if (!username || !password) {
        return res.status(400).json({ 
            message: 'Usuario y contraseña son requeridos' 
        });
    }

    try {
        // Buscar usuario activo con su perfil
        const result = await pool.query(
            `SELECT u.*, p.nombre AS perfil
             FROM usuarios u
             JOIN perfiles p ON u.id_perfil = p.id_perfil
             WHERE u.username = $1 
               AND u.estado = 1 
               AND u.deleted_at IS NULL`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                message: 'Usuario o contraseña incorrectos' 
            });
        }

        const usuario = result.rows[0];

        // Comparar contraseña con el hash
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ 
                message: 'Usuario o contraseña incorrectos' 
            });
        }

        // Generar JWT con datos útiles
        const token = jwt.sign(
            { 
                id:       usuario.id_usuario,
                username: usuario.username,
                perfil:   usuario.perfil,
                nombre:   usuario.nombre
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.status(200).json({
            token,
            usuario: {
                nombre:   usuario.nombre,
                apellido: usuario.apellido,
                username: usuario.username,
                perfil:   usuario.perfil
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};