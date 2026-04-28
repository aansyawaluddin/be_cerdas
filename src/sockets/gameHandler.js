import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

let timerInterval = null;
let autoNextTimeout = null;
let sisaWaktu = 0;
let soalAktifId = null;
let paketAktifId = null;
let isPaused = false;
let faseAktif = 'idle';
let timPencetBelId = null;

let safeTeamsForRebutan = [];
export const getSafeTeamsForRebutan = () => safeTeamsForRebutan;

export const prosesKlasemenUmum = async (daftarTimAktif, babak) => {
    if (babak === 'semi_final') {
        return await prosesKlasemenSemiFinal(daftarTimAktif);
    }

    const timIds = daftarTimAktif.map(t => t.id);
    const semuaRiwayat = await prisma.riwayatJawaban.findMany({
        where: { timId: { in: timIds }, isBenar: true, soal: { paketSoal: { babak: babak } } },
        include: { soal: true }
    });

    const mapped = daftarTimAktif.map(tim => {
        const skorObj = tim.skorBabak ? tim.skorBabak.find(s => s.babak === babak) : null;
        const poinTotal = skorObj ? skorObj.poin : (tim.poin || 0);

        let totalWaktu = 0;
        const riwayatTim = semuaRiwayat.filter(r => r.timId === tim.id);
        riwayatTim.forEach(r => {
            if (r.soal && r.soal.waktuMulai) {
                const waktuPencet = r.waktuMenjawab || r.createdAt;
                if (waktuPencet) {
                    totalWaktu += new Date(waktuPencet).getTime() - new Date(r.soal.waktuMulai).getTime();
                }
            }
        });

        return { ...tim, poin: poinTotal, totalWaktu };
    });

    mapped.sort((a, b) => {
        if (b.poin !== a.poin) return b.poin - a.poin;
        return a.totalWaktu - b.totalWaktu;
    });

    return mapped;
};

export const prosesKlasemenSemiFinal = async (daftarTimAktif) => {
    const paketRebutan = await prisma.paketSoal.findFirst({
        where: { babak: 'semi_final', nama: { contains: 'rebutan' } },
        include: { daftarSoal: { select: { id: true } } }
    });
    const soalRebutanIds = paketRebutan ? paketRebutan.daftarSoal.map(s => s.id) : [];
    const riwayatRebutan = await prisma.riwayatJawaban.findMany({
        where: { soalId: { in: soalRebutanIds }, isBenar: true }
    });

    const timIds = daftarTimAktif.map(t => t.id);
    const semuaRiwayat = await prisma.riwayatJawaban.findMany({
        where: { timId: { in: timIds }, isBenar: true, soal: { paketSoal: { babak: 'semi_final' } } },
        include: { soal: true }
    });

    const mapped = daftarTimAktif.map(tim => {
        const skorObj = tim.skorBabak ? tim.skorBabak.find(s => s.babak === 'semi_final') : null;
        const poinTotal = skorObj ? skorObj.poin : (tim.poin || 0);
        const poinRebutan = riwayatRebutan.filter(r => r.timId === tim.id).reduce((sum, r) => sum + r.poinDidapat, 0);

        let totalWaktu = 0;
        const riwayatTim = semuaRiwayat.filter(r => r.timId === tim.id);
        riwayatTim.forEach(r => {
            if (r.soal && r.soal.waktuMulai) {
                const waktuPencet = r.waktuMenjawab || r.createdAt;
                if (waktuPencet) {
                    totalWaktu += new Date(waktuPencet).getTime() - new Date(r.soal.waktuMulai).getTime();
                }
            }
        });

        return { ...tim, poin: poinTotal, poinMurni: poinTotal - poinRebutan, totalWaktu };
    });

    const klasemenMurni = [...mapped].sort((a, b) => {
        if (b.poinMurni !== a.poinMurni) return b.poinMurni - a.poinMurni;
        return a.totalWaktu - b.totalWaktu;
    });

    const rank6 = klasemenMurni[5];
    const rank7 = klasemenMurni[6];

    let poinBatas = null;
    if (rank6 && rank7 && rank6.poinMurni === rank7.poinMurni) {
        poinBatas = rank6.poinMurni;
    }

    mapped.sort((a, b) => {
        if (poinBatas !== null) {
            const isASafe = a.poinMurni > poinBatas;
            const isBSafe = b.poinMurni > poinBatas;
            if (isASafe && !isBSafe) return -1;
            if (!isASafe && isBSafe) return 1;
        }
        if (b.poin !== a.poin) return b.poin - a.poin;
        return a.totalWaktu - b.totalWaktu;
    });

    return mapped.map(t => ({
        ...t,
        isAman: poinBatas !== null && t.poinMurni > poinBatas,
        isRebutan: poinBatas !== null && t.poinMurni === poinBatas
    }));
};

