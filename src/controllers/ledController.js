import prisma from '../utils/prisma.js';

export const ledController = {
    getLiveGameState: async (req, res) => {
        try {
            const soalAktif = await prisma.soal.findFirst({
                where: { status: 'aktif' },
                include: { paketSoal: true }
            });

            let sisaWaktu = 0;
            let dataSoal = null;
            let daftarTim = [];

            if (soalAktif) {
                if (soalAktif.waktuMulai) {
                    const selisihDetik = Math.floor((new Date().getTime() - soalAktif.waktuMulai.getTime()) / 1000);
                    sisaWaktu = Math.max(0, 180 - selisihDetik);
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

                let targetGrup = null;
                if (soalAktif.paketSoal.babak === 'penyisihan') {
                    const namaPaket = soalAktif.paketSoal.nama.toLowerCase();
                    if (namaPaket.includes('a')) targetGrup = 1;
                    else if (namaPaket.includes('b')) targetGrup = 2;
                    else if (namaPaket.includes('c')) targetGrup = 3;
                    else if (namaPaket.includes('d')) targetGrup = 4;
                }

                const filterTim = { 
                    role: 'peserta', 
                    isEliminated: false, 
                    tahapAktif: soalAktif.paketSoal.babak 
                };
                if (targetGrup !== null) filterTim.grup = targetGrup;

                const teams = await prisma.tim.findMany({
                    where: filterTim,
                    include: {
                        skorBabak: true,
                        riwayat: {
                            where: { soalId: soalAktif.id } 
                        }
                    }
                });

                daftarTim = teams.map(tim => {
                    const skor = tim.skorBabak.find(s => s.babak === tim.tahapAktif);
                    const riwayatJawaban = tim.riwayat[0]; 

                    return {
                        id: tim.id,
                        nama: tim.nama,
                        fotoTim: tim.fotoTim,
                        poin: skor ? skor.poin : 0, 
                    };
                }).sort((a, b) => b.poin - a.poin); 
            }

            return res.status(200).json({
                success: true,
                data: {
                    soalAktif: dataSoal,
                    sisaWaktuDetik: sisaWaktu,
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

            const filter = { role: 'peserta', isEliminated: false };
            if (babak) filter.tahapAktif = babak;

            const daftarTim = await prisma.tim.findMany({
                where: filter,
                include: { skorBabak: true }
            });

            const leaderboard = daftarTim.map(tim => {
                const totalPoin = tim.skorBabak.reduce((sum, skor) => sum + skor.poin, 0);

                return {
                    id: tim.id,
                    nama: tim.nama,
                    fotoTim: tim.fotoTim,
                    totalPoin: totalPoin
                };
            }).sort((a, b) => b.totalPoin - a.totalPoin);

            const top3 = leaderboard.slice(0, 3);
            const others = leaderboard.slice(3);

            return res.status(200).json({
                success: true,
                data: {
                    podium: top3,
                    urutanLainnya: others
                }
            });

        } catch (error) {
            console.error("Error Get LED Leaderboard:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};