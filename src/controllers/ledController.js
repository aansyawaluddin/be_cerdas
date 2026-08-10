import prisma from '../utils/prisma.js';
import { getGameState } from '../sockets/gameHandler.js';

export const ledController = {
    getLiveGameState: async (req, res) => {
        try {
            const gameState = getGameState();
            const DURASI = parseInt(process.env.DURASI_SOAL) || 180;

            let sisaWaktu = gameState.sisaWaktu;
            let isTanpaWaktu = false;
            let dataSoal = null;
            let daftarTim = [];
            let babakAktif = null;
            let paketNama = null;

            if (gameState.paketAktifId) {
                const paket = await prisma.paketSoal.findUnique({
                    where: { id: parseInt(gameState.paketAktifId) }
                });
                if (paket) {
                    babakAktif = paket.babak;
                    paketNama = paket.nama;
                }
            }

            const soalAktif = await prisma.soal.findFirst({
                where: { status: 'aktif' },
                include: { paketSoal: true }
            });

            if (soalAktif) {
                babakAktif = soalAktif.paketSoal.babak;
                paketNama = soalAktif.paketSoal.nama;

                if (babakAktif === 'final' && (paketNama.toLowerCase().includes('game 4') || paketNama.toLowerCase().includes('case'))) {
                    sisaWaktu = 0;
                    isTanpaWaktu = true;
                } else {
                    if (gameState.soalAktifId === soalAktif.id) {
                        sisaWaktu = gameState.sisaWaktu;
                    } else if (soalAktif.waktuMulai) {
                        const selisihDetik = Math.floor((new Date().getTime() - soalAktif.waktuMulai.getTime()) / 1000);
                        sisaWaktu = Math.max(0, DURASI - selisihDetik);
                    }
                }

                const totalSoalSebelumnya = await prisma.soal.count({
                    where: { paketSoalId: soalAktif.paketSoalId, id: { lt: soalAktif.id } }
                });
                const nomorSoal = totalSoalSebelumnya + 1;
                const totalSoal = await prisma.soal.count({ where: { paketSoalId: soalAktif.paketSoalId } });

                dataSoal = {
                    id: soalAktif.id,
                    pertanyaan: soalAktif.pertanyaan,
                    foto: soalAktif.foto,
                    kategori: soalAktif.kategori,
                    tipe: soalAktif.tipe,
                    opsiJawaban: soalAktif.opsiJawaban,
                    paketNama: soalAktif.paketSoal.nama,
                    babak: soalAktif.paketSoal.babak,
                    faseAktif: gameState.faseAktif || 'soal',
                    nomorSoal: nomorSoal,
                    totalSoal: totalSoal,
                };

                if (soalAktif.tipe === 'memori') {
                    if (gameState.faseAktif === 'memori_gambar') {
                        dataSoal.pertanyaan = "Silakan amati gambar berikut dengan saksama!";
                        dataSoal.opsiJawaban = null;
                    } else if (gameState.faseAktif === 'memori_jeda') {
                        dataSoal.foto = null;
                        dataSoal.pertanyaan = "Bersiaplah...";
                        dataSoal.opsiJawaban = null;
                    } else if (gameState.faseAktif === 'soal') {
                        dataSoal.foto = null;
                    }
                }
            }

            if (!babakAktif) {
                const cekFinal = await prisma.tim.findFirst({ where: { tahapAktif: 'final' } });
                if (cekFinal) {
                    babakAktif = 'final';
                } else {
                    const cekSemi = await prisma.tim.findFirst({ where: { tahapAktif: 'semi_final' } });
                    babakAktif = cekSemi ? 'semi_final' : 'penyisihan';
                }
            }

            let filterTim = { role: 'peserta' };
            if (babakAktif === 'semi_final' || babakAktif === 'final') {
                filterTim.skorBabak = { some: { babak: babakAktif } };
            } else {
                filterTim.tahapAktif = babakAktif;
                filterTim.isEliminated = false;
            }

            const teams = await prisma.tim.findMany({
                where: filterTim,
                include: { skorBabak: true, riwayat: soalAktif ? { where: { soalId: soalAktif.id } } : false }
            });

            const { prosesKlasemenUmum } = await import('../sockets/gameHandler.js');
            const daftarTimHasil = await prosesKlasemenUmum(teams, babakAktif);

            daftarTim = daftarTimHasil.map(tim => {
                const riwayatJawaban = soalAktif && tim.riwayat ? tim.riwayat[0] : null;
                let status = 'MENUNGGU';
                if (gameState.faseAktif === 'soal') {
                    status = riwayatJawaban ? (riwayatJawaban.isBenar ? 'BENAR' : 'SALAH') : 'MENUNGGU';
                }
                return {
                    id: tim.id,
                    nama: tim.nama,
                    fotoTim: tim.fotoTim,
                    poin: tim.poin,
                    statusMenjawab: status,
                    isEliminated: tim.isEliminated,
                    totalWaktuDetik: Number(((tim.totalWaktu || 0) / 1000).toFixed(3))
                };
            });

            if (gameState.faseAktif === 'strategi') {
                dataSoal = null;
            }

            return res.status(200).json({
                success: true,
                data: {
                    faseAktif: gameState.faseAktif || 'idle',
                    babakAktif: babakAktif,
                    soalAktif: dataSoal,
                    sisaWaktuDetik: sisaWaktu,
                    isTanpaWaktu: isTanpaWaktu,
                    isPaused: gameState.isPaused,
                    timPencetBelId: gameState.timPencetBelId,
                    timBertanding: daftarTim
                }
            });
        } catch (error) {
            console.error("Error Get LED Live Game:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    getGlobalLeaderboard: async (req, res) => {
        try {
            const { babak } = req.query;
            const gameState = getGameState();

            let targetBabak = babak || null;

            if (gameState.paketAktifId) {
                const paket = await prisma.paketSoal.findUnique({ where: { id: parseInt(gameState.paketAktifId) } });
                if (paket) {
                    targetBabak = paket.babak;
                }
            }

            if (!targetBabak) {
                const cekFinal = await prisma.tim.findFirst({ where: { tahapAktif: 'final' } });
                if (cekFinal) {
                    targetBabak = 'final';
                } else {
                    const cekSemi = await prisma.tim.findFirst({ where: { tahapAktif: 'semi_final' } });
                    if (cekSemi) targetBabak = 'semi_final';
                    else targetBabak = 'penyisihan';
                }
            }

            const filter = { role: 'peserta' };
            if (targetBabak === 'semi_final' || targetBabak === 'final') {
                filter.skorBabak = { some: { babak: targetBabak } };
            } else {
                filter.tahapAktif = targetBabak;
            }

            const daftarTim = await prisma.tim.findMany({ where: filter, include: { skorBabak: true } });

            const { prosesKlasemenUmum } = await import('../sockets/gameHandler.js');
            const daftarTimHasil = await prosesKlasemenUmum(daftarTim, targetBabak);

            const leaderboard = daftarTimHasil.map(tim => ({
                id: tim.id,
                nama: tim.nama,
                fotoTim: tim.fotoTim,
                totalPoin: tim.poin,
                isEliminated: tim.isEliminated,
                totalWaktuDetik: Number(((tim.totalWaktu || 0) / 1000).toFixed(3))
            }));

            return res.status(200).json({
                success: true,
                data: { podium: leaderboard.slice(0, 6), urutanLainnya: leaderboard.slice(6) }
            });
        } catch (error) {
            console.error("Error Get LED Leaderboard:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};