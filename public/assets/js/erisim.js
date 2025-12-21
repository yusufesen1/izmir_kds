document.addEventListener('DOMContentLoaded', async () => {
    const veri = await veriCek();
    if (veri && veri.length > 0) {
        scatterGrafigiCiz(veri);
        oranGrafigiCiz(veri);
        riskAnaliziYap(veri);
    }
    
    isiHaritasiCiz();
    ogrenciDuraklariCiz();
});


async function veriCek() {
    try {
        const res = await fetch('/api/access/scatter-data');
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("Veri çekme hatası:", e);
        return [];
    }
}


function scatterGrafigiCiz(data) {
    const plotData = data.map(d => ({
        x: d.nufus,
        y: d.durak_sayisi,
        r: Math.min(d.toplam_yolcu / 8000, 25), 
        ilce: d.ilce
    }));

    const ctx = document.getElementById('scatterChart').getContext('2d');
    
    if (window.scatterChartIns) window.scatterChartIns.destroy();

    window.scatterChartIns = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'İlçeler',
                data: plotData,
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const raw = context.raw;
                            return `${raw.ilce}: Nüfus ${raw.x.toLocaleString()} - Durak ${raw.y}`;
                        }
                    }
                },
                legend: { display: false }
            },
            scales: {
                x: { title: { display: true, text: 'İlçe Nüfusu' }, beginAtZero: false },
                y: { title: { display: true, text: 'Durak Sayısı' }, beginAtZero: true }
            }
        }
    });
}

function oranGrafigiCiz(data) {
    const islenmisVeri = data.map(d => ({
        ilce: d.ilce,
        oran: Math.round(d.nufus / d.durak_sayisi) 
    }));
    islenmisVeri.sort((a, b) => b.oran - a.oran);

    const labels = islenmisVeri.map(d => d.ilce);
    const values = islenmisVeri.map(d => d.oran);
    const colors = values.map(v => v > 600 ? '#e74c3c' : (v > 400 ? '#f1c40f' : '#2ecc71'));

    const ctx = document.getElementById('ratioChart').getContext('2d');
    if (window.ratioChartIns) window.ratioChartIns.destroy();

    window.ratioChartIns = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bir Durağa Düşen Kişi Sayısı',
                data: values,
                backgroundColor: colors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, title: { display: true, text: '1 Durağa Düşen Nüfus' } } }
        }
    });
}


function riskAnaliziYap(data) {
    let riskliIlceSayisi = 0;
    data.forEach(d => {
        if (Math.round(d.nufus / d.durak_sayisi) > 600) riskliIlceSayisi++;
    });
    const riskElement = document.getElementById('risk-count');
    if (riskElement) {
        riskElement.innerText = riskliIlceSayisi;
        riskElement.style.color = riskliIlceSayisi === 0 ? "#2ecc71" : "#e74c3c";
    }
}

async function isiHaritasiCiz() {
    const mapDiv = document.getElementById('choroplethMap');
    if (!mapDiv) return;

    if (window.accessMap) window.accessMap.remove();
    
    window.accessMap = L.map('choroplethMap').setView([38.42, 27.14], 10.5);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(window.accessMap);

    try {
        const mapRes = await fetch('/api/access/map-data');
        const mapData = await mapRes.json();
        
        const anaRes = await fetch('/api/access/scatter-data');
        const anaData = await anaRes.json();

        function cleanName(name) {
            if (!name) return "";
            return name.toString()
                .toLocaleUpperCase('tr-TR') 
                .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
                .replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
                .replace(/[^A-Z]/g, '') 
                .trim();
        }

        function getRiskScore(ilceAdi) {
            const temizMapIlce = cleanName(ilceAdi);
            const dataItem = anaData.find(d => cleanName(d.ilce) === temizMapIlce);
            
            if (dataItem && dataItem.durak_sayisi > 0) {
                return Math.round(dataItem.nufus / dataItem.durak_sayisi);
            }

            console.log(`❌ Eşleşmedi: Harita[${ilceAdi}] -> Kod[${temizMapIlce}]`);
            return 0;
        }

        function getColor(yogunluk) {
            return yogunluk > 700 ? '#800026' :
                   yogunluk > 600 ? '#BD0026' :
                   yogunluk > 500 ? '#E31A1C' :
                   yogunluk > 400 ? '#FC4E2A' :
                   yogunluk > 300 ? '#FD8D3C' :
                   yogunluk > 200 ? '#FEB24C' :
                                    '#FFEDA0';
        }

        mapData.forEach(item => {
            if (item.geometry) {
                const geoJsonData = JSON.parse(item.geometry);
                const yogunluk = getRiskScore(item.ilce_adi);
                
                L.geoJSON(geoJsonData, {
                    style: {
                        fillColor: getColor(yogunluk),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    },
                    onEachFeature: function(feature, layer) {
                        layer.bindPopup(`
                            <b>${item.ilce_adi}</b><br>
                            1 Durağa Düşen: <b>${yogunluk}</b> Kişi
                        `);
                    }
                }).addTo(window.accessMap);
            }
        });

    } catch (e) { console.error("Harita hatası:", e); }
}

async function ogrenciDuraklariCiz() {
    try {
        const res = await fetch('/api/access/student-stops');
        const data = await res.json();

        const labels = data.map(d => d.durak_adi.length > 20 ? d.durak_adi.substring(0, 20) + "..." : d.durak_adi);
        const values = data.map(d => d.kullanim_sayisi);

        const ctx = document.getElementById('studentChart').getContext('2d');
        if (window.studentChartIns) window.studentChartIns.destroy();

        window.studentChartIns = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Öğrenci Biniş Sayısı',
                    data: values,
                    backgroundColor: 'rgba(155, 89, 182, 0.7)', 
                    borderColor: 'rgba(142, 68, 173, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

    } catch (e) { console.error("Öğrenci grafiği hatası:", e); }
}