import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("⏳ Memulai proses seeding data Semi Final...");

    const daftarPaket = [
        { nama: "Semi Final", jumlah: 50 },
        { nama: "Semi Final - Rebutan", jumlah: 5 }
    ];

    for (let i = 0; i < daftarPaket.length; i++) {
        const item = daftarPaket[i];

        const paket = await prisma.paketSoal.create({
            data: {
                nama: item.nama,
                babak: 'semi_final',
            }
        });

        console.log(`✅ Paket dibuat: [ID: ${paket.id}] ${paket.nama}`);

        const dataSoal = [];

        for (let j = 1; j <= item.jumlah; j++) {
            dataSoal.push({
                paketSoalId: paket.id,
                pertanyaan: `[${paket.nama.toUpperCase()}] Ini adalah pertanyaan nomor ${j}. Manakah jawaban yang paling tepat?`,
                kategori: "b_indo",
                tipe: "pilihan_ganda",
                opsiJawaban: [
                    "Jawaban Benar",
                    "Pengecoh 1",
                    "Pengecoh 2",
                    "Pengecoh 3"
                ],
                jawabanBenar: "Jawaban Benar",
                poin: 10,
                status: "belum"
            });
        }

        await prisma.soal.createMany({
            data: dataSoal
        });

        console.log(`   -> Berhasil memasukkan ${item.jumlah} soal ke dalam ${paket.nama}`);
    }

    console.log("\n🎉 Seeding Semi Final selesai! Database siap digunakan.");
}

main()
    .catch((e) => {
        console.error("❌ Terjadi kesalahan saat seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });