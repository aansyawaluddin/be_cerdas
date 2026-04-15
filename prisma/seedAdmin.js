import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🛡️ Memulai seeding Admin...');

    const adminPassword = await bcrypt.hash('123', 10);

    const admin = await prisma.tim.upsert({
        where: { username: 'admin_super' },
        update: {},
        create: {
            nama: 'Administrator Utama',
            username: 'admin_super',
            password: adminPassword,
            role: 'admin',
            grup: 0,
        },
    });

    console.log(`✅ Seeding selesai! Akun admin (${admin.username}) berhasil disiapkan.`);
}

main()
    .catch((e) => {
        console.error('❌ Terjadi kesalahan saat seeding Admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });