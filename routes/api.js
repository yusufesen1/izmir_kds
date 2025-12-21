const router = require('express').Router();
const pool = require('../db'); 

// 1. ISI HARİTASI
router.get('/heatmap', async (req, res) => {
  try {
    const sorgu = `
      SELECT d.durak_adi, d.enlem, d.boylam, yh.hat_no, COUNT(*) as yogunluk
      FROM yolcu_hareketleri yh
      JOIN duraklar d ON yh.durak_id = d.durak_id
      GROUP BY d.durak_id, d.durak_adi, d.enlem, d.boylam, yh.hat_no
      ORDER BY yogunluk DESC LIMIT 2000;
    `;
    const sonuc = await pool.query(sorgu);
    res.json(sonuc.rows);
  } catch (err) {
    console.error("Heatmap SQL Hatası:", err.message);
    res.status(500).json([]);
  }
});

// 2. YILLIK ÖZET
router.get('/yillik-ozet', async (req, res) => {
  try {
    const sorgu = `
      SELECT 
        CASE 
          WHEN hat_no = 'METRO' THEN 'METRO'
          WHEN hat_no = 'IZBAN' THEN 'IZBAN'
          WHEN hat_no LIKE '%TRAM%' THEN 'TRAMVAY'
          ELSE 'ESHOT' 
        END as tur,
        COUNT(*) as toplam
      FROM yolcu_hareketleri
      GROUP BY tur;
    `;
    const sonuc = await pool.query(sorgu);
    res.json(sonuc.rows);
  } catch (err) {
    console.error("Özet SQL Hatası:", err.message);
    res.status(500).json([]);
  }
});

// 3. TOP DURAKLAR (Sol Harita)
router.get('/top-duraklar', async (req, res) => {
  try {
    const sorgu = `
      (SELECT 'METRO' as tur, d.durak_adi, d.enlem, d.boylam, count(*) as sayi 
       FROM yolcu_hareketleri yh JOIN duraklar d ON yh.durak_id = d.durak_id 
       WHERE yh.hat_no = 'METRO' 
       GROUP BY d.durak_id, d.durak_adi, d.enlem, d.boylam 
       ORDER BY sayi DESC LIMIT 1)
      UNION ALL
      (SELECT 'IZBAN' as tur, d.durak_adi, d.enlem, d.boylam, count(*) as sayi 
       FROM yolcu_hareketleri yh JOIN duraklar d ON yh.durak_id = d.durak_id 
       WHERE yh.hat_no = 'IZBAN' 
       GROUP BY d.durak_id, d.durak_adi, d.enlem, d.boylam 
       ORDER BY sayi DESC LIMIT 1)
      UNION ALL
      (SELECT 'TRAMVAY' as tur, d.durak_adi, d.enlem, d.boylam, count(*) as sayi 
       FROM yolcu_hareketleri yh JOIN duraklar d ON yh.durak_id = d.durak_id 
       WHERE yh.hat_no LIKE '%TRAM%' 
       GROUP BY d.durak_id, d.durak_adi, d.enlem, d.boylam 
       ORDER BY sayi DESC LIMIT 1)
      UNION ALL
      (SELECT 'ESHOT' as tur, d.durak_adi, d.enlem, d.boylam, count(*) as sayi 
       FROM yolcu_hareketleri yh JOIN duraklar d ON yh.durak_id = d.durak_id 
       WHERE yh.hat_no NOT IN ('METRO','IZBAN') AND yh.hat_no NOT LIKE '%TRAM%' 
       GROUP BY d.durak_id, d.durak_adi, d.enlem, d.boylam 
       ORDER BY sayi DESC LIMIT 1);
    `;
    const sonuc = await pool.query(sorgu);
    res.json(sonuc.rows);
  } catch (err) {
    console.error("🏆 Top Duraklar SQL Hatası:", err.message);
    res.status(500).json([]);
  }
});

// 4. TOP 10 LİSTESİ (Tablo İçin - EKSİK OLAN KISIM BURASIYDI)
router.get('/top-liste', async (req, res) => {
  try {
    const sorgu = `
      SELECT 
        d.durak_adi, 
        yh.hat_no, 
        COUNT(*) as toplam_yolcu,
        CASE 
          WHEN yh.hat_no = 'METRO' THEN 'METRO'
          WHEN yh.hat_no = 'IZBAN' THEN 'IZBAN'
          WHEN yh.hat_no LIKE '%TRAM%' THEN 'TRAMVAY'
          ELSE 'ESHOT' 
        END as tur
      FROM yolcu_hareketleri yh
      JOIN duraklar d ON yh.durak_id = d.durak_id
      GROUP BY d.durak_adi, yh.hat_no
      ORDER BY toplam_yolcu DESC
      LIMIT 10;
    `;
    const sonuc = await pool.query(sorgu);
    res.json(sonuc.rows);
  } catch (err) {
    console.error("Tablo SQL Hatası:", err.message);
    res.status(500).json([]);
  }
});

module.exports = router;