async function hukumTimTidakMenjawab(io, soalId) {
    try {
        const soal = await prisma.soal.findUnique({ where: { id: soalId }, include: { paketSoal: true } });
        if (!soal) return;

        const babak = soal.paketSoal.babak;
        const namaPaketL = soal.paketSoal.nama.toLowerCase();

        const isScoreBattle = (babak === 'semi_final' && !namaPaketL.includes('rebutan')) ||
            (babak === 'final' && (namaPaketL.includes('game 2') || namaPaketL.includes('score battle')));

        if (!isScoreBattle) return;

        const timAktif = await prisma.tim.findMany({
            where: { tahapAktif: babak, isEliminated: false }
        });

        const riwayat = await prisma.riwayatJawaban.findMany({
            where: { soalId: soalId }
        });
        const idSudahMenjawab = riwayat.map(r => r.timId);

        const timBolos = timAktif.filter(t => !idSudahMenjawab.includes(t.id));

        for (const tim of timBolos) {
            const taruhan = await prisma.taruhanSoal.findUnique({
                where: { timId_soalId: { timId: tim.id, soalId: soalId } }
            });

            const poinMinus = -(taruhan ? taruhan.poin : 10);

            await prisma.riwayatJawaban.create({
                data: {
                    timId: tim.id,
                    soalId: soalId,
                    jawabanTim: "TIDAK MENJAWAB (WAKTU HABIS)",
                    isBenar: false,
                    poinDidapat: poinMinus
                }
            });

            await prisma.skorBabak.upsert({
                where: { timId_babak: { timId: tim.id, babak: babak } },
                update: { poin: { increment: poinMinus } },
                create: { timId: tim.id, babak: babak, poin: poinMinus }
            });

            if (io) {
                io.emit('update_layar_led', {
                    timId: tim.id,
                    namaSekolah: tim.nama,
                    status: 'SALAH',
                    poinTambahan: poinMinus,
                    waktuDetik: 0
                });
            }
            console.log(`[GAME PENALTY] Tim ${tim.nama} dihukum ${poinMinus} poin karena tidak menjawab.`);
        }
    } catch (error) {
        console.error("[ERROR HUKUMAN TIDAK MENJAWAB]:", error);
    }
}

const promoteToFinal = async (timLolos, io) => {
    console.log(`[GAME] Mempromosikan ${timLolos.length} tim ke Grand Final...`);
    await prisma.$transaction(async (tx) => {
        for (const tim of timLolos) {
            await tx.tim.update({ where: { id: tim.id }, data: { tahapAktif: 'final' } });
            await tx.skorBabak.upsert({
                where: { timId_babak: { timId: tim.id, babak: 'final' } },
                update: {},
                create: { timId: tim.id, babak: 'final', poin: 0 }
            });
        }
    });
    io.emit('semi_final_selesai', { message: "Semi Final usai! Top 6 otomatis masuk ke Grand Final." });
};

const triggerAutoNext = async (io, paketId) => {
    const paketCurrent = await prisma.paketSoal.findUnique({ where: { id: parseInt(paketId) } });
    if (paketCurrent && (paketCurrent.babak === 'semi_final' || paketCurrent.babak === 'final')) {
        console.log(`[GAME] Mempersiapkan perpindahan otomatis dalam 5 detik...`);
        if (autoNextTimeout) clearTimeout(autoNextTimeout);

        autoNextTimeout = setTimeout(async () => {
            try {
                if (!isPaused) {
                    await lanjutSoalBerikutnya(io);
                }
            } catch (error) {
                console.error("[AUTO-NEXT ERROR]:", error.message);
            }
        }, 5000);
    }
};

export const mulaiFaseStrategi = async (io, paketId) => {
    try {
        const DURASI = parseInt(process.env.DURASI_STRATEGI) || 180;
        console.log(`[GAME] Memulai Fase Strategi untuk Paket ${paketId}`);
        faseAktif = 'strategi';
        sisaWaktu = DURASI;
        paketAktifId = paketId;
        isPaused = false;

        io.emit('fase_strategi_mulai', { paketId, sisaWaktu });
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(async () => {
            if (isPaused) return;
            sisaWaktu--;
            io.emit('timer_strategi_update', { sisaWaktu });

            if (sisaWaktu <= 0) {
                clearInterval(timerInterval);
                console.log(`[GAME] Waktu Strategi Habis. Bersiap masuk ke Soal...`);
                io.emit('fase_strategi_selesai', { message: 'Waktu habis! Mempersiapkan soal...' });

                if (autoNextTimeout) clearTimeout(autoNextTimeout);
                autoNextTimeout = setTimeout(() => {
                    if (!isPaused) mulaiSiklusPaket(io, paketId);
                }, 5000);
            }
        }, 1000);
        return true;
    } catch (error) {
        return false;
    }
};

export const mulaiJedaIstirahat = (io, currentPaketId) => {
    const DURASI_JEDA = parseInt(process.env.DURASI_JEDA) || 180;
    faseAktif = 'jeda';
    sisaWaktu = DURASI_JEDA;
    isPaused = false;
    soalAktifId = null;

    io.emit('jeda_mulai', { sisaWaktu });
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(async () => {
        if (isPaused) return;
        sisaWaktu--;
        io.emit('timer_jeda_update', { sisaWaktu });

        if (sisaWaktu <= 0) {
            clearInterval(timerInterval);
            console.log(`[GAME] Waktu Istirahat Habis. Menunggu Admin...`);
        }
    }, 1000);
};

export const mulaiSiklusPaket = async (io, paketId) => {
    try {
        const DURASI = parseInt(process.env.DURASI_SOAL) || 180;
        paketAktifId = paketId;
        isPaused = false;
        timPencetBelId = null;

        await prisma.soal.updateMany({
            where: { status: 'aktif' },
            data: { status: 'selesai' }
        });

        const soalBelum = await prisma.soal.findMany({
            where: { paketSoalId: parseInt(paketId), status: 'belum' },
            orderBy: { id: 'asc' }
        });

        if (soalBelum.length === 0) {
            console.log(`[GAME] Paket ${paketId} Selesai.`);
            const infoPaket = await prisma.paketSoal.findUnique({ where: { id: parseInt(paketId) } });

            if (infoPaket && infoPaket.babak !== 'penyisihan') {
                io.emit('paket_selesai', { message: "Ronde ini telah selesai. Sedang merekap poin..." });
            } else {
                io.emit('paket_selesai', { message: "Semua soal di babak ini telah selesai!" });
            }
            return null;
        }

        const infoPaket = await prisma.paketSoal.findUnique({ where: { id: parseInt(paketId) } });
        const namaPaketL = infoPaket.nama.toLowerCase();

        let poolSoal = soalBelum;

        if (infoPaket.babak === 'semi_final' && !namaPaketL.includes('rebutan')) {
            poolSoal = soalBelum.slice(0, 10);
        }
        else if (infoPaket.babak === 'final' && (namaPaketL.includes('game 2') || namaPaketL.includes('score battle'))) {
            poolSoal = soalBelum.slice(0, 20);
        }

        const randomIndex = Math.floor(Math.random() * poolSoal.length);
        const soalBerikutnya = poolSoal[randomIndex];

        const soalAktif = await prisma.soal.update({
            where: { id: soalBerikutnya.id },
            data: { status: 'aktif', waktuMulai: new Date() }
        });

        soalAktifId = soalAktif.id;

        if (soalAktif.tipe === 'memori') {
            faseAktif = 'memori_gambar';
            sisaWaktu = 30;
            io.emit('memori_gambar_mulai', { soalId: soalAktifId, sisaWaktu });

            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(async () => {
                if (isPaused) return;
                sisaWaktu--;
                io.emit('timer_update', { sisaWaktu, fase: 'memori_gambar' });

                if (sisaWaktu <= 0) {
                    clearInterval(timerInterval);

                    faseAktif = 'memori_jeda';
                    sisaWaktu = 5;
                    io.emit('memori_jeda_mulai', { soalId: soalAktifId, sisaWaktu });

                    timerInterval = setInterval(async () => {
                        if (isPaused) return;
                        sisaWaktu--;
                        io.emit('timer_update', { sisaWaktu, fase: 'memori_jeda' });

                        if (sisaWaktu <= 0) {
                            clearInterval(timerInterval);
                            faseAktif = 'soal';
                            sisaWaktu = DURASI;

                            await prisma.soal.update({
                                where: { id: soalAktifId },
                                data: { waktuMulai: new Date() }
                            });

                            io.emit('game_mulai', { soalId: soalAktifId, sisaWaktu });

                            timerInterval = setInterval(async () => {
                                if (isPaused) return;
                                sisaWaktu--;
                                io.emit('timer_update', { sisaWaktu, fase: 'soal' });

                                if (sisaWaktu <= 0) {
                                    clearInterval(timerInterval);
                                    await prisma.soal.update({ where: { id: soalAktifId }, data: { status: 'selesai' } });
                                    await hukumTimTidakMenjawab(io, soalAktifId);
                                    io.emit('waktu_habis', { soalId: soalAktifId });
                                    await prosesEliminasiOtomatis(io, soalAktifId);
                                    await triggerAutoNext(io, paketId);
                                }
                            }, 1000);
                        }
                    }, 1000);
                }
            }, 1000);

        } else {
            faseAktif = 'soal';
            const isGame4Final = infoPaket.babak === 'final' && (namaPaketL.includes('game 4') || namaPaketL.includes('case'));
            sisaWaktu = isGame4Final ? 0 : DURASI;

            io.emit('game_mulai', { soalId: soalAktifId, sisaWaktu, isUnlimited: isGame4Final });

            if (timerInterval) clearInterval(timerInterval);

            if (isGame4Final) {
                console.log(`[GAME] Final Case Battle (Game 4) dimulai tanpa timer otomatis. Menunggu aksi admin...`);
            } else {
                timerInterval = setInterval(async () => {
                    if (isPaused) return;
                    sisaWaktu--;
                    io.emit('timer_update', { sisaWaktu, fase: 'soal' });

                    if (sisaWaktu <= 0) {
                        clearInterval(timerInterval);
                        await prisma.soal.update({ where: { id: soalAktifId }, data: { status: 'selesai' } });
                        await hukumTimTidakMenjawab(io, soalAktifId);
                        io.emit('waktu_habis', { soalId: soalAktifId });
                        await prosesEliminasiOtomatis(io, soalAktifId);
                        await triggerAutoNext(io, paketId);
                    }
                }, 1000);
            }
        }
        return soalAktif;
    } catch (error) {
        return null;
    }
};

