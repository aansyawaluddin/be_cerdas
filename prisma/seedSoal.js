import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Membersihkan data Paket Soal dan Soal lama...');

    await prisma.soal.deleteMany({});
    await prisma.paketSoal.deleteMany({});

    console.log('✨ Database bersih! Memulai seeding Bank Soal baru...');

    const namaPakets = ['Paket A', 'Paket B'];
    const daftarKategori = ['b_indo', 'b_inggris', 'mtk', 'ipa'];

    for (let p = 0; p < namaPakets.length; p++) {
        const namaPaket = namaPakets[p];

        const paket = await prisma.paketSoal.create({
            data: {
                nama: namaPaket,
                babak: 'penyisihan'
            }
        });

        console.log(`✅ [${paket.nama}] berhasil disiapkan.`);

        const dataSoal = [];

        for (let i = 1; i <= 40; i++) {
            const indexKategori = Math.floor((i - 1) / 10);
            const kategoriSoal = daftarKategori[indexKategori];

            const urutanDiKategori = (i - 1) % 10;
            const isPilihanGanda = urutanDiKategori < 5;

            const tipeSoal = isPilihanGanda ? 'pilihan_ganda' : 'esai';
            const teksPertanyaan = isPilihanGanda
                ? `[${kategoriSoal.toUpperCase()}] Ini adalah contoh soal Pilihan Ganda nomor ${i}. Siapakah penemu konsep ini?`
                : `[${kategoriSoal.toUpperCase()}] Ini adalah contoh soal Esai nomor ${i}. Jelaskan secara detail bagaimana konsep ini dapat diimplementasikan!`;

            const opsiJawaban = isPilihanGanda ? ['Opsi A (Benar)', 'Opsi B (Salah)', 'Opsi C (Salah)', 'Opsi D (Salah)'] : null;
            const jawabanBenar = isPilihanGanda ? 'Opsi A (Benar)' : 'Jawaban esai ini berisi penjelasan rinci mengenai konsep terkait.';

            dataSoal.push({
                pertanyaan: teksPertanyaan,
                kategori: kategoriSoal,
                tipe: tipeSoal,
                opsiJawaban: opsiJawaban,
                jawabanBenar: jawabanBenar,
                poin: 25,
                status: 'belum',
                waktuMulai: null,
                paketSoalId: paket.id
            });
        }

        await prisma.soal.createMany({
            data: dataSoal
        });
    }

    console.log('🎉 Seeding Soal Selesai!');
    console.log('📊 Total: 2 Paket Soal (Isi tiap paket: 20 PG, 20 Esai).');
}

main()
    .catch((e) => {
        console.error('❌ Terjadi kesalahan saat seeding Soal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });