import prisma from '../utils/prisma.js';
import { getGameState } from '../sockets/gameHandler.js';

export const ledController = {
    getLiveGameState: async (req, res) => {
        try {
            const gameState = getGameState();
            const DURASI = parseInt(process.env.DURASI_SOAL) || 180;

            let sisaWaktu = gameState.sisaWaktu;
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

                if (gameState.soalAktifId === soalAktif.id) {
                    sisaWaktu = gameState.sisaWaktu;
                } else if (soalAktif.waktuMulai) {
                    const selisihDetik = Math.floor((new Date().getTime() - soalAktif.waktuMulai.getTime()) / 1000);
                    sisaWaktu = Math.max(0, DURASI - selisihDetik);
                }

                dataSoal = {
                    id: soalAktif.id,
                    pertanyaan: soalAktif.pertanyaan,
                    kategori: soalAktif.kategori,
                    tipe: soalAktif.tipe,
                    opsiJawaban: soalAktif.opsiJawaban,
                    paketNama: soalAktif.paketSoal.nama,
                    babak: soalAktif.paketSoal.babak
                };
            }

            if (babakAktif) {
                let targetGrup = null;

                if (babakAktif === 'penyisihan' && paketNama) {
                    const namaP = paketNama.toLowerCase();
                    if (namaP.includes('a')) targetGrup = 1;
                    else if (namaP.includes('b')) targetGrup = 2;
                    else if (namaP.includes('c')) targetGrup = 3;
                    else if (namaP.includes('d')) targetGrup = 4;
                }

                const filterTim = {
                    role: 'peserta',
                    isEliminated: false,
                    tahapAktif: babakAktif
                };
                if (targetGrup !== null) filterTim.grup = targetGrup;

                const teams = await prisma.tim.findMany({
                    where: filterTim,
                    include: {
                        skorBabak: true,
                        riwayat: soalAktif ? {
                            where: { soalId: soalAktif.id }
                        } : false
                    }
                });

                daftarTim = teams.map(tim => {
                    const skor = tim.skorBabak.find(s => s.babak === tim.tahapAktif);
                    const riwayatJawaban = soalAktif && tim.riwayat ? tim.riwayat[0] : null;

                    return {
                        id: tim.id,
                        nama: tim.nama,
                        fotoTim: tim.fotoTim,
                        poin: skor ? skor.poin : 0,
                        statusMenjawab: riwayatJawaban ? (riwayatJawaban.isBenar ? 'BENAR' : 'SALAH') : 'MENUNGGU'
                    };
                }).sort((a, b) => b.poin - a.poin);
            }

            return res.status(200).json({
                success: true,
                data: {
                    faseAktif: gameState.faseAktif || 'idle',
                    babakAktif: babakAktif,
                    soalAktif: dataSoal,
                    sisaWaktuDetik: sisaWaktu,
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
            const gameState = getGameState();
            let targetBabak = 'penyisihan';
            let targetGrup = null;

            if (gameState.paketAktifId) {
                const paket = await prisma.paketSoal.findUnique({
                    where: { id: parseInt(gameState.paketAktifId) }
                });

                if (paket) {
                    targetBabak = paket.babak;
                    const namaP = paket.nama.toLowerCase();

                    if (targetBabak === 'penyisihan') {
                        if (namaP.includes('a')) targetGrup = 1;
                        else if (namaP.includes('b')) targetGrup = 2;
                    }
                }
            }

            const filter = {
                role: 'peserta',
                isEliminated: false,
                tahapAktif: targetBabak
            };

            if (targetGrup !== null) {
                filter.grup = targetGrup;
            }

            // 3. Ambil data tim beserta skornya
            const daftarTim = await prisma.tim.findMany({
                where: filter,
                include: { skorBabak: true }
            });

            const leaderboard = daftarTim.map(tim => {
                const skorAktif = tim.skorBabak.find(s => s.babak === targetBabak);
                const totalPoin = skorAktif ? skorAktif.poin : 0;

                return {
                    id: tim.id,
                    nama: tim.nama,
                    fotoTim: tim.fotoTim,
                    totalPoin: totalPoin
                };
            }).sort((a, b) => b.totalPoin - a.totalPoin);

            const top6 = leaderboard.slice(0, 6);
            const others = leaderboard.slice(6);

            return res.status(200).json({
                success: true,
                data: {
                    podium: top6,
                    urutanLainnya: others
                }
            });

        } catch (error) {
            console.error("Error Get LED Leaderboard:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};