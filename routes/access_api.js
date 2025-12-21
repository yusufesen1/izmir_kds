const router = require('express').Router();
const pool = require('../db');

// Yardımcı Fonksiyon: İsimleri standartlaştır (Türkçe -> İngilizce)
const isimTemizle = (text) => {
    if (!text) return "";
    let temiz = text.toString().toUpperCase('tr-TR');
    const degisimler = {
        'Ş': 'S', 'İ': 'I', 'Ğ': 'G', 'Ü': 'U', 'Ö': 'O', 'Ç': 'C',
        'ı': 'I', 'ş': 'S', 'ğ': 'G', 'ü': 'U', 'ö': 'O', 'ç': 'C'
    };
    return temiz.split('').map(char => degisimler[char] || char).join('').trim();
};

// 1. SCATTER PLOT VE ORAN GRAFİĞİ (MEVCUT ÇALIŞAN KOD)
router.get('/scatter-data', async (req, res) => {
  try {
    // Ulaşım Verisi
    const ulasimSorgusu = `
      SELECT 
        i.ilce_adi as harita_adi,
        COUNT(DISTINCT d.durak_id) as durak_sayisi,
        COUNT(yh.islem_id) as toplam_yolcu
      FROM ilceler i
      LEFT JOIN duraklar d ON ST_Within(d.geom, i.geom)
      LEFT JOIN yolcu_hareketleri yh ON d.durak_id = yh.durak_id
      GROUP BY i.ilce_adi
    `;
    const ulasimSonuc = await pool.query(ulasimSorgusu);

    // Nüfus Verisi
    const nufusSorgusu = `
      SELECT ilce_adi as nufus_adi, SUM(nufus) as toplam_nufus 
      FROM mahalle_istatistikleri 
      GROUP BY ilce_adi
    `;
    const nufusSonuc = await pool.query(nufusSorgusu);

    // JS Birleştirme
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

    // Nüfusu 0 olanları filtrele ve sırala
    finalVeri = finalVeri.filter(item => item.nufus > 0);
    finalVeri.sort((a, b) => b.nufus - a.nufus);

    res.json(finalVeri);

  } catch (err) {
    console.error("❌ Scatter API Hatası:", err.message);
    res.status(500).json([]);
  }
});

// --- EKSİK OLAN KISIMLAR BURADA EKLENDİ ---

// 2. ISI HARİTASI İÇİN GEOJSON VERİSİ (/map-data)
router.get('/map-data', async (req, res) => {
  try {
    // Bu sorgu haritayı boyamak için gerekli GeoJSON verisini döndürür
    const sorgu = `
      SELECT 
        i.ilce_adi,
        ST_AsGeoJSON(i.geom) as geometry, -- Harita çizimi için şart
        COUNT(DISTINCT d.durak_id) as durak_sayisi
      FROM ilceler i
      LEFT JOIN duraklar d ON ST_Within(d.geom, i.geom)
      GROUP BY i.ilce_adi, i.geom
    `;
    
    const sonuc = await pool.query(sorgu);
    
    // Nüfus verisini buraya SQL içinde joinlemek zor olduğu için (isim hatası),
    // Frontend zaten nüfusu biliyor ama biz haritayı basitçe "Durak Yoğunluğuna" göre boyayalım 
    // veya basit bir mantık kuralım.
    // Şimdilik sadece Geometriyi ve Durak Sayısını dönüyoruz, JS tarafında renklendireceğiz.
    
    // Harita verisine "Yogunluk Puanı" ekleyelim (Basitçe durak sayısı üzerinden)
    const mapData = sonuc.rows.map(row => ({
        ilce_adi: row.ilce_adi,
        geometry: row.geometry,
        // Geçici mantık: Durak sayısı çoksa yoğunluk yüksektir mantığı (JS'de nüfusla birleşecek)
        yogunluk: parseInt(row.durak_sayisi) 
    }));

    res.json(mapData);

  } catch (err) {
    console.error("❌ Harita API Hatası:", err.message);
    res.status(500).json([]);
  }
});

// 3. ÖĞRENCİ DURAKLARI (/student-stops)
router.get('/student-stops', async (req, res) => {
  try {
    // SENİN VERDİĞİN BİLGİ: Öğrenci tarife_id = 2
    // Bu sorgu çok hızlı çalışır.
    const sorgu = `
      SELECT 
        d.durak_adi,
        COUNT(yh.islem_id) as kullanim_sayisi
      FROM yolcu_hareketleri yh
      JOIN duraklar d ON yh.durak_id = d.durak_id
      WHERE yh.tarife_id = 2  -- ID'si 2 olan (Öğrenci) işlemleri filtrele
      GROUP BY d.durak_adi
      ORDER BY kullanim_sayisi DESC
      LIMIT 8; -- En popüler 8 durak
    `;
    
    const sonuc = await pool.query(sorgu);
    res.json(sonuc.rows);
    
  } catch (err) {
    console.error("❌ Öğrenci API Hatası:", err.message);
    res.status(500).json([]);
  }
});

module.exports = router;