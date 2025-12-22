const pool = require('../db/db');

// Yardımcı Fonksiyon (Sadece bu dosyada kullanılır)
const isimTemizle = (text) => {
    if (!text) return "";
    let temiz = text.toString().toUpperCase('tr-TR');
    const degisimler = {
        'Ş': 'S', 'İ': 'I', 'Ğ': 'G', 'Ü': 'U', 'Ö': 'O', 'Ç': 'C',
        'ı': 'I', 'ş': 'S', 'ğ': 'G', 'ü': 'U', 'ö': 'O', 'ç': 'C'
    };
    return temiz.split('').map(char => degisimler[char] || char).join('').trim();
};

exports.getScatterData = async (req, res) => {
    try {
        const ulasimSorgusu = `
            SELECT i.ilce_adi as harita_adi, COUNT(DISTINCT d.durak_id) as durak_sayisi, COUNT(yh.islem_id) as toplam_yolcu
            FROM ilceler i
            LEFT JOIN duraklar d ON ST_Within(d.geom, i.geom)
            LEFT JOIN yolcu_hareketleri yh ON d.durak_id = yh.durak_id
            GROUP BY i.ilce_adi
        `;
        const ulasimSonuc = await pool.query(ulasimSorgusu);

        const nufusSorgusu = `SELECT ilce_adi as nufus_adi, SUM(nufus) as toplam_nufus FROM mahalle_istatistikleri GROUP BY ilce_adi`;
        const nufusSonuc = await pool.query(nufusSorgusu);

        let finalVeri = ulasimSonuc.rows.map(ulasimItem => {
            const anahtar = isimTemizle(ulasimItem.harita_adi);
            const nufusItem = nufusSonuc.rows.find(n => isimTemizle(n.nufus_adi) === anahtar);
            return {
                ilce: ulasimItem.harita_adi,
                nufus: nufusItem ? parseInt(nufusItem.toplam_nufus) : 0,
                durak_sayisi: parseInt(ulasimItem.durak_sayisi),
                toplam_yolcu: parseInt(ulasimItem.toplam_yolcu)
            };
        });

        finalVeri = finalVeri.filter(item => item.nufus > 0);
        finalVeri.sort((a, b) => b.nufus - a.nufus);
        res.json(finalVeri);
    } catch (err) {
        console.error("❌ Scatter API Hatası:", err.message);
        res.status(500).json([]);
    }
};

exports.getMapData = async (req, res) => {
    try {
        const sorgu = `
            SELECT i.ilce_adi, ST_AsGeoJSON(i.geom) as geometry, COUNT(DISTINCT d.durak_id) as durak_sayisi
            FROM ilceler i
            LEFT JOIN duraklar d ON ST_Within(d.geom, i.geom)
            GROUP BY i.ilce_adi, i.geom
        `;
        const sonuc = await pool.query(sorgu);
        const mapData = sonuc.rows.map(row => ({
            ilce_adi: row.ilce_adi,
            geometry: row.geometry,
            yogunluk: parseInt(row.durak_sayisi) 
        }));
        res.json(mapData);
    } catch (err) {
        console.error("❌ Harita API Hatası:", err.message);
        res.status(500).json([]);
    }
};

exports.getStudentStops = async (req, res) => {
    try {
        const sorgu = `
            SELECT d.durak_adi, COUNT(yh.islem_id) as kullanim_sayisi
            FROM yolcu_hareketleri yh
            JOIN duraklar d ON yh.durak_id = d.durak_id
            WHERE yh.tarife_id = 2 
            GROUP BY d.durak_adi
            ORDER BY kullanim_sayisi DESC LIMIT 8;
        `;
        const sonuc = await pool.query(sorgu);
        res.json(sonuc.rows);
    } catch (err) {
        console.error("❌ Öğrenci API Hatası:", err.message);
        res.status(500).json([]);
    }
};