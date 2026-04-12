import express from 'express';
import { pesertaController } from '../controllers/pesertaController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', upload.single('foto'), pesertaController.registerTim);

export default router;