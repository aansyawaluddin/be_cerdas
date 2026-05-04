import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

async function main() {
    console.log('🧹 Membersihkan data Paket Soal dan Soal lama...');

    await prisma.soal.deleteMany({});
    await prisma.paketSoal.deleteMany({});

    console.log('✨ Database bersih! Memulai seeding 35 Bank Soal Penyisihan (Diformat & Diacak)...');

    const soalPenyisihanAsli = [
        // --- MTK / PENGETAHUAN KUANTITATIF ---
        { pertanyaan: "Dari angka 1, 2, 3, 4, 5, dan 6 akan dibentuk bilangan genap yang terdiri dari tiga angka berbeda.\n\nBanyaknya bilangan yang dapat dibentuk adalah...", kategori: "mtk", opsi: ["30", "45", "60", "90", "120"], jawaban: "60" },
        { pertanyaan: "Tentukan nilai p jika diketahui:\n\nLimit x → 3 dari [(x² - 9) / (√(x² + 7) - 4)] = p", kategori: "mtk", opsi: ["4", "6", "8", "12", "16"], jawaban: "8" },
        { pertanyaan: "Diketahui fungsi:\nf(x) = ax + b\n\nJika f(f(x)) = 4x + 9 dan a > 0, maka nilai dari a² + b² adalah...", kategori: "mtk", opsi: ["8", "13", "18", "25", "34"], jawaban: "13" },
        { pertanyaan: "Sebuah pekerjaan dapat diselesaikan oleh Andi dalam 12 hari, sedangkan Budi dapat menyelesaikannya dalam 24 hari.\n\nJika mereka bekerja bersama-sama, pekerjaan tersebut akan selesai dalam waktu...", kategori: "mtk", opsi: ["6 hari", "8 hari", "10 hari", "12 hari", "18 hari"], jawaban: "8 hari" },
        { pertanyaan: "Dalam kantong terdapat 5 bola merah dan 3 bola putih.\n\nJika diambil 2 bola sekaligus secara acak, peluang terambilnya dua bola merah adalah...", kategori: "mtk", opsi: ["5/14", "5/28", "10/28", "15/28", "20/28"], jawaban: "5/14" },
        { pertanyaan: "Diketahui persamaan eksponen:\n3^(x² - 4x) = 1/27\n\nJumlah semua nilai x yang memenuhi persamaan tersebut adalah...", kategori: "mtk", opsi: ["-4", "-1", "2", "3", "4"], jawaban: "4" },
        { pertanyaan: "Akar-akar persamaan kuadrat x² - 5x + 6 = 0 adalah p dan q.\n\nPersamaan kuadrat baru yang akar-akarnya (p+2) dan (q+2) adalah...", kategori: "mtk", opsi: ["x² - 9x + 20 = 0", "x² + 9x - 20 = 0", "x² - 9x - 20 = 0", "x² - 5x + 10 = 0", "x² - 7x + 12 = 0"], jawaban: "x² - 9x + 20 = 0" },
        { pertanyaan: "Rata-rata nilai ujian 5 siswa adalah 80.\n\nJika nilai satu siswa tambahan dimasukkan, nilai rata-ratanya menjadi 82. Nilai siswa tambahan tersebut adalah...", kategori: "mtk", opsi: ["84", "88", "90", "92", "96"], jawaban: "92" },
        { pertanyaan: "Suku ke-3 suatu barisan aritmetika adalah 9, dan suku ke-6 adalah 18.\n\nJumlah 10 suku pertama barisan tersebut adalah...", kategori: "mtk", opsi: ["135", "150", "165", "180", "195"], jawaban: "165" },
        { pertanyaan: "Sebuah barang didiskon 20%, kemudian dari harga baru tersebut didiskon lagi sebesar 15%.\n\nTotal persentase diskon dari harga awal adalah...", kategori: "mtk", opsi: ["32%", "35%", "33%", "30%", "28%"], jawaban: "32%" },

        // --- B. INDO / LITERASI & PENALARAN UMUM ---
        { pertanyaan: "Premis 1: Jika jalanan macet, maka Budi terlambat sampai di kantor.\nPremis 2: Hari ini Budi tidak terlambat sampai di kantor.\n\nKesimpulan yang paling tepat adalah...", kategori: "b_indo", opsi: ["Jalanan macet.", "Budi berangkat lebih awal.", "Jalanan tidak macet.", "Budi naik kereta.", "Hari ini adalah libur."], jawaban: "Jalanan tidak macet." },
        { pertanyaan: "Premis 1: Semua karyawan harus hadir dalam rapat rutin.\nPremis 2: Sebagian manajer adalah karyawan.\n\nKesimpulan yang paling tepat adalah...", kategori: "b_indo", opsi: ["Semua manajer harus hadir rapat.", "Semua yang hadir rapat adalah manajer.", "Sebagian manajer tidak hadir rapat.", "Sebagian manajer harus hadir dalam rapat rutin.", "Tidak ada manajer yang hadir rapat."], jawaban: "Sebagian manajer harus hadir dalam rapat rutin." },
        { pertanyaan: "Penggunaan kalimat yang TIDAK efektif terdapat pada kalimat...", kategori: "b_indo", opsi: ["Pemerintah melakukan berbagai upaya menekan inflasi.", "Bagi semua mahasiswa yang mengambil kelas ini diharap berkumpul.", "Kenaikan harga BBM berdampak pada daya beli.", "Dalam rapat itu diputuskan anggaran akan dipotong.", "Kemajuan teknologi mengubah cara manusia berkomunikasi."], jawaban: "Bagi semua mahasiswa yang mengambil kelas ini diharap berkumpul." },
        { pertanyaan: "Kata serapan yang penulisannya sesuai dengan PUEBI (Pedoman Umum Ejaan Bahasa Indonesia) adalah...", kategori: "b_indo", opsi: ["Standardisasi, frekuensi, kuitansi", "Standarisasi, frekwensi, kwitansi", "Standardisasi, frekwensi, kuitansi", "Standarisasi, frekuensi, kuitansi", "Standardisasi, frekuensi, kwitansi"], jawaban: "Standardisasi, frekuensi, kuitansi" },
        { pertanyaan: "Dalam lomba balap karung didapatkan hasil sebagai berikut:\n- A mendahului B.\n- C berada di belakang D.\n- B berada di depan D.\n- E berada di depan A.\n\nUrutan juara 1 sampai 5 yang benar adalah...", kategori: "b_indo", opsi: ["E, A, B, D, C", "A, E, B, C, D", "E, B, A, D, C", "A, B, E, D, C", "E, A, D, B, C"], jawaban: "E, A, B, D, C" },
        { pertanyaan: "Premis 1: Semua pahlawan tidak pernah korupsi.\nPremis 2: Semua guru adalah pahlawan.\n\nKesimpulannya...", kategori: "b_indo", opsi: ["Beberapa guru korupsi", "Semua yang korupsi bukan guru", "Semua guru tidak pernah korupsi", "Ada guru yang korupsi", "Semua pahlawan adalah guru"], jawaban: "Semua guru tidak pernah korupsi" },
        { pertanyaan: "Perhatikan kalimat berikut:\n'Meskipun hujan turun dengan deras, tetapi Budi tetap berangkat ke sekolah.'\n\nPerbaikan yang tepat agar kalimat tersebut menjadi efektif adalah...", kategori: "b_indo", opsi: ["Menghilangkan kata 'Meskipun'", "Menghilangkan kata 'tetapi'", "Mengganti 'tetapi' dengan 'namun'", "Mengganti 'Meskipun' dengan 'Walaupun'", "Menambahkan koma setelah kata 'Budi'"], jawaban: "Menghilangkan kata 'tetapi'" },
        { pertanyaan: "Hubungan kata BURUNG : TERBANG sejalan dengan analogi...", kategori: "b_indo", opsi: ["Ikan : Berenang", "Kucing : Mengeong", "Kuda : Rumput", "Ular : Melilit", "Katak : Kolam"], jawaban: "Ikan : Berenang" },
        { pertanyaan: "Lengkapi analogi berikut!\n\nDOKTER : RESEP = ... : ...", kategori: "b_indo", opsi: ["Polisi : Pistol", "Hakim : Vonis", "Koki : Dapur", "Guru : Murid", "Pilot : Pesawat"], jawaban: "Hakim : Vonis" },
        { pertanyaan: "Antonim dari kata SPORADIS adalah...", kategori: "b_indo", opsi: ["Jarang", "Sering", "Menyebar", "Berhenti", "Terpisah"], jawaban: "Sering" },
        { pertanyaan: "Kata 'kritis' dalam kalimat 'Pasien itu dalam keadaan kritis' memiliki makna...", kategori: "b_indo", opsi: ["Tajam dalam menganalisis", "Kecaman", "Gawat", "Penting", "Mendesak"], jawaban: "Gawat" },
        { pertanyaan: "Penulisan gelar akademik yang benar dan sesuai ejaan adalah...", kategori: "b_indo", opsi: ["Prof. Dr. Ir. H. Budi Santoso, M.Si.", "Prof, Dr. Ir. H. Budi Santoso, M,Si.", "Prof. Dr. Ir. H. Budi Santoso M.Si", "Prof. Dr, Ir, H. Budi Santoso, M.Si.", "Prof. Dr. Ir. H. Budi Santoso. M.Si."], jawaban: "Prof. Dr. Ir. H. Budi Santoso, M.Si." },
        { pertanyaan: "Di bawah ini yang merupakan kalimat opini adalah...", kategori: "b_indo", opsi: ["Ibukota Indonesia saat ini adalah Jakarta.", "Air mendidih pada suhu 100 derajat Celcius.", "Belajar matematika itu sangat menyenangkan.", "Matahari terbit dari sebelah timur.", "Satu minggu terdiri dari tujuh hari."], jawaban: "Belajar matematika itu sangat menyenangkan." },
        { pertanyaan: "Sinonim dari kata 'Sinergi' adalah...", kategori: "b_indo", opsi: ["Persaingan", "Kerja sama", "Pemisahan", "Benturan", "Pertahanan"], jawaban: "Kerja sama" },
        { pertanyaan: "Makna kata 'mengakomodasi' yang paling tepat adalah...", kategori: "b_indo", opsi: ["Menolak permintaan", "Menyediakan sesuatu untuk memenuhi kebutuhan", "Mengambil alih kekuasaan", "Meninggalkan tanggung jawab", "Membiarkan sesuatu terjadi"], jawaban: "Menyediakan sesuatu untuk memenuhi kebutuhan" },

        // --- B. INGGRIS / LITERASI B. INGGRIS ---
        { pertanyaan: "The proliferation of misinformation on social media has exacerbated societal polarization.\n\n'Exacerbated' is closest in meaning to...", kategori: "b_inggris", opsi: ["Alleviated", "Worsened", "Mitigated", "Elucidated", "Vindicated"], jawaban: "Worsened" },
        { pertanyaan: "If she had known about the severe traffic, she would have taken the train instead.\n\nThis means that...", kategori: "b_inggris", opsi: ["She knew about the traffic and took the train.", "She didn't know about the traffic and didn't take the train.", "She took the train because of the traffic.", "She knew about the traffic but drove anyway.", "The train was delayed."], jawaban: "She didn't know about the traffic and didn't take the train." },
        { pertanyaan: "The study reveals a compelling correlation between sleep deprivation and cognitive decline.\n\n'Compelling' means...", kategori: "b_inggris", opsi: ["Boring", "Convincing", "Weak", "Irrelevant", "Confusing"], jawaban: "Convincing" },
        { pertanyaan: "Not only ___ the exam, but she also got a fully-funded scholarship.", kategori: "b_inggris", opsi: ["she passed", "she did pass", "did she pass", "passed she", "does she pass"], jawaban: "did she pass" },
        { pertanyaan: "Unless immediate action is taken to curb carbon emissions, the damage to the ecosystem will be irreversible.\n\nThe sentence implies...", kategori: "b_inggris", opsi: ["Action has already been taken.", "Emissions are currently low.", "Immediate action is necessary to prevent permanent damage.", "Irreversible damage is impossible.", "Carbon emissions are beneficial."], jawaban: "Immediate action is necessary to prevent permanent damage." },

        // --- IPA / SAINTEK ---
        { pertanyaan: "Sebuah balok bermassa 2 kg meluncur pada bidang miring licin (sudut 30° terhadap horizontal).\n\nJika g = 10 m/s², besar gaya normal yang dialami balok adalah...", kategori: "ipa", opsi: ["10 N", "10√3 N", "20 N", "20√3 N", "5 N"], jawaban: "10√3 N" },
        { pertanyaan: "Sebanyak 5,85 gram NaCl (Mr = 58,5) dilarutkan dalam air hingga volume larutan menjadi 500 mL.\n\nMolaritas (konsentrasi) larutan tersebut adalah...", kategori: "ipa", opsi: ["0,05 M", "0,10 M", "0,20 M", "0,40 M", "0,50 M"], jawaban: "0,20 M" },
        { pertanyaan: "Tahapan pada respirasi seluler aerob yang menghasilkan molekul ATP paling banyak terjadi pada...", kategori: "ipa", opsi: ["Glikolisis", "Dekarboksilasi Oksidatif", "Siklus Krebs", "Transpor Elektron", "Fermentasi"], jawaban: "Transpor Elektron" },
        { pertanyaan: "Dua hambatan 4 ohm dan 6 ohm dirangkai paralel, lalu dihubungkan dengan baterai 12 V.\n\nKuat arus total yang mengalir pada rangkaian adalah...", kategori: "ipa", opsi: ["1 A", "2 A", "3 A", "4 A", "5 A"], jawaban: "5 A" },
        { pertanyaan: "Berapakah pH larutan CH₃COOH 0,1 M (Ka = 10⁻⁵)?", kategori: "ipa", opsi: ["1", "2", "3", "4", "5"], jawaban: "3" }
    ];

    const namaPaketPenyisihan = ['Paket A - UTBK Lengkap', 'Paket B - UTBK Lengkap'];

    for (let p = 0; p < namaPaketPenyisihan.length; p++) {
        const paketPenyisihan = await prisma.paketSoal.create({
            data: {
                nama: namaPaketPenyisihan[p],
                babak: 'penyisihan'
            }
        });

        console.log(`✅ [${paketPenyisihan.nama}] berhasil dibuat.`);

        // --- PROSES MENGACAK SOAL ---
        const soalDiacak = shuffleArray([...soalPenyisihanAsli]);

        const dataInsertPenyisihan = soalDiacak.map(soal => ({
            pertanyaan: soal.pertanyaan,
            kategori: soal.kategori,
            tipe: 'pilihan_ganda',
            opsiJawaban: soal.opsi,
            jawabanBenar: soal.jawaban,
            poin: 25,
            status: 'belum',
            waktuMulai: null,
            paketSoalId: paketPenyisihan.id
        }));

        await prisma.soal.createMany({ data: dataInsertPenyisihan });
        console.log(`   -> Berhasil memasukkan ${dataInsertPenyisihan.length} soal UTBK ke dalam ${paketPenyisihan.nama} secara ACAK.`);
    }

    console.log("\n🎉 Seeding Penyisihan 35 Soal (Urutan Acak & Diformat) selesai!");
}

main().catch(console.error).finally(() => prisma.$disconnect());