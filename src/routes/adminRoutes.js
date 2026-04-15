import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(verifyToken, isAdmin);

router.post('/tim', upload.single('fotoTim'), adminController.createTim);

router.get('/paket', adminController.getPaketSoal);
router.get('/paket/:paketId/soal', adminController.getSoalByPaket);

router.get('/soal/:id', adminController.getSoalById);
router.put('/soal/:id', adminController.updateSoal);
router.post('/paket/:paketId/mulai', adminController.mulaiPaketCerdas);
router.get('/dashboard-live', adminController.getDashboardLive);

export default router;