import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Membersihkan data Paket Soal dan Soal lama...');

    await prisma.soal.deleteMany({});
    await prisma.paketSoal.deleteMany({});

    console.log('✨ Database bersih! Memulai seeding Bank Soal Penyisihan...');

    const soalPenyisihanAsli = [
        { pertanyaan: "Besaran pokok dalam SI adalah…", kategori: "ipa", opsi: ["Kecepatan", "Massa", "Gaya", "Energi"], jawaban: "Massa" },
        { pertanyaan: "Sinonim dari kata “cerdas” adalah…", kategori: "b_indo", opsi: ["Bodoh", "Pintar", "Malas", "Lambat"], jawaban: "Pintar" },
        { pertanyaan: "Benua terbesar di dunia adalah…", kategori: "ipa", opsi: ["Afrika", "Asia", "Amerika", "Eropa"], jawaban: "Asia" },
        { pertanyaan: "2, 4, 8, 16, …", kategori: "mtk", opsi: ["18", "24", "32", "64"], jawaban: "32" },
        { pertanyaan: "Bus kota A, B, C, D, E dan F siap diberangkatkan. Bus A dan F dari perusahaan Habi. Bus E dan B dari perusahaan GreenBird. C dan D dari perusahaan Grob. Setiap jam hanya dua perusahaan yang boleh memberangkatkan bus. Maka, kemungkinan bus yang diberangkatkan bersamaan dalam satu jam adalah ….", kategori: "mtk", opsi: ["A, D, B, F", "D, C, E, A", "E, A, B, F", "E, A, F, C", "F, D, B, A"], jawaban: "D, C, E, A" },
        { pertanyaan: "Kata “berlari” termasuk…", kategori: "b_indo", opsi: ["Nomina", "Verba", "Adjektiva", "Konjungsi"], jawaban: "Verba" },
        { pertanyaan: "Pada suatu jamuan makan malam 8 orang eksekutif muda (Aga, Didi, Lala, Laura, Gael, Michael, Rani, dan Togi) duduk mengelilingi satu meja bundar. Gael duduk berseberangan dengan Aga. Michael duduk diantara Togi dan Lala. Laura dan Lala tepat duduk berhadapan. Togi duduk 2 kursi terpisah dari Aga. Bila Michael dan Rani duduk berseberangan pernyataan di bawah ini yang benar adalah…", kategori: "b_indo", opsi: ["Gael duduk berhadapan dengan Didi.", "Gael duduk di sebelah Michael.", "Lala duduk di sebelah Didi", "Didi duduk di antara Aga dan Lala"], jawaban: "Didi duduk di antara Aga dan Lala" },
        { pertanyaan: "Empat pecatur : A, B, C, dan D, bertanding dalam suatu turnamen catur. Setiap pemain saling bertemu satu kali. Dalam setiap pertandingan, pemain yang menang, seri, dan, kalah, berturut-turut mendapatkan nilai 2, 1, dan 0. Data hasil pertandingan adalah A menang dua kali, B seri dua kali, C kalah dua kali, dan D tidak pernah seri. Jika B kalah melawan D, maka ....", kategori: "mtk", opsi: ["A juara kedua", "B juara kedua", "C juara kedua", "D juara kedua"], jawaban: "B juara kedua" },
        { pertanyaan: "pH < 7 bersifat…", kategori: "ipa", opsi: ["Basa", "Netral", "Asam", "Garam"], jawaban: "Asam" },
        { pertanyaan: "Interaksi sosial terjadi jika ada…", kategori: "b_indo", opsi: ["Individu saja", "Kontak dan komunikasi", "Kelompok saja", "Konflik"], jawaban: "Kontak dan komunikasi" },
        { pertanyaan: "41 37 35 35 31 29 29 …", kategori: "mtk", opsi: ["33", "31", "25", "29"], jawaban: "25" },
        { pertanyaan: "Kata baku dari “aktifitas”…", kategori: "b_indo", opsi: ["Aktifitas", "Aktivitas", "Aktifitasan", "Aktiv"], jawaban: "Aktivitas" },
        { pertanyaan: "A F G L M R S…", kategori: "mtk", opsi: ["Z", "Y", "X", "U"], jawaban: "X" },
        { pertanyaan: "Saat terluka, hewan seperti anjing atau kucing akan menjilati lukanya hingga sembuh. Air liur hewan memang mengandung senyawa antiseptik yang dapat membasmi bakteri. Jika begitu, bagaimana dengan air liur manusia? Ternyata air liur manusia sedikit berbeda dengan air liur hewan. Walau tidak bisa langsung menyembuhkan, air liur manusia bisa dimanfaatkan untuk perawatan luka. Manakah pernyataan berikut yang MELEMAHKAN informasi pada teks di atas?", kategori: "b_indo", opsi: ["Penggunaan air liur manusia terhadap luka justru berbahaya karena mengandung bakteri yang tidak diketahui.", "Air liur manusia mengandung histatin yang bersifat antimikroba sehingga dapat menghalau infeksi.", "Terdapat beberapa syarat penerapan agar air liur manusia dapat membantu merawat luka.", "Pada air liur hewan terdapat kandungan epidermal growth factor yang berperan penting dalam penyembuhan luka."], jawaban: "Penggunaan air liur manusia terhadap luka justru berbahaya karena mengandung bakteri yang tidak diketahui." },
        { pertanyaan: "Hukum Newton I adalah hukum…", kategori: "ipa", opsi: ["Aksi reaksi", "Inersia", "Percepatan", "Gravitasi"], jawaban: "Inersia" },
        { pertanyaan: "Mata uang Jepang adalah…", kategori: "b_indo", opsi: ["Yuan", "Yen", "Won", "Dollar"], jawaban: "Yen" },
        { pertanyaan: "Kalimat efektif adalah…", kategori: "b_indo", opsi: ["Saya pergi ke pasar dan saya membeli sayur", "Saya ke pasar membeli sayur", "Saya pergi ke pasar untuk membeli sayur", "Saya pergi pasar beli sayur"], jawaban: "Saya pergi ke pasar untuk membeli sayur" },
        { pertanyaan: "Energi kinetik dipengaruhi oleh…", kategori: "ipa", opsi: ["Massa dan kecepatan", "Massa dan suhu", "Volume dan massa", "Tekanan dan volume"], jawaban: "Massa dan kecepatan" },
        { pertanyaan: "Guru A menyatakan bahwa nilai mata pelajaran sejarah murid kelas XI semester 2 meningkat setelah dimanfaatkannya museum sebagai salah satu sumber belajar. Manakah pernyataan di bawah ini, yang jika benar, akan memperkuat argumen guru A di atas?", kategori: "b_indo", opsi: ["Kenaikan nilai tidak hanya terjadi pada mata pelajaran sejarah.", "Pemanfaatan museum adalah metode terbaik untuk belajar sejarah.", "Keberhasilan peningkatan nilai mata pelajaran sejarah telah terjadi di kelas XI semester 1.", "Museum adalah tempat terbaik untuk belajar"], jawaban: "Pemanfaatan museum adalah metode terbaik untuk belajar sejarah." },
        { pertanyaan: "ASEAN berdiri tahun…", kategori: "b_indo", opsi: ["1965", "1967", "1970", "1975"], jawaban: "1967" },
        { pertanyaan: "Sebuah benda bermassa 2 kg dipercepat 2 m/s². Besar gaya yang bekerja adalah…", kategori: "ipa", opsi: ["2 N", "3 N", "4 N", "6 N"], jawaban: "4 N" },
        { pertanyaan: "Usaha yang dilakukan gaya 5 N untuk memindahkan benda sejauh 4 m adalah…", kategori: "ipa", opsi: ["10 J", "15 J", "20 J", "25 J"], jawaban: "20 J" },
        { pertanyaan: "Massa jenis benda jika massanya 100 g dan volumenya 50 cm³ adalah…", kategori: "ipa", opsi: ["1 g/cm³", "2 g/cm³", "3 g/cm³", "4 g/cm³"], jawaban: "2 g/cm³" },
        { pertanyaan: "Energi potensial benda bermassa 1 kg pada ketinggian 5 m (g = 10 m/s²) adalah…", kategori: "ipa", opsi: ["25 J", "50 J", "75 J", "100 J"], jawaban: "50 J" },
        { pertanyaan: "Jika arus listrik 2 A mengalir selama 3 detik, maka muatan listriknya adalah…", kategori: "ipa", opsi: ["4 C", "5 C", "6 C", "8 C"], jawaban: "6 C" },
        { pertanyaan: "Sistem ekonomi Indonesia…", kategori: "b_indo", opsi: ["Liberal", "Sosialis", "Campuran", "Tradisional"], jawaban: "Campuran" },
        { pertanyaan: "Tanda kalimat tanya…", kategori: "b_indo", opsi: ["Titik", "Koma", "?", "Titik dua"], jawaban: "?" },
        { pertanyaan: "Jika semua A adalah B dan B adalah C…", kategori: "mtk", opsi: ["Semua A adalah C", "Semua C adalah A", "Sebagian A bukan C", "Tidak diketahui"], jawaban: "Semua A adalah C" },
        { pertanyaan: "Fotosintesis membutuhkan…", kategori: "ipa", opsi: ["Oksigen", "Karbon dioksida dan cahaya", "Nitrogen", "Air saja"], jawaban: "Karbon dioksida dan cahaya" },
        { pertanyaan: "Distribusi adalah…", kategori: "b_indo", opsi: ["Produksi", "Penyaluran barang", "Konsumsi", "Pembelian"], jawaban: "Penyaluran barang" },
        { pertanyaan: "Choose the correct synonym of “happy”.", kategori: "b_inggris", opsi: ["Sad", "Glad", "Angry", "Tired"], jawaban: "Glad" },
        { pertanyaan: "Which sentence is grammatically correct?", kategori: "b_inggris", opsi: ["She go to school every day", "She goes to school every day", "She going to school every day", "She gone to school every day"], jawaban: "She goes to school every day" },
        { pertanyaan: "What is the antonym of “difficult”?", kategori: "b_inggris", opsi: ["Hard", "Easy", "Complicated", "Tough"], jawaban: "Easy" },
        { pertanyaan: "“I ___ a book right now.” (Present Continuous)", kategori: "b_inggris", opsi: ["read", "am reading", "reads", "reading"], jawaban: "am reading" },
        { pertanyaan: "What is the meaning of “beautiful”?", kategori: "b_inggris", opsi: ["Buruk", "Cepat", "Indah", "Besar"], jawaban: "Indah" }
    ];


    console.log("⏳ Memulai proses seeding data Paket Penyisihan...");
    const namaPaketPenyisihan = ['Paket A', 'Paket B'];

    for (let p = 0; p < namaPaketPenyisihan.length; p++) {
        const paketPenyisihan = await prisma.paketSoal.create({
            data: {
                nama: namaPaketPenyisihan[p],
                babak: 'penyisihan'
            }
        });

        console.log(`✅ [${paketPenyisihan.nama}] berhasil dibuat.`);

        const dataInsertPenyisihan = soalPenyisihanAsli.map(soal => ({
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

        await prisma.soal.createMany({
            data: dataInsertPenyisihan
        });

        console.log(`   -> Berhasil memasukkan 35 soal ke dalam ${paketPenyisihan.nama}`);
    }

    console.log("\n🎉 Seeding Penyisihan selesai! Silakan jalankan simulasi Anda.");
}

main()
    .catch((e) => {
        console.error('❌ Terjadi kesalahan saat seeding Soal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });