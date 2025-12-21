// 1. KULLANICI BİLGİLERİ
const currentUser = { 
    ad: "Yusuf", 
    soyad: "Yılmaz", 
    rol: "Yönetici" 
};

// 2. SAYFA YÜKLENDİĞİNDE
document.addEventListener('DOMContentLoaded', () => {
    // Arayüzü Doldur
    arayuzuDoldur();
    
    // Verileri Çek
    ozetVerileriGetir(); 
    sampiyonlariCiz();   
    isiHaritasiCiz();   
});

// ARAYÜZ FONKSİYONU
function arayuzuDoldur() {
    const nameEl = document.getElementById('user-full-name');
    if (nameEl) nameEl.innerText = `${currentUser.ad} ${currentUser.soyad}`;
    
    const welcomeEl = document.getElementById('welcome-message');
    if (welcomeEl) welcomeEl.innerText = `Hoş geldin, ${currentUser.ad} 👋`;
    
    const avatarEl = document.querySelector('.user-avatar-circle');
    if (avatarEl) avatarEl.innerText = (currentUser.ad[0] + currentUser.soyad[0]).toUpperCase();
}

// 3. KPI KARTLARI
async function ozetVerileriGetir() {
    try {
        const res = await fetch('/api/yillik-ozet');
        if (!res.ok) throw new Error('API Hatası');
        
        const data = await res.json();
        
        const sayiBul = (tur) => {
            const k = data.find(d => d.tur === tur);
            return k ? parseInt(k.toplam).toLocaleString('tr-TR') : "0";
        };

        const ids = ['count-eshot', 'count-metro', 'count-tramvay', 'count-izban'];
        const keys = ['ESHOT', 'METRO', 'TRAMVAY', 'IZBAN'];

        ids.forEach((id, index) => {
            const el = document.getElementById(id);
            if(el) el.innerText = sayiBul(keys[index]);
        });
        
    } catch (e) { 
        console.error("Kart hatası:", e);
    }
}

// --- SOL HARİTA: EN YOĞUN DURAKLAR (HOVER + HIZLANDIRILMIŞ) ---
// --- SOL HARİTA: EN YOĞUN DURAKLAR ---
async function sampiyonlariCiz() {
    const mapDiv = document.getElementById('map-champ');
    if (!mapDiv) return;

    if (mapDiv._leaflet_id) {
        L.DomUtil.get(mapDiv)._leaflet_id = null;
        mapDiv.innerHTML = "";
    }

    const map1 = L.map('map-champ').setView([38.4237, 27.1428], 11);

    // SENİN SEÇTİĞİN TEMA (CartoDB Light)
    // Sade, beyaz ağırlıklı ve modern.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map1);

    // ... (Kodun geri kalanı, ikonlar vs. aynen devam ediyor) ...

    try {
        const res = await fetch('/api/top-duraklar');
        const data = await res.json();

        data.forEach(d => {
            if(!d.enlem || !d.boylam) return;

            let color = '#3498db'; 
            if(d.tur === 'METRO') color = '#e74c3c'; 
            if(d.tur === 'IZBAN') color = '#f39c12'; 
            if(d.tur === 'TRAMVAY') color = '#2ecc71'; 

            L.circleMarker([d.enlem, d.boylam], {
                radius: 14,             // Biraz büyüttük
                fillColor: color,
                color: '#fff',
                weight: 3,              // Çerçeveyi kalınlaştırdık
                opacity: 1,
                fillOpacity: 0.9
            })
            // BURASI DEĞİŞTİ: Popup yerine Tooltip (Hover)
            .bindTooltip(`
                <div style="text-align:center; font-family:'Inter',sans-serif;">
                    <strong style="color:${color}; font-size:14px;">${d.tur}</strong><br>
                    <span style="font-size:13px; font-weight:600;">${d.durak_adi}</span><br>
                    <span style="color:#555; font-size:12px;">${parseInt(d.sayi).toLocaleString()} Yolcu</span>
                </div>
            `, {
                permanent: false,    // Sadece üzerine gelince göster
                direction: 'top',    // Baloncuğu üstte aç
                opacity: 0.95,       // Hafif şeffaflık
                className: 'custom-tooltip' // CSS ile özelleştirilebilir
            })
            .addTo(map1);
        });
        
        // Gecikmeyi düşürdük (Daha hızlı render için)
        setTimeout(() => { map1.invalidateSize(); }, 100);

    } catch (e) { console.error("Sol harita hatası:", e); }
}

// --- SAĞ HARİTA: ISI HARİTASI (DÜZELTİLMİŞ) ---
async function isiHaritasiCiz() {
    const mapDiv = document.getElementById('map-heat');
    if (!mapDiv) return;

    if (mapDiv._leaflet_id) {
        L.DomUtil.get(mapDiv)._leaflet_id = null;
        mapDiv.innerHTML = "";
    }

    const map2 = L.map('map-heat').setView([38.42, 27.14], 11);
    
    // Koyu Tema (Isı haritası için en iyisi)
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; Stadia Maps',
        maxZoom: 20
    }).addTo(map2);

    try {
        const res = await fetch('/api/heatmap');
        const data = await res.json();

        // 1. En yüksek yoğunluğu bul (Referans noktası)
        const vals = data.map(d => parseInt(d.yogunluk));
        const maxYogunluk = Math.max(...vals);

        // 2. Veriyi Hazırla (Normalize Et: 0.0 - 1.0 arasına sıkıştır)
        const heatData = data.map(d => [
            parseFloat(d.enlem), 
            parseFloat(d.boylam), 
            (parseInt(d.yogunluk) / maxYogunluk) * 1.5 // Çarpanla yoğunluğu artırıyoruz
        ]);

        // 3. ÇİZİM AYARLARI (Hatayı düzelttik: Max 1.0)
        L.heatLayer(heatData, {
            radius: 15,        // Nokta büyüklüğü (İdeal boyut)
            blur: 20,          // Bulanıklık (Yumuşak geçiş)
            maxZoom: 12,
            max: 1.0,          
            minOpacity: 0.1,   
            gradient: {        
                0.0: '#2c7bb6', // Mavi (Çok Düşük)
                0.3: '#00a6ca', // Açık Mavi
                0.5: '#00ccbc', // Turkuaz
                0.7: '#90eb9d', // Açık Yeşil
                0.85: '#ffff8c', // Sarı
                1.0: '#d7191c'  // Kırmızı (Çok Yoğun - EN SON NOKTA 1.0 OLMALI)
            }
        }).addTo(map2);
        
        setTimeout(() => { map2.invalidateSize(); }, 200);

    } catch (e) { console.error("Isı haritası hatası:", e); }
}