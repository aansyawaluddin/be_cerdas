import prisma from '../utils/prisma.js';

export const pesertaController = {
    registerTim: async (req, res) => {
        try {
            const { namaSekolah, namaSiswa1, wa1, namaSiswa2, wa2, namaSiswa3, wa3 } = req.body;

            const fotoTim = req.file ? req.file.filename : null;

            if (!namaSekolah || !namaSiswa1 || !wa1) {
                return res.status(400).json({
                    success: false,
                    message: "Nama Sekolah dan data minimal Siswa 1 wajib diisi!"
                });
            }

            if (!fotoTim) {
                return res.status(400).json({
                    success: false,
                    message: "Foto tim wajib diupload!"
                });
            }

            const daftarAnggota = [{ nama: namaSiswa1, whatsapp: wa1 }];
            if (namaSiswa2 && wa2) daftarAnggota.push({ nama: namaSiswa2, whatsapp: wa2 });
            if (namaSiswa3 && wa3) daftarAnggota.push({ nama: namaSiswa3, whatsapp: wa3 });

            const timBaru = await prisma.tim.create({
                data: {
                    namaSekolah: namaSekolah,
                    fotoTim: fotoTim,
                    anggota: {
                        create: daftarAnggota
                    }
                },
                include: {
                    anggota: true
                }
            });

            return res.status(201).json({
                success: true,
                message: "Pendaftaran Tim berhasil!",
                data: timBaru
            });

        } catch (error) {
            console.error("Error register tim:", error);
            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan pada server saat mendaftar.",
                error: error.message
            });
        }
    }
};