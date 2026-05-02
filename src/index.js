import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import authRoutes     from './routes/authRoutes.js';
import perfilesRoutes from './routes/perfilesRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import clientesRoutes from './routes/clientesRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// API
app.use('/api/auth',     authRoutes);
app.use('/api/perfiles', perfilesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);

// Páginas
app.get('/', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/dashboard.html', (req, res) => res.sendFile(__dirname + '/public/dashboard.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
