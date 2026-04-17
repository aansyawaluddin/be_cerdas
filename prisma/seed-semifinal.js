import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("⏳ Memulai proses seeding data Semi Final...");

    const daftarPaket = [
        "Semi Final - Game 1",
        "Semi Final - Game 2",
        "Semi Final - Game 3",
        "Semi Final - Game 4",
        "Semi Final - Game 5",
        "Semi Final - Rebutan"
    ];

    for (let i = 0; i < daftarPaket.length; i++) {
        const namaPaket = daftarPaket[i];

        const paket = await prisma.paketSoal.create({
            data: {
                nama: namaPaket,
                babak: 'semi_final',
            }
        });

        console.log(`✅ Paket dibuat: [ID: ${paket.id}] ${paket.nama}`);

        const jumlahSoal = namaPaket.includes("Rebutan") ? 15 : 10;
        const dataSoal = [];

        for (let j = 1; j <= jumlahSoal; j++) {
            dataSoal.push({
                paketSoalId: paket.id,
                pertanyaan: `[${namaPaket.toUpperCase()}] Ini adalah pertanyaan testing nomor ${j}. Manakah jawaban yang paling tepat?`,

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

        console.log(`   -> Berhasil memasukkan ${jumlahSoal} soal ke dalam ${paket.nama}`);
    }

    console.log("\n🎉 Seeding Semi Final selesai! Database siap digunakan untuk simulasi.");
}

main()
    .catch((e) => {
        console.error("❌ Terjadi kesalahan saat seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });