import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: "Akses ditolak! Token tidak tersedia, harap login." });
    }

    const rahasiaKey = process.env.JWT_SECRET || 'rahasia_cerdas_cermat_2026';

    jwt.verify(token, rahasiaKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Sesi telah habis atau token tidak valid! Silakan login ulang." });
        }

        req.user = decoded;
        next();
    });
};

export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Akses ditolak! Fitur ini hanya untuk Admin." });
    }
    next();
};