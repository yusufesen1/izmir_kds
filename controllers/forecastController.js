const pool = require('../db/db');

exports.getProjectionData = async (req, res) => {
    try {
        const toplamSorgu = `SELECT COUNT(islem_id) as toplam_yolcu FROM yolcu_hareketleri`;
        const toplamSonuc = await pool.query(toplamSorgu);
        const guncelYolcu = parseInt(toplamSonuc.rows[0].toplam_yolcu) || 0;

        const gelirSorgu = `SELECT AVG(ut.ucret) as ortalama_gelir FROM yolcu_hareketleri yh JOIN ucret_tarifesi ut ON yh.tarife_id = ut.id`;
        const gelirSonuc = await pool.query(gelirSorgu);
        const ortalamaGelir = parseFloat(gelirSonuc.rows[0].ortalama_gelir) || 8.50; 

        const gecmisVeri = [];
        let simuleYolcu = guncelYolcu;

        for (let i = 0; i < 12; i++) {
            gecmisVeri.unshift({ 
                ay: `Ay -${12 - i}`, 
                yolcu: Math.round(simuleYolcu)
            });
            const rastgeleBuyume = 1.015 + (Math.random() * 0.015); 
            simuleYolcu = simuleYolcu / rastgeleBuyume;
        }

        const kapasiteSiniri = Math.round(guncelYolcu * 1.4); 

        res.json({
            gecmis: gecmisVeri,
            guncel: guncelYolcu,
            kapasite: kapasiteSiniri,
            ortalama_gelir: ortalamaGelir
        });

    } catch (err) {
        console.error("Projeksiyon API Hatası:", err.message);
        res.status(500).json({});
    }
};

exports.getDistrictGrowth = async (req, res) => {
    try {
        const sorgu = `
            SELECT i.ilce_adi, COUNT(yh.islem_id) as mevcut_yuk
            FROM ilceler i
            JOIN duraklar d ON ST_Within(d.geom, i.geom)
            JOIN yolcu_hareketleri yh ON d.durak_id = yh.durak_id
            GROUP BY i.ilce_adi ORDER BY mevcut_yuk DESC LIMIT 8;
        `;
        const sonuc = await pool.query(sorgu);
        res.json(sonuc.rows);
    } catch (err) {
        console.error("Büyüme API Hatası:", err.message);
        res.status(500).json([]);
    }
};