document.addEventListener('DOMContentLoaded', async () => {
    const baseData = await fetch('/api/operation/base-metrics').then(res => res.json());

    updateDashboard(0, baseData);
    initChart(baseData);

    const slider = document.getElementById('freqSlider');
    const display = document.getElementById('sliderDisplay');

    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);

        if(val > 0) {
            display.innerText = `Artış (+%${val})`;
            display.style.color = '#27ae60';
        } else if (val < 0) {
            display.innerText = `Azalış (%${val})`;
            display.style.color = '#c0392b';
        } else {
            display.innerText = `Stabil (%0)`;
            display.style.color = '#2c3e50';
        }

        updateDashboard(val, baseData);
        updateChart(val, baseData);
    });
});

let simChart = null;

// --- MATEMATİKSEL HESAPLAMALAR ---
function updateDashboard(changePercent, base) {
    const factor = 1 + (changePercent / 100);

    const newWait = base.ortalama_bekleme / factor;
    updateKPI('kpi-wait', 'diff-wait', newWait.toFixed(1) + ' dk', base.ortalama_bekleme, true); /

    const newCost = base.operasyon_maliyeti * factor;
    updateKPI('kpi-cost', 'diff-cost', newCost.toFixed(0) + ' Birim', base.operasyon_maliyeti, false); 

    let newCrowd = base.ortalama_doluluk / factor;
    if(newCrowd > 100) newCrowd = 100; 
    updateKPI('kpi-crowd', 'diff-crowd', '%' + newCrowd.toFixed(0), base.ortalama_doluluk, true);
}

function updateKPI(valId, diffId, text, baseVal, lowerIsBetter) {
    const elVal = document.getElementById(valId);
    const elDiff = document.getElementById(diffId);
    
    elVal.innerText = text;

    const currentNum = parseFloat(text.replace(/[^0-9.]/g, ''));
    const diff = ((currentNum - baseVal) / baseVal) * 100;
    
    if (Math.abs(diff) < 1) {
        elDiff.innerText = "Değişim Yok";
        elDiff.className = "diff neutral";
        return;
    }

    const diffText = diff > 0 ? `▲ %${Math.abs(diff).toFixed(0)}` : `▼ %${Math.abs(diff).toFixed(0)}`;
    elDiff.innerText = diffText;

    if (lowerIsBetter) {
        elDiff.className = diff < 0 ? "diff positive" : "diff negative";
    } else {
        elDiff.className = diff < 0 ? "diff positive" : "diff negative";
    }
}

function initChart(base) {
    const ctx = document.getElementById('simulationChart').getContext('2d');
    const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const baseProfile = [15, 25, 12, 10, 12, 15, 30, 15, 20]; 
    
    base.chartProfile = baseProfile;

    simChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [
                {
                    label: 'Mevcut Durum',
                    data: baseProfile,
                    borderColor: '#95a5a6',
                    borderDash: [5, 5], 
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Simülasyon (Yeni)',
                    data: [...baseProfile], 
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    fill: true,
                    borderWidth: 3,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: { display: true, text: 'Bekleme Süresi (Dakika)' },
                    beginAtZero: true
                }
            }
        }
    });
}

function updateChart(changePercent, base) {
    const factor = 1 + (changePercent / 100);
    const newProfile = base.chartProfile.map(val => val / factor);
    
    simChart.data.datasets[1].data = newProfile;
    
    if (changePercent > 0) {
        simChart.data.datasets[1].borderColor = '#2ecc71'; 
        simChart.data.datasets[1].backgroundColor = 'rgba(46, 204, 113, 0.2)';
    } else if (changePercent < 0) {
        simChart.data.datasets[1].borderColor = '#e74c3c'; 
        simChart.data.datasets[1].backgroundColor = 'rgba(231, 76, 60, 0.2)';
    } else {
        simChart.data.datasets[1].borderColor = '#3498db'; 
        simChart.data.datasets[1].backgroundColor = 'rgba(52, 152, 219, 0.2)';
    }

    simChart.update();
}