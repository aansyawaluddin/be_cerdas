import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Membersihkan data Paket Soal dan Soal lama (HANYA BABAK SEMI FINAL)...');

    const paketSemiFinalLama = await prisma.paketSoal.findMany({ where: { babak: 'semi_final' } });
    const idPaketSemi = paketSemiFinalLama.map(p => p.id);

    if (idPaketSemi.length > 0) {
        await prisma.soal.deleteMany({ where: { paketSoalId: { in: idPaketSemi } } });
        await prisma.paketSoal.deleteMany({ where: { id: { in: idPaketSemi } } });
    }

    console.log('✨ Data Semi Final bersih! Memulai seeding...');

    const paketUtama = await prisma.paketSoal.create({
        data: { nama: "Semi Final", babak: 'semi_final' }
    });
    console.log(`✅ Paket dibuat: [ID: ${paketUtama.id}] ${paketUtama.nama}`);

    const daftar50Soal = [
        // --- B. INDONESIA ---
        { pertanyaan: "Film ini bercerita tentang seorang anak yang terpisah dari keluarganya dan harus berjuang hidup sendiri di Tengah kota besar.\nPetualangan dan pertemuan dengan orang-orang baru mengubah cara pandangnya terhadap hidup.\nKutipan tersebut merupakan bagian struktur teks resensi, yaitu", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["pendahuluan", "keunggulan", "sinopsis", "kelemahan", "penutup"], jawaban: "sinopsis" },
        { pertanyaan: "Polusi udara di kota-kota besar makin mengkhawatirkan. Banyak kendaraan bermotor yang mengeluarkan asap tebal dan mencemari lingkungan.\nSelain itu, asap dari pabrik-pabrik juga ikut menyumbang buruknya kualitas udara. Akibatnya, banyak masyarakat yang terserang penyakit saluran pernapasan.\nBerdasarkan letak kalimat utamanya, teks tersebut termasuk jenis paragraf", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["deduktif", "induktif", "ineratif", "naratif", "campuran"], jawaban: "deduktif" },
        { pertanyaan: "Sementara itu, warga tetap beraktivitas dan kegiatan dengan menggunakan masker.\nPerbaikan kalimat yang tepat untuk kalimat tersebut adalah", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Sementara itu, warga tetap beraktivitas dan giat dengan menggunakan masker.", "Sementara itu, warga tetap beraktivitas dan berkegiatan dengan menggunakan masker.", "Sementara itu, warga tetap aktivitas dan berkegiatan dengan menggunakan masker.", "Sementara itu, warga tetap aktivitas dan digiatkan dengan menggubakan masker.", "Sementara itu, wara tetap beraktivitas dan menggiati dengan menggunakan masker."], jawaban: "Sementara itu, warga tetap beraktivitas dan berkegiatan dengan menggunakan masker." },

        // --- B. INGGRIS ---
        { pertanyaan: "Which sentence best shows disagreement?", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["I totally agree with you", "That’s a good idea", "I’m not sure I agree with that", "Exactly!", "I couldn’t agree more"], jawaban: "I’m not sure I agree with that" },
        { pertanyaan: "Which sentence is passive voice?", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["The teacher explains the lesson", "The lesson explains the teacher", "The lesson is explained by the teacher", "The teacher is explaining the lesson", "The teacher has explained the lesson"], jawaban: "The lesson is explained by the teacher" },
        { pertanyaan: "“If I had more time, I would join the competition.”\nThis sentence is…", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["Conditional type 0", "Conditional type 1", "Conditional type 2", "Conditional type 3", "Future continuous"], jawaban: "Conditional type 2" },

        // --- MATEMATIKA ---
        { pertanyaan: "Di bukit yang sejuk terdapat 600 peternak domba dan sapi. Ada 400 yang beternak domba dan 300 beternak sapi.\nJika A adalah jumlah minimum peternak kedua hewan tersebut dan B adalah jumlah maksimum peternak keduanya, maka B − A adalah . . .", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["350", "300", "280", "200", "150"], jawaban: "200" },
        { pertanyaan: "Antara tahun 1497 dan 1500 Amerigo Vespucci melakukan dua kali perjalanan ke ‘Dunia Baru’.\nPerjalanan pertama memakan waktu 43 hari lebih lama daripada perjalanan kedua. Dan kedua perjalanan jika digabungkan memakan waktu 1003 hari.\nBerapa hari total perjalanan yang kedua?", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["460", "480", "960", "520", "540"], jawaban: "480" },
        { pertanyaan: "Sebuah silinder A memiliki volume 22 cm3. Berapakah volume silinder lain yang memiliki jari-jari 2 kalinya silinder A, dan tingginya setengah silinder A?\n(dalam satuan cm3).", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["11", "22", "44", "66", "77"], jawaban: "44" },

        // --- FISIKA ---
        { pertanyaan: "Dalam sebuah bejana yang massanya dapat diabaikan terdapat a gram 42°C. dicampur dengan b gram es -4°C.\nternyata setelah diaduk 50% es melebur. Jika titik lebur es 0°C, kalor jenis es 0,5 kal/gr°C, kalor lebur es 80 kal/gr, maka perbandingan antara a dan b adalah ….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["1 : 4", "1 : 2", "1 : 1", "2 : 1", "4 : 1"], jawaban: "1 : 1" },
        { pertanyaan: "Pada sebuah system peredaran darah hewan, jari-jari pembuluh nadinya adalah 1,2 cm.\nDarah mengalir dari pembuluh nadi dengan kelajuan 0,40 m/s menuju ke semua pembuluh kapiler yang ada dengan kelajuan rata-rata 0,5 mm/s dan jari-jari pembuluh kapiler 8 x 10-4 cm.\nJumlah pembuluh kapiler adalah … miliar.", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["2,1", "1,8", "1,5", "1,2", "0,9"], jawaban: "1,8" },
        { pertanyaan: "Sebuah beban bermassa m yang diikatkan pada ujung kanan sebuah pegas dengan konstanta pegas k diletakkan pada lantai datar dengan ujung pegas sebelah kiri terikat pada dinding.\nBeban ditarik ke kanan sampai ke titik A yang berjarak a dari titik setimbang dan kemudian dilepaskan sehingga berosilasi.\nSetelah dilepas, beban bergerak ke kiri, melewati titik setimbang O dan berhenti sesaat di titik B sebelah kiri titik setimbang.\nApabila lantai licin sempurna serta M dan K berturut-turut adalah energi mekanik dan energi kinetic system, maka…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["K di O kurang dari K di B", "K di O sama dengan K di B", "K di O kurang dari M di A", "K di O sama dengan M di A", "K di O lebih dari M di A"], jawaban: "K di O sama dengan M di A" },

        // --- BIOLOGI ---
        { pertanyaan: "Karbon sangat dibutuhkan oleh makhluk hidup dalam proses metabolisme dan penyusunan senyawa organik.\nKeberadaan karbon di alam berlangsung melalui siklus karbon yang terjadi secara terus-menerus.\n\n[Gambar Siklus Karbon]\nProses yang terjadi pada bagian X adalah ….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Fotosintesis", "respirasi", "asimilasi", "evaporasi", "transpirasi"], jawaban: "respirasi" },
        { pertanyaan: "Seorang siswa meneliti kualitas air di sebuah kanal perkotaan. Ia memperoleh data sebagai berikut:\n\nParameter | Sebelum tercemar | Setelah tercemar\nDO | 7 mg/L | 2 mg/L\nBOD | 2 mg/L | 8 mg/L\n\nBerdasarkan data tersebut, kesimpulan yang paling tepat adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["kualitas air meningkat karena BOD tinggi", "terjadi pencemaran bahan organik yang meningkatkan aktivitas mikroorganisme", "kadar oksigen meningkat akibat penguraian bahan organik", "perairan menjadi lebih layak untuk organisme air", "tidak ada hubungan antara DO dan BOD"], jawaban: "terjadi pencemaran bahan organik yang meningkatkan aktivitas mikroorganisme" },
        { pertanyaan: "Perhatikan gambar berikut !\n\n[Gambar Sistem Reproduksi Wanita]\nKetika sel sperma berhasil menembus zona pelusida maka akan terjadi fertilisasi yang akan dilanjutkan dengan perkembangan embrio.\nFertilisasi dan perkembangan embrio terjadi…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["N dan L", "L dan M", "M dan N", "L dan P", "N dan O"], jawaban: "N dan L" },

        // --- KIMIA ---
        { pertanyaan: "Dalam analisis air limbah industri, seorang ahli kimia menemukan ion oksigen dengan karakteristik khusus.\nIon ini memiliki nomor atom 8, nomor massa 17 dan bermuatan -2.\nBerdasarkan data tersebut, spesi ion O2- mengandung jumlah proton dan elektron secara berturut-turut….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["8 proton dan 8 elektron", "8 proton dan 10 elektron", "10 proton dan 8 elektron", "9 proton dan 8 elektron", "6 proton dan 10 elektron"], jawaban: "8 proton dan 10 elektron" },
        { pertanyaan: "Unsur X dengan konfigurasi elektron: 1s2 2s2 2p6 3s2 bereaksi dengan unsur Y : 1s2 2s2 2p4 membentuk senyawa….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["XY", "XY2", "X2Y", "X3Y", "X2Y3"], jawaban: "XY" },
        { pertanyaan: "Dalam industri pemanas ruangan, gas propana (C3H8) digunakan sebagai bahan bakar. Persamaan reaksinya sebagai berikut.\nC3H8(g) + O2(g) -> CO2(g) + H2O(g) (belum setara)\nJika terdapat 5 L gas propana, volume gas oksigen yang dibutuhkan untuk pembakaran sempurna gas propana adalah….(semua volume diukur pada kondisi yang sama)", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["5 L", "10 L", "15 L", "20 L", "25 L"], jawaban: "25 L" },

        // --- PENALARAN UMUM ---
        { pertanyaan: "Badak Jawa (Rhinoceros sondaicus) adalah spesies badak yang paling langka diantara lima spesies badak yang ada di dunia.\nMakin langka suatu hewan, makin besar upaya yang harus dilakukan manusia untuk mencegahnya dari kepunahan.\nBerdasarkan pernyataan tersebut, manakah yang paling mungkin menjadi akibat dari tingkat kelangkaan Badak Jawa?", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["Badak Jawa menjadi objek wisata yang paling dicari.", "Badak Jawa sulit dikembangbiakkan secara alamiah.", "Badak Jawa sulit ditemukan di hutan yang tidak dikelola manusia.", "Badak Jawa sering menjadi sasaran objek penelitian.", "Badak Jawa membutuhkan biaya konservasi yang besar."], jawaban: "Badak Jawa membutuhkan biaya konservasi yang besar." },
        { pertanyaan: "Jumlah penjualan mie ayam di sebuah warung makan pada enam hari terakhir adalah 5, 3, 8, 11, 19, dan 30 porsi.\nSementara itu, jumlah bakso yang terjual pada enam hari yang sama adalah 4, 6, 10, 16, 26, dan 42 porsi.\nJika tren pembelian tersebut bersifat konstan, berapa jumlah porsi mie ayam dan bakso yang terjual pada hari ketujuh?", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["28 dan 50", "46 dan 68", "49 dan 50", "28 dan 70", "49 dan 68"], jawaban: "49 dan 68" },
        { pertanyaan: "Syarat untuk mendapatkan posisi sebagai asisten dosen adalah memiliki gelar sarjana, pengalaman mengikuti matakuliah secara baik, dan referensi dari para dosen pengampu.\nCalon asisten X memiliki gelar sarjana dan referensi yang kuat.\nSimpulan dari informasi tersebut adalah calon X akan diterima sebagai asisten dosen.\nManakah pernyataan berikut yang menggambarkan kualitas simpulan tersebut?", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["Simpulan tersebut pasti benar.", "Simpulan tersebut mungkin benar.", "Simpulan tersebut pasti salah.", "Simpulan tidak dapat dinilai karena informasi tidak cukup.", "Simpulan tidak relevan dengan informasi yang diberikan."], jawaban: "Simpulan tidak dapat dinilai karena informasi tidak cukup." },

        // --- PENGETAHUAN KUANTITATIF ---
        { pertanyaan: "Jika 0°<α<90° dan tanα=1/3 , di antara pilihan berikut yang benar adalah ...\n(1) cos(α) = 1/3\n(2) sin(α) = 3/√10\n(3) cos(α) < tan(α)\n(4) tan(90°-α) = 3", kategori: "pengetahuan_kuantitatif", tipe: "pilihan_ganda", opsi: ["(1), (2), dan (3) saja", "(1) dan (3) saja", "(2) dan (4) saja", "(1), (2), (3) dan (4)", "(4) saja"], jawaban: "(4) saja" },
        { pertanyaan: "Tabel berikut menyatakan hasil operasi untuk simbol ⊛ dan ⊝\n[Tabel Operasi ⊛ dan ⊝]\nOperasi ⊕ didefinisikan dengan\na⊕b = 2⊛(a⊝b)\nUntuk semua a,b ∈ {0, 1, 2, 3}\nNilai dari 0⊕2 adalah...", kategori: "pengetahuan_kuantitatif", tipe: "pilihan_ganda", opsi: ["0", "1", "2", "3", "4"], jawaban: "2" },
        { pertanyaan: "Perhatikan algoritma yang disajikan pada diagram berikut.\n[Gambar Algoritma 1]\nKeterangan : Bilangan asli m dan n memenuhi kedua pernyataan berikut.\nInput x = 3 menghasilkan z = 12 .\nInput x = 4 menghasilkan z = 18\nNilai m adalah...", kategori: "pengetahuan_kuantitatif", tipe: "pilihan_ganda", opsi: ["1", "2", "3", "4", "5"], jawaban: "2" },

        // --- SOSIAL & KEWARGANEGARAAN ---
        { pertanyaan: "Makna dari semboyan Bhinneka Tunggal Ika adalah Berbeda-beda tetapi tetap satu jua, yang memiliki fungsi utama bagi bangsa Indonesia sebagai . . .", kategori: "pkn", tipe: "pilihan_ganda", opsi: ["simbol kekayaan budaya", "alat untuk menyeragamkan budaya", "landasan hukum yang berlaku", "pemersatu keberagaman suku, agama, dan ras", "semboyan keberagaman partai politik"], jawaban: "pemersatu keberagaman suku, agama, dan ras" },
        { pertanyaan: "Letusan gunung Merapi mengeluarkan material vulkanik yang bermanfaat bagi kesuburan tanah sehingga penduduk di desa Cangkringan sekitar gunung Merapi, enggan dipindahkan dari areal yang berbahaya.\nPrinsip geografi yang berkaitan dengan hal tersebut adalah ....", kategori: "geografi", tipe: "pilihan_ganda", opsi: ["prinsip persebaran", "prinsip deskripsi", "prinsip distribusi", "prinsip korologi", "prinsip interelasi"], jawaban: "prinsip interelasi" },
        { pertanyaan: "Perhatikan nama-nama suku di bawah ini :\n1) Suku Nias\n2) Suku Toraja\n3) Suku Jawa\n4) Suku Dayak\n5) Suku Baduy\nDari nama suku di atas yang merupakan bangsa Proto Melayu adalah nomor…", kategori: "sejarah", tipe: "pilihan_ganda", opsi: ["1, 4, dan 5", "1, 3, dan 4", "1, 2, dan 4", "3, 4, dan 5", "2, 3, dan 5"], jawaban: "1, 2, dan 4" },
        { pertanyaan: "Perhatikan sikap dan tindakan berikut!.\n1) Mengembangkan sikap intoleransi antar individu\n2) Mengedepankan sikap saling tolong menolong\n3) Mengabaikan nilai dan norma sosial yang berlaku\n4) Menjadi media penyatu pola pikir dan tujuan yang berbeda\n5) Menyelesaikan permasalahan melalui musyawarah mufakat\nHubungan sosial yang positif ditunjukkan oleh nomor ….", kategori: "sosiologi", tipe: "pilihan_ganda", opsi: ["1, 2 dan 3", "1, 2 dan 4", "2, 3 dan 4", "2, 4 dan 5", "3, 4 dan 5"], jawaban: "2, 4 dan 5" },
        { pertanyaan: "Pernyataan berikut merupakan kelebihan sistem ekonomi.\n1) Produk yang dihasilkan lebih berkualitas.\n2) Perekonomian relatf stabil dan jarang terjadi krisis ekonomi.\n3) Fakir miskin dan anak terlantar dipelihara oleh negara.\n4) Mengutamakan kepentingan bersama daripada kepentingan individu.\n5) Daya inisiatif, kreasi, dan persaingan individu bisa berkembang.\nYang merupakan kelebihan sistem demokrasi ekonomi ditunjukkan oleh angka ….", kategori: "ekonomi", tipe: "pilihan_ganda", opsi: ["1), 2), dan 3)", "1), 3), dan 4)", "1), 4), dan 5)", "2), 3), dan 4)", "3), 4), dan 5)"], jawaban: "3), 4), dan 5)" },
        { pertanyaan: "Al-Quran sebagai pedoman hidup umat manusia, mengajarkan agar manusia menjaga kedamaian dan tolong menolong di dalam menjalani kehidupan.\nWalaupun hidup dalam perbedaan tetapi harus tetap saling menghormati. Perilaku yang tidak mencerminkan beriman kepada ajaran al-Quran di lingkungan sekolah adalah….", kategori: "agama", tipe: "pilihan_ganda", opsi: ["menolong teman yang mengalami kesulitan tanpa memandang agamanya", "menghormati pemeluk agama lain yang melaksanakan ibadah", "bekerja sama antar pemeluk agama di sekolah untuk melakukan bakti sosial", "menghindari bergaul dengan teman yang berlainan agama dengannya", "menghargai semua temannya walaupun berbeda suku"], jawaban: "menghindari bergaul dengan teman yang berlainan agama dengannya" },

        // --- B. INDONESIA (Bagian 2) ---
        { pertanyaan: "Banyak masyarakat mengeluhkan sulitnya mendapatkan air bersih. Air tanah yang makin tercemar limbah membuat masyarakat harus membeli air galon untuk keperluan sehari-hari.\nTidak hanya itu, sumber air dari sumur pun sudah tidak layak konsumsi.\nKondisi ini menunjukkan bahwa masalah air bersih harus segera ditangani oleh pemerintah.\nBerdasarkan letak kalimat utamanya, teks tersebut termasuk jenis paragraf", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["campuran", "ineratif", "induktif", "deduktif", "deskriptif"], jawaban: "induktif" },
        { pertanyaan: "Truk antikabut menyemprotkan udara di terlihat sepanjang jalan.\nKalimat tersebut akan sempurna apabila diperbaiki menjadi", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Truk antikabut udara di terlihat menyemprotkan sepanjang jalan.", "Truk menyemprotkan antikabut udara di terlihat sepanjang jalan.", "Truk antikabut terlihat menyemprotkan udara di sepanjang jalan.", "Truk antikabut terlihat udara menyemprotkan di sepanjang jalan.", "Truk antikabut sepanjang terlihat menyemprotkan udara jalan."], jawaban: "Truk antikabut terlihat menyemprotkan udara di sepanjang jalan." },
        { pertanyaan: "Meskipun buku ini menarik, tetapi ada beberapa bagian yang terasa terlalu lambat dan berulang-ulang.\nHal ini membuat pembaca agak bosan di tengah cerita.\nKutipan tersebut merupakan bagian dari struktur teks resensi, yaitu", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["sinopsis", "kelemahan", "keunggulan", "pendahuluan", "penutup"], jawaban: "kelemahan" },

        // --- B. INGGRIS (Bagian 2) ---
        { pertanyaan: "Which sentence shows strong agreement?", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["I’m not sure", "I disagree", "That might be true", "I completely agree", "I doubt it"], jawaban: "I completely agree" },
        { pertanyaan: "Which is correct passive form?", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["People speak English worldwide", "English is spoken worldwide", "English speaks worldwide", "People are spoken English", "Spoken English worldwide"], jawaban: "English is spoken worldwide" },
        { pertanyaan: "“If she studies hard, she will pass the exam.”\nThis is…", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["Type 0", "Type 1", "Type 2", "Type 3", "Mixed conditional"], jawaban: "Type 1" },

        // --- MATEMATIKA (Bagian 2) ---
        { pertanyaan: "Rumah di Jalan Veteran dinomori secara urut mulai dari 1 sampai 150. Berapa banyak rumah yang nomornya menggunakan angka 8 sekurang-kurangnya satu kali . . .", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["14", "15", "21", "24", "30"], jawaban: "24" },
        { pertanyaan: "Dalam sebuah komunitas yang beranggota 800 orang, ternyata 400 orang suka membaca dan 620 orang menulis.\nJika x adalah jumlah maksimal orang yang suka keduanya dan y adalah jumlah minimal yang suka keduanya, maka x + y = . . .", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["400", "530", "620", "710", "890"], jawaban: "620" },
        { pertanyaan: "Alas sebuah segitiga memiliki panjang 𝑏, dan memiliki hubungan dengan tinggi ℎ. Hubungan tersebut memenuhi 𝑏 = 2ℎ.\nManakah ekspresi matematika berikut yang menyatakan luas segitiga dalam bentuk ℎ?", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["1/2 h2", "3/4 h2", "h2", "3/2 h2", "2 h2"], jawaban: "h2" },

        // --- FISIKA (Bagian 2) ---
        { pertanyaan: "Ke dalam sebuah bejana yang berisi a gram air 30°C dimasukkan b gram es -2°C.\nsetelah isi bejana diaduk, ternyata semua es melebur. Bila massa bejana diabaikan, kalor jenis es 0,5 kal/gr°C dan kalor lebur es 80 kal/gr, maka besar perbandingan antara a dan b adalah ….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["27 : 10", "8 : 3", "10 : 27", "3 : 8", "1 : 30"], jawaban: "27 : 10" },
        { pertanyaan: "Pada pukul 07.00 WITA, sebuah kolam penampungan air berbentuk kubus dengan sisi 1 m akan diisi air dari keadaan kosong melalui kran air yang penampangnya 2 cm2.\nJika rata-rata air mengalir dengan kecepatan 5 m/s, maka kolam akan penuh pada pukul ….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["07.16", "07.16 lebih 40 detik", "07.26", "07.26 lebih 40 detik", "07.36"], jawaban: "07.16 lebih 40 detik" },
        { pertanyaan: "Sebuah beban bermassa m yang diikatkan pada ujung kanan sebuah pegas dengan konstanta pegas k diletakkan pada lantai datar dengan ujung pegas sebelah kiri terikat pada dinding.\nBeban ditarik ke kanan sampai ke titik A yang berjarak a dari titik setimbang dan kemudian dilepaskan sehingga berosilasi.\nSetelah dilepas, beban bergerak ke kiri, melewati titik setimbang O dan berhenti sesaat di titik B, di sebelah kiri titik setimbang.\nApabila Ep dan Ek berturut-turut adalah energi potensial dan energi kinetic system, serta Ek di O sama dengan Ep di A, pernyataan yang benar adalah ….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Jarak titik B ke titik setimbang kurang dari a", "Jarak titik B ke titik setimbang lebih dari a", "Energi mekanik berkurang", "Lantai licin sempurna", "Lantai kasar"], jawaban: "Lantai licin sempurna" },

        // --- BIOLOGI (Bagian 2) ---
        { pertanyaan: "Nitrogen sangat dibutuhkan oleh tanaman dalam pertumbuhannya. Keberadaan Nitrogen melalui proses siklus nitrogen yang terjadi di alam.\n\n[Gambar Siklus Nitrogen]\nSecara berurutan, proses yang terjadi pada bagian X dan Y adalah aktivitas bakteri dalam proses ….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["nitrifikasi dan denitrifikasi", "nitrifikasi dan fiksasi nitrogen", "fiksasi nitrogen dan nitrifikasi", "denitrifikasi dan fiksasi nitrogen", "fiksasi nitrogen dan denitrifikasi"], jawaban: "fiksasi nitrogen dan nitrifikasi" },
        { pertanyaan: "Karbon dioksida menyumbang 75% emisi gas rumah kaca sehingga konsentrasi gas rumah kaca dapat meningkat drastis akibat emisi karbon dioksida dan gas-gas rumah kaca yang dihasilkan oleh berbagai aktivitas manusia di muka bumi ini.\nSelanjutnya secara global, 25% atau seperempat dari seluruh emisi karbon dioksida dunia berasal dari masalah-masalah kehutanan, sedangkan sisanya dihasilkan dari pembakaran bahan bakar fosil, yaitu minyak bumi dan batu bara.\nEmisi gas CO₂ yang berlebihan di udara menimbulkan peristiwa...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["lubang ozon", "asfiksi", "global warming", "hujan asam", "eutrofikasi"], jawaban: "global warming" },
        { pertanyaan: "Perhatikan struktur nefron berikut!\n\n[Gambar Struktur Nefron]\nAbi sedang mempelajari proses pembentukan urin di ginjal. Ia mengamati bahwa pada bagian yang bertanda X terjadi proses penting yang berfungsi mengembalikan zat-zat yang masih dibutuhkan tubuh ke dalam darah.\nProses ini sangat penting untuk menjaga keseimbangan cairan dan mencegah kehilangan zat berguna dalam urin.\nBerdasarkan informasi tersebut, proses yang terjadi pada bagian X adalah …", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Penyerapan kembali air, glukosa, dan garam", "Penyaringan darah", "Pembentukan urin primer", "Pembentukan senyawa NH₃", "Pembentukan urin sesungguhnya"], jawaban: "Penyerapan kembali air, glukosa, dan garam" },

        // --- KIMIA (Bagian 2) ---
        { pertanyaan: "Seorang dokter menjelaskan bahwa atom natrium dalam senyawa garam dapur (NaCl) berbeda dengan atom natrium murni.\nDalam garam dapur, natrium berbentuk ion Na+ dengan nomor atom 11 dan nomor massa 23. Ion Na+ ini mengandung jumlah elektron dan neutron secara berturut-turut….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["8 elektron dan 10 neutron", "10 elektron dan 8 neutron", "10 elektron dan 12 neutron", "11 elektron dan 12 neutron", "12 elektron dan 10 neutron"], jawaban: "10 elektron dan 12 neutron" },
        { pertanyaan: "Unsur P dan Q memiliki konfigurasi elektron sebagai berikut.\nP : [Ar] 4s2\nQ : [Ne] 3s2 3p5\nApabila unsur P dan Q membentuk senyawa, rumus senyawa yang terbentuk adalah….", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["PQ", "PQ2", "PQ3", "P2Q", "P3Q"], jawaban: "PQ2" },
        { pertanyaan: "Seorang teknisi kompor gas melakukan uji pembakaran metana (CH4) untuk memastikan efisiensi kompor.\nDalam pembakaran sempurna, 5 L gas metana direaksikan dengan oksigen sesuai persamaan reaksi berikut:\nCH4(g) + O2(g) -> CO2(g) + H2O(g) (belum setara)\nVolume gas oksigen yang diperlukan untuk pembakaran sempurna tersebut adalah…. (semua volume diukur pada kondisi yang sama)", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["5 L", "8 L", "10 L", "12,5 L", "15 L"], jawaban: "10 L" },

        // --- PENALARAN UMUM (Sisa Bagian) ---
        { pertanyaan: "Gandum adalah bahan makanan yang paling digemari masyarakat di Negara X. Makin digemari makanan di suatu negara, makin banyak bahan makanan tersebut ditanam.\nBerdasarkan informasi di atas, manakah pernyataan sebab-akibat berikut yang PALING MUNGKIN BENAR?", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["Gandum sebagai makanan pokok Negara X tidak bisa digantikan makanan lainnya.", "Banyaknya orang menanam gandum dipengaruhi oleh minat masyarakat untuk mengonsumsinya.", "Pemerintah Negara X harus menyediakan bibit gandum untuk kebutuhan pokok masyarakatnya.", "Kegemaran terhadap makanan menjadi bahan pertimbangan industri pertanian di suatu negara.", "Makanan pokok selain gandum cenderung tidak diminati masyarakat di Negara X."], jawaban: "Banyaknya orang menanam gandum dipengaruhi oleh minat masyarakat untuk mengonsumsinya." },
        { pertanyaan: "Jumlah penjualan laptop pada minggu kedua sampai keenam secara berturut-turut adalah 18, 14, 17, 13, dan 16 unit.\nJika jumlah penjualan tersebut bersifat konstan, berapakah laptop yang terjual pada minggu pertama?", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["11", "12", "15", "21", "22"], jawaban: "15" }
    ];

    const dataInsertUtama = daftar50Soal.map(soal => ({
        paketSoalId: paketUtama.id,
        pertanyaan: soal.pertanyaan,
        kategori: soal.kategori,
        tipe: soal.tipe,
        opsiJawaban: soal.opsi,
        jawabanBenar: soal.jawaban,
        poin: 10,
        status: "belum"
    }));

    await prisma.soal.createMany({ data: dataInsertUtama });
    console.log(`   -> Berhasil memasukkan ${daftar50Soal.length} soal ke dalam ${paketUtama.nama}`);

    // ==========================================
    // 2. BUAT PAKET REBUTAN (5 SOAL SISA DARI DOC)
    // ==========================================
    const paketRebutan = await prisma.paketSoal.create({
        data: { nama: "Semi Final - Rebutan", babak: 'semi_final' }
    });
    console.log(`✅ Paket dibuat: [ID: ${paketRebutan.id}] ${paketRebutan.nama}`);

    const daftarSoalRebutan = [
        { pertanyaan: "Tedi menyatakan: Ketika saya pergi memancing beberapa hari yang lalu, setiap ikan yang saya tangkap adalah salmon, dan setiap salmon yang saya lihat saya tangkap.\nSimpulan dari pengamatan Tedi adalah saat Tedi memancing, dia tidak menangkap ikan apa pun selain salmon.\nManakah pernyataan berikut yang menggambarkan kualitas simpulan tersebut?", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["Simpulan tersebut pasti benar", "Simpulan tersebut mungkin benar", "Simpulan tersebut pasti salah", "Simpulan tidak relevan dengan informasi yang diberikan", "Simpulan tidak dapat dinilai karena informasi tidak cukup"], jawaban: "Simpulan tersebut pasti benar" },
        { pertanyaan: "Jika 0°<α<90° dan cosα=3/4 , di antara pilihan berikut yang benar adalah . . .\n(1) tanα=4/3\n(2) sin(α-90°)=-3/4\n(3) tan(90°-α)=-3/7\n(4) cos(α-180°)<sin(180°-α)", kategori: "pengetahuan_kuantitatif", tipe: "pilihan_ganda", opsi: ["(1), (2), dan (3)", "(1) dan (3)", "(2) dan (4)", "(4)", "(1), (2), (3), dan (4)"], jawaban: "(2) dan (4)" },
        { pertanyaan: "Operasi ⨂ dan ⊖ pada bilangan didefinisikan sebagai berikut.\na⊗b = (2-(a x b)) / (a+b)\nc⊝d = c+10d\nNilai dari 3⊖(4⨂(-1)) adalah... .", kategori: "pengetahuan_kuantitatif", tipe: "pilihan_ganda", opsi: ["7", "8", "9", "10", "11"], jawaban: "11" },
        { pertanyaan: "Perhatikan algoritma yang disajikan pada diagram berikut.\n\n[Gambar Algoritma 2]\nKeterangan : Bilangan asli m dan n memenuhi kedua pernyataan berikut.\nInput x = 3 menghasilkan z = 12 .\nInput x = 4 menghasilkan z = 18\nNilai n adalah ...", kategori: "pengetahuan_kuantitatif", tipe: "pilihan_ganda", opsi: ["1", "2", "3", "4", "5"], jawaban: "3" },
        { pertanyaan: "Apabila presiden dan wakil presiden tidak dapat menjalankan kewajiban dalam masa jabatannya secara bersamaan, maka pelaksanaan tugas kepresidenan adalah.....", kategori: "pkn", tipe: "pilihan_ganda", opsi: ["menteri luar negeri, menteri dalam negeri, dan menteri pertahanan", "menteri luar negeri, menteri pertahanan, dan menteri sekretariat negara", "menteri dalam negeri, menteri hukum dan HAM, serta menteri luar negeri", "menteri pertahanan, menteri hukum dan ham, serta menteri sekretariatan negara", "menteri dalam negeri, menteri pertahanan, serta menteri koordinator politik dan keamanan"], jawaban: "menteri luar negeri, menteri dalam negeri, dan menteri pertahanan" }
    ];

    const dataInsertRebutan = daftarSoalRebutan.map(soal => ({
        paketSoalId: paketRebutan.id,
        pertanyaan: soal.pertanyaan,
        kategori: soal.kategori,
        tipe: soal.tipe,
        opsiJawaban: soal.opsi,
        jawabanBenar: soal.jawaban,
        poin: 20,
        status: "belum"
    }));

    await prisma.soal.createMany({ data: dataInsertRebutan });
    console.log(`   -> Berhasil memasukkan ${daftarSoalRebutan.length} soal ke dalam ${paketRebutan.nama}`);

    console.log("\n🎉 Seeding Data Semi Final (2 Paket) Selesai!");
}

main().catch(console.error).finally(() => prisma.$disconnect());