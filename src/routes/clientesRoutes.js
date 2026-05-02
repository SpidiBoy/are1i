import { Router } from 'express';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../controllers/clientesController.js';
import { verificarToken } from '../middleware/verificarToken.js';

const router = Router();
router.use(verificarToken);

router.get('/',        getClientes);
router.post('/',       createCliente);
router.put('/:id',     updateCliente);
router.delete('/:id',  deleteCliente);

export default router;
