const pool = require('../db/db');

exports.analyzeRoute = async (req, res) => {
    const { lat1, lng1, lat2, lng2 } = req.body;
    console.log(`📡 Analiz İsteği: A(${lat1}, ${lng1}) -> B(${lat2}, ${lng2})`);

    try {
        const getDistrictInfo = async (lat, lng, label) => {
            const queryDistrict = `
                SELECT id, ilce_adi, geom FROM ilceler
                ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) LIMIT 1
            `;
            const distResult = await pool.query(queryDistrict, [lng, lat]);
            if (distResult.rows.length === 0) return null;
            
            const district = distResult.rows[0];
            const ilceAdi = district.ilce_adi;
            console.log(`📍 ${label} Tespit Edildi: ${ilceAdi}`);

            const queryStats = `
                SELECT ST_X(ST_Centroid($2::geometry)) as merkez_lng, ST_Y(ST_Centroid($2::geometry)) as merkez_lat,
                COALESCE((SELECT SUM(nufus) FROM mahalle_istatistikleri m WHERE TRANSLATE(UPPER(TRIM(m.ilce_adi)), 'İıŞşĞğÜüÖöÇç', 'IISsGgUuOoCc') = TRANSLATE(UPPER(TRIM($1)), 'İıŞşĞğÜüÖöÇç', 'IISsGgUuOoCc')), 0) as nufus,
                COALESCE((SELECT COUNT(*) FROM duraklar d WHERE ST_Within(d.geom, $2::geometry)), 0) as durak_sayisi,
                COALESCE((SELECT COUNT(*) FROM yolcu_hareketleri yh JOIN duraklar d ON yh.durak_id = d.durak_id WHERE ST_Within(d.geom, $2::geometry)), 0) as toplam_yolcu
            `;

            const statsResult = await pool.query(queryStats, [ilceAdi, district.geom]);
            const data = statsResult.rows[0];

            console.log(`   📊 ${ilceAdi} -> Nüfus: ${data.nufus}, Yolcu: ${data.toplam_yolcu}`);

            return {
                ilce_adi: ilceAdi,
                merkez: { lat: data.merkez_lat, lng: data.merkez_lng },
                nufus: parseInt(data.nufus),
                durak_sayisi: parseInt(data.durak_sayisi),
                toplam_yolcu: parseInt(data.toplam_yolcu)
            };
        };

        const origin = await getDistrictInfo(lat1, lng1, "Origin");
        const destination = await getDistrictInfo(lat2, lng2, "Destination");

        if (!origin || !destination) {
            return res.status(404).json({ error: "Bölge bulunamadı." });
        }

        const R = 6371; 
        const dLat = (destination.merkez.lat - origin.merkez.lat) * Math.PI / 180;
        const dLon = (destination.merkez.lng - origin.merkez.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(origin.merkez.lat * Math.PI / 180) * Math.cos(destination.merkez.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = parseFloat((R * c).toFixed(2));

        const interactionScore = Math.round((origin.toplam_yolcu * destination.toplam_yolcu) / Math.pow((distanceKm < 1 ? 1 : distanceKm) * 10, 2));

        res.json({
            origin: origin,
            destination: destination,
            distance_km: distanceKm,
            score: interactionScore
        });

    } catch (err) {
        console.error("🔥 HATA:", err.message);
        res.status(500).json({ error: err.message });
    }
};