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
router.get('/scoreboard-semi-final/:paketId', adminController.getScoreboardSemiFinal);

router.post('/pause', verifyToken, isAdmin, adminController.togglePauseGame);

router.post('/paket/:paketId/reset', verifyToken, isAdmin, adminController.resetPaketTesting);

router.post('/inisialisasi-semi-final', adminController.inisialisasiSemiFinal);

router.post('/next-soal', adminController.nextSoal);

router.post('/inisialisasi-final', adminController.inisialisasiFinal);
router.post('/input-nilai-juri', adminController.inputNilaiJuri);
router.post('/nilai-tambahan-semifinal', adminController.inputNilaiTambahanSemiFinal);

router.post('/reset-semifinal-full', adminController.resetSemiFinalFull);
router.post('/reset-final-full', adminController.resetFinalFull);

router.post('/bel-reset', adminController.belReset);

export default router;