const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');
const path = require('path');

// ============================================================
// ⚙️ AYARLAR
// ============================================================
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'izmir_kds',
    password: '123yusuf',
    port: 5432,
});

// --- YARDIMCI FONKSİYONLAR ---

function floatTemizle(deger) {
    if (!deger) return null;
    let temiz = deger.toString().replace(/"/g, '').replace(',', '.').trim();
    const sayi = parseFloat(temiz);
    return isNaN(sayi) ? null : sayi;
}

function stringTemizle(text) {
    if (!text) return "";
    return text.toString().replace(/"/g, '').trim();
}

function csvOku(dosyaAdi, ayrac = ';') {
    return new Promise((resolve, reject) => {
        const sonuclar = [];
        // Senin klasör yapına göre dosya yolunu oluşturuyoruz
        const tamYol = path.join(__dirname, 'csv_data', dosyaAdi);

        if (!fs.existsSync(tamYol)) {
            console.warn(`⚠️ UYARI: ${dosyaAdi} dosyası bulunamadı!`);
            console.warn(`   (Aranan yer: ${tamYol})`);
            resolve([]); 
            return;
        }
        
        fs.createReadStream(tamYol)
            .pipe(csv({ separator: ayrac }))
            .on('data', (data) => sonuclar.push(data))
            .on('end', () => resolve(sonuclar))
            .on('error', (err) => reject(err));
    });
}

async function baslat() {
    try {
        await client.connect();
        console.log("🚀 Veritabanına bağlanıldı: izmir_kds");

        // Temizlik
        await client.query('TRUNCATE TABLE yolcu_hareketleri, sefer_saatleri, duraklar, hatlar RESTART IDENTITY CASCADE');
        console.log("🧹 Tablolar temizlendi.");

        // ==========================================
        // 1. ESHOT (OTOBÜS) - Dosya Adları Güncellendi ✅
        // ==========================================
        console.log("🚌 ESHOT Otobüs verileri yükleniyor...");
        
        // Senin dosya adın: eshot_hatlar.csv
        const otobusHatlar = await csvOku('eshot_hatlar.csv', ';');
        for (const row of otobusHatlar) {
            await client.query(
                `INSERT INTO hatlar (hat_no, hat_adi, baslangic_duragi, bitis_duragi, aciklama) 
                 VALUES ($1, $2, $3, $4, 'Otobüs') ON CONFLICT DO NOTHING`,
                [row.HAT_NO, row.HAT_ADI, row.HAT_BASLANGIC, row.HAT_BITIS]
            );
        }

        // Senin dosya adın: eshot_duraklar.csv
        const otobusDuraklar = await csvOku('eshot_duraklar.csv', ';');
        for (const row of otobusDuraklar) {
            const enlem = floatTemizle(row.ENLEM);
            const boylam = floatTemizle(row.BOYLAM);
            if (!enlem || !boylam) continue;
            await client.query(
                `INSERT INTO duraklar (durak_id, durak_adi, enlem, boylam, geom) 
                 VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326))
                 ON CONFLICT DO NOTHING`,
                [row.DURAK_ID, row.DURAK_ADI, enlem, boylam]
            );
        }
        console.log("✅ Otobüs işlemleri bitti.");


        // ==========================================
        // 2. METRO - (Zaten çalışıyordu)
        // ==========================================
        console.log("🚇 Metro verileri yükleniyor...");
        await client.query(`INSERT INTO hatlar VALUES ('METRO-1', 'EVKA 3 - F.ALTAY', 'EVKA 3', 'F.ALTAY', 'Metro') ON CONFLICT DO NOTHING`);
        
        const metroDuraklar = await csvOku('metro_duraklar.csv', ','); 
        for (const row of metroDuraklar) {
            const id = 90000 + parseInt(stringTemizle(row.ISTASYON_ID || row['"ISTASYON_ID"'])); 
            const ad = stringTemizle(row.ISTASYON_ADI || row['"ISTASYON_ADI"']);
            const enlem = floatTemizle(row.ENLEM || row['"ENLEM"']);
            const boylam = floatTemizle(row.BOYLAM || row['"BOYLAM"']);
            if (!enlem || !boylam) continue;
            await client.query(
                `INSERT INTO duraklar (durak_id, durak_adi, enlem, boylam, geom) 
                 VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326))
                 ON CONFLICT DO NOTHING`,
                [id, ad, enlem, boylam]
            );
        }
        console.log("✅ Metro işlemleri bitti.");


        // ==========================================
        // 3. TRAMVAY - Dosya Adları Güncellendi ✅
        // ==========================================
        console.log("🚋 Tramvay verileri yükleniyor...");
        
        // Senin dosya adın: tramvay_hatlar.csv
        const tramvayHatlar = await csvOku('tramvay_hatlar.csv', ';');
        for (const row of tramvayHatlar) {
            await client.query(
                `INSERT INTO hatlar (hat_no, hat_adi, baslangic_duragi, bitis_duragi, aciklama) 
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
                [`TRAM-${row.HAT_NO}`, row.HAT_ADI, row.HAT_BASLANGIC, row.HAT_BITIS, 'Tramvay']
            );
        }

        let tramvayDurakSayac = 95000;
        // Senin dosya adların (alt tireli ve cigli 'g' ile):
        const tramvayDosyalari = [
            'tramvay_konak_konumlar.csv', 
            'tramvay_karsiyaka_konumlar.csv', 
            'tramvay_cigli_konumlar.csv'
        ];

        for (const dosya of tramvayDosyalari) {
            let duraklar = await csvOku(dosya, ';');
            // Veri gelmediyse virgül ile dene
            if (duraklar.length === 0 || (!duraklar[0].ENLEM && !duraklar[0].enlem)) duraklar = await csvOku(dosya, ',');
            
            for (const row of duraklar) {
                const enlem = floatTemizle(row.ENLEM || row.enlem);
                const boylam = floatTemizle(row.BOYLAM || row.boylam);
                const ad = stringTemizle(row.ISTASYON_ADI || row.istasyon_adi);
                if (!enlem || !boylam) continue;
                tramvayDurakSayac++;
                await client.query(
                    `INSERT INTO duraklar (durak_id, durak_adi, enlem, boylam, geom) 
                 VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326))
                 ON CONFLICT DO NOTHING`,
                    [tramvayDurakSayac, ad, enlem, boylam]
                );
            }
        }
        console.log("✅ Tramvay işlemleri bitti.");


        // ==========================================
        // 4. İZBAN - Dosya Adları Güncellendi ✅
        // ==========================================
        console.log("🚆 İZBAN verileri yükleniyor...");
        
        // Senin dosya adın: izban_hat.txt (Routes içeriği)
        const izbanRoutes = await csvOku('izban_hat.txt', ',');
        for (const row of izbanRoutes) {
            const hatId = `IZBAN-${stringTemizle(row.route_id)}`;
            const hatAdi = stringTemizle(row.route_long_name);
            await client.query(
                `INSERT INTO hatlar (hat_no, hat_adi, aciklama) 
                 VALUES ($1, $2, 'İZBAN') ON CONFLICT DO NOTHING`,
                [hatId, hatAdi]
            );
        }

        // Senin dosya adın: izban_duraklar.txt (Stops içeriği)
        const izbanStops = await csvOku('izban_duraklar.txt', ',');
        for (const row of izbanStops) {
            const orjId = parseInt(stringTemizle(row.stop_id));
            if(isNaN(orjId)) continue;
            const dbId = 80000 + orjId; 
            const enlem = floatTemizle(row.stop_lat);
            const boylam = floatTemizle(row.stop_lon);
            const ad = stringTemizle(row.stop_name);
            await client.query(
                `INSERT INTO duraklar (durak_id, durak_adi, enlem, boylam, geom) 
                 VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326))
                 ON CONFLICT DO NOTHING`,
                [dbId, ad, enlem, boylam]
            );
        }
        console.log("✅ İZBAN işlemleri bitti.");


        // ==========================================
        // 5. SİMÜLASYON
        // ==========================================
        console.log("🎲 Simülasyon verisi üretiliyor...");
        const dbHatlar = (await client.query('SELECT hat_no, aciklama FROM hatlar')).rows;
        const dbDuraklar = (await client.query('SELECT durak_id FROM duraklar')).rows;
        const rayliHatlar = dbHatlar.filter(h => h.aciklama !== 'Otobüs').map(h => h.hat_no);

        if (dbDuraklar.length > 0 && dbHatlar.length > 0) {
            for (let i = 0; i < 5000; i++) { 
                let secilenHat;
                if (rayliHatlar.length > 0 && Math.random() < 0.30) {
                     secilenHat = rayliHatlar[Math.floor(Math.random() * rayliHatlar.length)];
                } else {
                     secilenHat = dbHatlar[Math.floor(Math.random() * dbHatlar.length)].hat_no;
                }
                const secilenDurak = dbDuraklar[Math.floor(Math.random() * dbDuraklar.length)].durak_id;
                const tarih = new Date();
                tarih.setDate(tarih.getDate() - Math.floor(Math.random() * 7));
                const saatRnd = Math.random();
                if (saatRnd < 0.2) tarih.setHours(8);      
                else if (saatRnd < 0.4) tarih.setHours(18); 
                else tarih.setHours(Math.floor(Math.random() * 24));
                tarih.setMinutes(Math.floor(Math.random() * 60));
                const tipler = ['Tam', 'Tam', 'Öğrenci', 'Öğrenci', '65+', 'Öğretmen'];
                const yolcuTipi = tipler[Math.floor(Math.random() * tipler.length)];

                await client.query(
                    `INSERT INTO yolcu_hareketleri (kart_id, hat_no, durak_id, binis_zamani, yolcu_tipi) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [`User_${Math.floor(Math.random() * 100000)}`, secilenHat, secilenDurak, tarih, yolcuTipi]
                );
            }
            console.log("✅ 5000 adet simülasyon verisi üretildi.");
        }
        console.log("🏁 TÜM İŞLEMLER BAŞARIYLA TAMAMLANDI!");
    } catch (err) {
        console.error("❌ HATA:", err);
    } finally {
        await client.end();
    }
}

baslat();