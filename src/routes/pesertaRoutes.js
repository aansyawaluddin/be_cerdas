import express from 'express';
import { pesertaController } from '../controllers/pesertaController.js';
import { verifyToken, isPeserta } from '../middleware/auth.js';

const router = express.Router();

router.get('/info', verifyToken, pesertaController.getInformasiTim);

// Form Fase Strategi
router.get('/strategi/:paketId', verifyToken, pesertaController.getSoalStrategi);
router.post('/submit-strategi', verifyToken, pesertaController.submitStrategi);

// Penayangan & Menjawab Soal
router.get('/soal-aktif', verifyToken, pesertaController.getSoalAktif);
router.post('/submit-jawaban', verifyToken, pesertaController.submitJawaban);

router.post('/tekan-bel', verifyToken, isPeserta, pesertaController.tekanBel);

router.get('/leaderboard', verifyToken, pesertaController.getLeaderboardTahapAktif);

export default router;