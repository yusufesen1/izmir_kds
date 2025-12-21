let map, markerA, markerB, routeLine;
let clickState = 0; 

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetScenario);
    }
});

function initMap() {
    map = L.map('scenarioMap').setView([38.42, 27.14], 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap & CartoDB'
    }).addTo(map);
    map.on('click', handleMapClick);
}

function handleMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (clickState === 0) {
        // A Noktası
        markerA = L.marker([lat, lng], { icon: createCustomIcon('A', '#2ecc71') }).addTo(map);
        clickState = 1;
        updateInstruction("2. Hedef ilçeyi (B) seçin.");
    } 
    else if (clickState === 1) {
        // B Noktası
        markerB = L.marker([lat, lng], { icon: createCustomIcon('B', '#e74c3c') }).addTo(map);
        
        const latlngs = [markerA.getLatLng(), markerB.getLatLng()];
        routeLine = L.polyline(latlngs, {color: '#3498db', weight: 3, dashArray: '5, 10'}).addTo(map);
        map.fitBounds(routeLine.getBounds(), {padding: [50, 50]});

        clickState = 2;
        updateInstruction("✅ Bölgesel analiz yapılıyor...");
        
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) resetBtn.style.display = 'block';

        analyzeRoute(markerA.getLatLng(), markerB.getLatLng());
    }
}

function updateInstruction(text) {
    const el = document.getElementById('instructionText');
    if (el) el.innerText = text;
}

async function analyzeRoute(pointA, pointB) {
    const loader = document.getElementById('loading');
    const resultBox = document.getElementById('resultBox');

    if (!loader || !resultBox) {
        console.error("HATA: HTML dosyasında 'loading' veya 'resultBox' id'li elementler bulunamadı!");
        alert("Arayüz hatası: HTML elementleri eksik.");
        return;
    }
    
    loader.style.display = 'block';
    resultBox.style.display = 'none';

    try {
        const response = await fetch('/api/scenario/analyze-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat1: pointA.lat, lng1: pointA.lng,
                lat2: pointB.lat, lng2: pointB.lng
            })
        });

        const data = await response.json();

        if (data.error) {
            alert("Hata: " + data.error);
            resetScenario();
            return;
        }

        const htmlContent = `
            <div style="text-align:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div style="font-size:18px; font-weight:800; color:#2c3e50;">
                    ${data.origin.ilce_adi} <span style="color:#bdc3c7">➝</span> ${data.destination.ilce_adi}
                </div>
                <div style="font-size:12px; color:#7f8c8d; margin-top:5px;">
                    Mesafe: <b>${data.distance_km} km</b>
                </div>
            </div>

            <div class="metric-row">
                <span class="metric-label">👥 ${data.origin.ilce_adi} Nüfus:</span>
                <span class="metric-value">${data.origin.nufus.toLocaleString()}</span>
            </div>
             <div class="metric-row">
                <span class="metric-label">🚌 ${data.origin.ilce_adi} Durak:</span>
                <span class="metric-value">${data.origin.durak_sayisi}</span>
            </div>
            <div class="metric-row" style="margin-top:10px; padding-top:10px; border-top:1px dashed #eee;">
                <span class="metric-label">🎯 ${data.destination.ilce_adi} Çekim Gücü:</span>
                <span class="metric-value">${data.destination.toplam_yolcu.toLocaleString()} yolcu</span>
            </div>
            
            <div style="margin-top:20px; background:#f0f3f4; padding:15px; border-radius:8px; text-align:center; border:1px solid #e0e0e0;">
                <span style="display:block; font-size:11px; color:#666; text-transform:uppercase; letter-spacing:1px;">Potansiyel Etkileşim Skoru</span>
                <span style="font-size:28px; font-weight:900; color:#8e44ad;">${data.score > 0 ? data.score.toLocaleString() : "Düşük"}</span>
            </div>
        `;

        resultBox.innerHTML = htmlContent;
        resultBox.style.display = 'block';
        loader.style.display = 'none';

    } catch (error) {
        console.error("Backend Hatası:", error);
        loader.style.display = 'none';
        alert("Bağlantı hatası.");
    }
}

function resetScenario() {
    if (markerA) map.removeLayer(markerA);
    if (markerB) map.removeLayer(markerB);
    if (routeLine) map.removeLayer(routeLine);
    markerA = null; markerB = null; routeLine = null;
    clickState = 0;
    
    updateInstruction("1. Başlangıç ilçesini (A) seçin.");
    
    const resetBtn = document.getElementById('resetBtn');
    const resultBox = document.getElementById('resultBox');
    
    if (resetBtn) resetBtn.style.display = 'none';
    if (resultBox) resultBox.style.display = 'none';
}

function createCustomIcon(label, color) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:${color}; width:30px; height:30px; border-radius:50%; border:3px solid white; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; box-shadow:0 3px 10px rgba(0,0,0,0.3);">${label}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}