export const selesaikanSoalSekarang = async (io, paketId) => {
    if (timerInterval) clearInterval(timerInterval);
    if (soalAktifId) {
        await prisma.soal.update({ where: { id: soalAktifId }, data: { status: 'selesai' } });
        await hukumTimTidakMenjawab(io, soalAktifId);
        io.emit('waktu_habis', { soalId: soalAktifId });
        await prosesEliminasiOtomatis(io, soalAktifId);
        await triggerAutoNext(io, paketId);
    }
};

export const prosesTekanBel = (io, timId) => {
    if (timPencetBelId) return false;
    timPencetBelId = timId;
    io.emit('bel_ditekan', { timId: timId });
    return true;
};

export const togglePause = (io) => {
    if (!soalAktifId && !paketAktifId) throw new Error("Tidak ada game yang sedang berjalan.");
    isPaused = !isPaused;
    if (isPaused) {
        io.emit('game_paused', { message: "Game dihentikan sementara." });
    } else {
        io.emit('game_resumed', { message: "Game dilanjutkan." });
    }
    return { isPaused, sisaWaktu };
};

export const forceStopTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    if (autoNextTimeout) clearTimeout(autoNextTimeout);
    isPaused = false;
    sisaWaktu = 0;
    soalAktifId = null;
    paketAktifId = null;
    faseAktif = 'idle';
    timPencetBelId = null;
    safeTeamsForRebutan = [];
};

export const getGameState = () => {
    return { isPaused, sisaWaktu, soalAktifId, paketAktifId, faseAktif, timPencetBelId };
};

