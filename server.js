require('dotenv').config();
const app = require('./app'); // app.js'i çağırdık
const pool = require('./db');

const port = process.env.PORT || 3000;

// Sunucuyu Ayağa Kaldır
app.listen(port, () => {
  console.log(`🚀 Proje Başlatıldı: http://localhost:${port}`);
  
  // DB Bağlantı Kontrolü (Opsiyonel ama iyi görünür)
  pool.query('SELECT NOW()', (err, res) => {
    if(!err) {
      console.log("✅ Veritabanı Bağlantısı: BAŞARILI");
    } else {
      console.error("❌ Veritabanı Bağlantısı: BAŞARISIZ", err.message);
    }
  });
});