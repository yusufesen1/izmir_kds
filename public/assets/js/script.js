const currentUser = { 
    ad: "Yusuf", 
    soyad: "Yılmaz", 
    rol: "Yönetici" 
};

document.addEventListener('DOMContentLoaded', () => {
    arayuzuDoldur();
    ozetVerileriGetir(); 
    sampiyonlariCiz();   
    isiHaritasiCiz();   
    tabloyuDoldur();
});

function arayuzuDoldur() {
    const nameEl = document.getElementById('user-full-name');
    if (nameEl) nameEl.innerText = `${currentUser.ad} ${currentUser.soyad}`;
    
    const welcomeEl = document.getElementById('welcome-message');
    if (welcomeEl) welcomeEl.innerText = `Hoş geldin, ${currentUser.ad} 👋`;
    
    const avatarEl = document.querySelector('.user-avatar-circle');
    if (avatarEl) avatarEl.innerText = (currentUser.ad[0] + currentUser.soyad[0]).toUpperCase();
}

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

async function sampiyonlariCiz() {
    const mapDiv = document.getElementById('map-champ');
    if (!mapDiv) return;

    if (mapDiv._leaflet_id) {
        L.DomUtil.get(mapDiv)._leaflet_id = null;
        mapDiv.innerHTML = "";
    }

    const map1 = L.map('map-champ').setView([38.4237, 27.1428], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map1);

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
                radius: 14,             
                fillColor: color,
                color: '#fff',
                weight: 3,             
                opacity: 1,
                fillOpacity: 0.9
            })

            .bindTooltip(`
                <div style="text-align:center; font-family:'Inter',sans-serif;">
                    <strong style="color:${color}; font-size:14px;">${d.tur}</strong><br>
                    <span style="font-size:13px; font-weight:600;">${d.durak_adi}</span><br>
                    <span style="color:#555; font-size:12px;">${parseInt(d.sayi).toLocaleString()} Yolcu</span>
                </div>
            `, {
                permanent: false,   
                direction: 'top',    
                opacity: 0.95,       
                className: 'custom-tooltip' 
            })
            .addTo(map1);
        });
        
        setTimeout(() => { map1.invalidateSize(); }, 100);

    } catch (e) { console.error("Sol harita hatası:", e); }
}

async function isiHaritasiCiz() {
    const mapDiv = document.getElementById('map-heat');
    if (!mapDiv) return;

    if (mapDiv._leaflet_id) {
        L.DomUtil.get(mapDiv)._leaflet_id = null;
        mapDiv.innerHTML = "";
    }

    const map2 = L.map('map-heat').setView([38.42, 27.14], 11);
    
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; Stadia Maps',
        maxZoom: 20
    }).addTo(map2);

    try {
        const res = await fetch('/api/heatmap');
        const data = await res.json();

        const vals = data.map(d => parseInt(d.yogunluk));
        const maxYogunluk = Math.max(...vals);

        const heatData = data.map(d => [
            parseFloat(d.enlem), 
            parseFloat(d.boylam), 
            (parseInt(d.yogunluk) / maxYogunluk) * 1.5 
        ]);

        L.heatLayer(heatData, {
            radius: 15,   
            blur: 20,         
            maxZoom: 12,
            max: 1.0,          
            minOpacity: 0.1,   
            gradient: {        
                0.0: '#2c7bb6', 
                0.3: '#00a6ca', 
                0.5: '#00ccbc', 
                0.7: '#90eb9d', 
                0.85: '#ffff8c', 
                1.0: '#d7191c'  
            }
        }).addTo(map2);
        
        setTimeout(() => { map2.invalidateSize(); }, 200);

    } catch (e) { console.error("Isı haritası hatası:", e); }
}

document.addEventListener('DOMContentLoaded', () => {
    isiHaritasiCiz();
    tabloyuDoldur(); 
});

async function tabloyuDoldur() {
    try {
        const res = await fetch('/api/top-liste');
        const data = await res.json();
        const tbody = document.getElementById('top10-body');
        
        const maxVal = data.length > 0 ? parseInt(data[0].toplam_yolcu) : 1;

        tbody.innerHTML = ''; 

        const colors = {
            'METRO': '#e74c3c',   
            'IZBAN': '#f39c12',   
            'TRAMVAY': '#2ecc71', 
            'ESHOT': '#3498db'  
        };

        data.forEach((row, index) => {
            const sira = index + 1;
            const yolcu = parseInt(row.toplam_yolcu);
            
            const yuzde = (yolcu / maxVal) * 100;
            
            let badgeClass = 'badge-eshot';
            let barColor = colors['ESHOT']; 

            if(row.tur === 'METRO') { badgeClass = 'badge-metro'; barColor = colors['METRO']; }
            if(row.tur === 'IZBAN') { badgeClass = 'badge-izban'; barColor = colors['IZBAN']; }
            if(row.tur === 'TRAMVAY') { badgeClass = 'badge-tram'; barColor = colors['TRAMVAY']; }

            let rankClass = '';
            if(sira === 1) rankClass = 'rank-1';
            else if(sira === 2) rankClass = 'rank-2';
            else if(sira === 3) rankClass = 'rank-3';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="rank-circle ${rankClass}">${sira}</div></td>
                <td><span class="type-badge ${badgeClass}">${row.tur}</span></td>
                <td><strong>${row.durak_adi}</strong></td>
                <td><span style="color:#888;">${row.hat_no}</span></td>
                
                <td style="font-family:'Inter', monospace; font-size:15px; font-weight:700;">
                    ${yolcu.toLocaleString()}
                </td>

                <td width="150" style="vertical-align: middle;">
                    <div class="progress-bg" title="%${Math.round(yuzde)} Doluluk">
                        <div class="progress-fill" style="width: ${yuzde}%; background-color: ${barColor};"></div>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error("Tablo hatası:", e);
    }
}