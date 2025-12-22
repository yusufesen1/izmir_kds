const pool = require('../db/db');

exports.getBaseMetrics = async (req, res) => {
    try {
        const hatSorgu = `SELECT COUNT(DISTINCT durak_id) as durak_sayisi FROM yolcu_hareketleri`;
        await pool.query(hatSorgu); // Sonucu kullanmamışsın ama sorguyu tuttum
        
        const yolcuSorgu = `SELECT COUNT(*) as toplam FROM yolcu_hareketleri`;
        await pool.query(yolcuSorgu);
        
        const baseMetrics = {
            ortalama_bekleme: 18,
            ortalama_doluluk: 85,
            operasyon_maliyeti: 100,
            toplam_hat: 45,
            toplam_arac: 320
        };

        res.json(baseMetrics);
    } catch (err) {
        console.error("Operasyon API Hatası:", err.message);
        res.status(500).json({});
    }
};