export const lanjutSoalBerikutnya = async (io) => {
    if (!paketAktifId) throw new Error("Tidak ada paket soal yang aktif saat ini.");

    if (autoNextTimeout) clearTimeout(autoNextTimeout);

    if (faseAktif === 'strategi') {
        console.log(`[GAME] Admin men-skip Fase Strategi. Memulai pertanyaan...`);
        if (timerInterval) clearInterval(timerInterval);
        mulaiSiklusPaket(io, paketAktifId);
        return true;
    }

    const paket = await prisma.paketSoal.findUnique({ where: { id: parseInt(paketAktifId) } });
    const soalSekarang = soalAktifId ? await prisma.soal.findUnique({ where: { id: soalAktifId } }) : null;

    if (soalSekarang && soalSekarang.status === 'aktif') {

        const namaPaketL = paket.nama.toLowerCase();
        const isBuzzerAtauJuri = namaPaketL.includes('rebutan') ||
            namaPaketL.includes('collaborative') ||
            namaPaketL.includes('game 3') ||
            namaPaketL.includes('case') ||
            namaPaketL.includes('game 4');

        if (!isBuzzerAtauJuri) {
            const totalJawabanMasuk = await prisma.riwayatJawaban.count({
                where: { soalId: soalAktifId }
            });

            let filterTim = { role: 'peserta', tahapAktif: paket.babak, isEliminated: false };

            if (paket.babak === 'penyisihan') {
                if (/\b(a|1)\b/.test(namaPaketL)) filterTim.grup = 1;
                else if (/\b(b|2)\b/.test(namaPaketL)) filterTim.grup = 2;
                else if (/\b(c|3)\b/.test(namaPaketL)) filterTim.grup = 3;
                else if (/\b(d|4)\b/.test(namaPaketL)) filterTim.grup = 4;
            }

            const totalPesertaSeharusnya = await prisma.tim.count({ where: filterTim });

            if (totalJawabanMasuk < totalPesertaSeharusnya) {
                throw new Error(`Sabar! Baru ${totalJawabanMasuk} dari ${totalPesertaSeharusnya} tim yang menjawab.`);
            }
        }

        if (timerInterval) clearInterval(timerInterval);
        console.log(`[GAME] Timer dihentikan paksa. Memproses penutupan soal...`);

        await prisma.soal.update({ where: { id: soalAktifId }, data: { status: 'selesai' } });
        await hukumTimTidakMenjawab(io, soalAktifId);
        io.emit('waktu_habis', { soalId: soalAktifId });
        await prosesEliminasiOtomatis(io, soalAktifId);
    }

    if (paket.babak === 'semi_final' && !paket.nama.toLowerCase().includes('rebutan')) {
        const jumlahSelesai = await prisma.soal.count({
            where: { paketSoalId: parseInt(paketAktifId), status: 'selesai' }
        });

        if (jumlahSelesai > 0 && jumlahSelesai % 10 === 0 && jumlahSelesai < 50 && faseAktif !== 'strategi') {
            console.log(`[GAME] 10 Soal Selesai. Masuk Fase Strategi Berikutnya...`);
            mulaiFaseStrategi(io, paketAktifId);
            return true;
        }
    }

    console.log(`[GAME] Memuat soal berikutnya...`);
    mulaiSiklusPaket(io, paketAktifId);
    return true;
};

export const gameSocketHandler = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            socket.user = { role: 'led', username: 'Layar Panggung' };
            return next();
        }
        try {
            if (!process.env.JWT_SECRET) return next(new Error("Server Configuration Error"));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error("Token tidak valid"));
        }
    });

    io.on('connection', (socket) => {
        const role = socket.user?.role;
        if (role === 'admin') socket.join('admin');
        else if (role === 'peserta') {
            socket.join('peserta');
            const state = getGameState();

            if (state.faseAktif === 'soal' && state.soalAktifId) {
                socket.emit('game_mulai', { soalId: state.soalAktifId, sisaWaktu: state.sisaWaktu });
            } else if (state.faseAktif === 'memori_gambar' && state.soalAktifId) {
                socket.emit('memori_gambar_mulai', { soalId: state.soalAktifId, sisaWaktu: state.sisaWaktu });
            } else if (state.faseAktif === 'memori_jeda' && state.soalAktifId) {
                socket.emit('memori_jeda_mulai', { soalId: state.soalAktifId, sisaWaktu: state.sisaWaktu });
            } else if (state.faseAktif === 'strategi' && state.paketAktifId) {
                socket.emit('fase_strategi_mulai', { paketId: state.paketAktifId, sisaWaktu: state.sisaWaktu });
            } else if (state.faseAktif === 'jeda') {
                socket.emit('jeda_mulai', { sisaWaktu: state.sisaWaktu });
            }
        } else {
            socket.join('led');
        }
    });
};

async function prosesEliminasiOtomatis(io, soalId) {
    try {
        const soal = await prisma.soal.findUnique({ where: { id: soalId }, include: { paketSoal: true } });
        if (!soal) return;

        const paketSoalId = soal.paketSoalId;
        const babakSekarang = soal.paketSoal.babak;

        if (babakSekarang === 'semi_final') {
            const soalSisa = await prisma.soal.count({ where: { paketSoalId: paketSoalId, status: 'belum' } });

            if (soalSisa === 0) {
                const isRebutan = soal.paketSoal.nama.toLowerCase().includes('rebutan');
                const daftarTimSemiFinal = await prisma.tim.findMany({
                    where: { tahapAktif: 'semi_final', isEliminated: false },
                    include: { skorBabak: true }
                });

                const klasemenAkhir = await prosesKlasemenUmum(daftarTimSemiFinal, 'semi_final');

                if (!isRebutan) {
                    const adaSeriEliminasi = klasemenAkhir.some(t => t.isRebutan);

                    if (adaSeriEliminasi) {
                        console.log(`[GAME] SERI TERDETEKSI! MENGAKTIFKAN PERISAI...`);
                        const timGugurPasti = klasemenAkhir.filter(t => !t.isAman && !t.isRebutan);
                        for (const tim of timGugurPasti) {
                            await prisma.tim.update({ where: { id: tim.id }, data: { isEliminated: true } });
                        }
                        io.emit('peringatan_seri', { message: "Ada nilai SERI di zona eliminasi! Lanjutkan ke Game Rebutan." });
                    } else {
                        console.log(`[GAME] Tidak ada seri. Sapu bersih peringkat 7 ke bawah...`);
                        const timGugur = klasemenAkhir.slice(6);
                        for (const tim of timGugur) {
                            await prisma.tim.update({ where: { id: tim.id }, data: { isEliminated: true } });
                        }
                        await promoteToFinal(klasemenAkhir.slice(0, 6), io);
                    }
                } else {
                    console.log(`[GAME] Babak Rebutan Selesai. Eksekusi Kunci Final...`);
                    const kuotaAman = klasemenAkhir.filter(t => t.isAman).length;
                    const kuotaSisa = 6 - kuotaAman;

                    const timRebutan = klasemenAkhir.filter(t => !t.isAman);
                    const timLolosRebutan = timRebutan.slice(0, kuotaSisa);
                    const timGugurRebutan = timRebutan.slice(kuotaSisa);

                    for (const tim of timGugurRebutan) {
                        await prisma.tim.update({ where: { id: tim.id }, data: { isEliminated: true } });
                    }

                    const finalis = [...klasemenAkhir.filter(t => t.isAman), ...timLolosRebutan];
                    await promoteToFinal(finalis, io);
                }
            }
            return;
        }

        if (babakSekarang === 'penyisihan') {
            const jumlahSelesai = await prisma.soal.count({ where: { paketSoalId: paketSoalId, status: 'selesai' } });
            const titikEliminasi = [10, 15, 20, 25, 30, 35];
            if (!titikEliminasi.includes(jumlahSelesai)) return;

            let grupAktif = null;
            const namaPaket = soal.paketSoal.nama.toLowerCase();
            if (/\b(a|1)\b/.test(namaPaket)) grupAktif = 1;
            else if (/\b(b|2)\b/.test(namaPaket)) grupAktif = 2;

            if (grupAktif === null) return;

            const daftarTim = await prisma.tim.findMany({
                where: { grup: grupAktif, tahapAktif: 'penyisihan', isEliminated: false },
                include: { skorBabak: true }
            });

            if (daftarTim.length === 0) return;

            const klasemen = await prosesKlasemenUmum(daftarTim, 'penyisihan');

            const timTerbawah = klasemen[klasemen.length - 1];
            if (!timTerbawah) return;

            await prisma.tim.update({ where: { id: timTerbawah.id }, data: { isEliminated: true } });
            io.emit('animasi_eliminasi', { timId: timTerbawah.id, nama: timTerbawah.nama, pesan: `Gugur di soal ke-${jumlahSelesai}` });
        }
    } catch (error) {
        console.error("[ERROR ELIMINASI]:", error);
    }
}