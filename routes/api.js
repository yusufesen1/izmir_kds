const router = require('express').Router();
const pool = require('../db'); 

// 1. ISI HARİTASI
router.get('/heatmap', async (req, res) => {
  try {
    // Tüm durakları ve yoğunluklarını çekiyoruz
    const sorgu = `
      SELECT d.enlem, d.boylam, COUNT(*) as yogunluk
      FROM yolcu_hareketleri yh
      JOIN duraklar d ON yh.durak_id = d.durak_id
      GROUP BY d.durak_id, d.enlem, d.boylam
      HAVING COUNT(*) > 50 -- Sadece kalabalık yerleri gösterelim ki harita çok kırmızılanmasın
      LIMIT 3000;
    `;
    const sonuc = await pool.query(sorgu);
    res.json(sonuc.rows);
  } catch (err) {
    console.error("Heatmap SQL Hatası:", err.message);
    res.status(500).json([]);
  }
});

// 2. YILLIK ÖZET (Burada zaten sorun yoktu ama kontrol ettik)
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

// 3. TOP DURAKLAR (DÜZELTİLDİ: d.hat_no -> yh.hat_no)
router.get('/top-duraklar', async (req, res) => {
  try {
    // Burada d.hat_no yerine yh.hat_no kullanarak filtreleme yapıyoruz
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

// 4. GÜZERGAH (Sağ Harita - Gidiş/Dönüş Ayrımı Eklendi)
router.get('/hat-guzergah', async (req, res) => {
  try {
    // DİKKAT: 'hd.yon' sütunu olduğunu varsayıyoruz. 
    // Eğer tablonda bu sütunun adı farklıysa (örn: direction, guzergah_tipi) burayı düzelt!
    const sorgu = `
      SELECT h.hat_no, d.enlem, d.boylam, hd.sira_no, hd.yon
      FROM hat_duraklari hd
      JOIN duraklar d ON hd.durak_id = d.durak_id
      JOIN hatlar h ON hd.hat_no = h.hat_no
      WHERE h.hat_no IN ('290', '390', '490', '515', '470', '680') 
      ORDER BY h.hat_no, hd.yon, hd.sira_no;
    `;
    const sonuc = await pool.query(sorgu);
    res.json(sonuc.rows);
  } catch (err) {
    console.error("Güzergah SQL Hatası:", err.message);
    res.status(500).json([]);
  }
});

module.exports = router;