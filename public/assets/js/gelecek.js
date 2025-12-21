document.addEventListener('DOMContentLoaded', async () => {

    const [projData, growthData] = await Promise.all([
        fetch('/api/forecast/projection-data').then(res => res.json()),
        fetch('/api/forecast/district-growth').then(res => res.json())
    ]);

    console.log("Finansal Veri Geldi:", projData.ortalama_gelir, "TL");

    initProjectionChart(projData);
    initGrowthChart(growthData);
    initFinancialChart(projData); 

    const slider = document.getElementById('growthSlider');
    const label = document.getElementById('growthValue');
    
    slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        label.innerText = `+%${val.toFixed(1)} Aylık Büyüme`;
        
        updateProjection(val, projData);
        updateFinancials(val, projData); 
    });
});

let projChartInstance = null;
let finChartInstance = null; 


function initProjectionChart(data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    const { forecastData, crashMonth } = calculateForecast(data.guncel, data.kapasite, 2.0);
    
    updateCrashDate(crashMonth);

    const historicalData = data.gecmis.map(d => d.yolcu);
    const allLabels = [...data.gecmis.map(d => d.ay), "Şimdi", ...generateNextMonths(12)];
    const connectedForecast = [historicalData[historicalData.length-1], ...forecastData];

    projChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: 'Gerçekleşen',
                    data: [...historicalData, null, ...new Array(11).fill(null)],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'AI Tahmini',
                    data: [...new Array(historicalData.length -1).fill(null), ...connectedForecast],
                    borderColor: '#f39c12',
                    borderDash: [5, 5],
                    tension: 0.4
                },
                {
                    label: 'Kapasite',
                    data: new Array(allLabels.length).fill(data.kapasite),
                    borderColor: '#e74c3c',
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw?.toLocaleString()}` } } }
        }
    });
}

function initFinancialChart(data) {
    const ctx = document.getElementById('financialChart').getContext('2d');
    const finansData = calculateFinancials(data.guncel, data.ortalama_gelir, 2.0);
    const labels = ["Şimdi", ...generateNextMonths(12)];

    finChartInstance = new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line', 
                    label: 'Operasyonel Gider (TL)',
                    data: finansData.gider,
                    borderColor: '#c0392b',
                    borderWidth: 3,
                    pointRadius: 3,
                    tension: 0.4,
                    order: 1 
                },
                {
                    type: 'bar', 
                    label: 'Tahmini Gelir (TL)',
                    data: finansData.gelir,
                    backgroundColor: 'rgba(39, 174, 96, 0.7)',
                    borderRadius: 4,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { 
                tooltip: { 
                    callbacks: { 
                        label: (c) => `${c.dataset.label}: ₺${c.raw?.toLocaleString()}` 
                    } 
                } 
            },
            scales: {
                y: {
                    beginAtZero: false, 
                    ticks: { callback: (val) => '₺' + (val/1000000).toFixed(1) + 'M' } 
                }
            }
        }
    });
}

function updateProjection(growthRate, data) {
    const { forecastData, crashMonth } = calculateForecast(data.guncel, data.kapasite, growthRate);
    const historicalLen = data.gecmis.length;
    
    const connectedForecast = [data.gecmis[historicalLen-1].yolcu, ...forecastData];
    projChartInstance.data.datasets[1].data = [...new Array(historicalLen -1).fill(null), ...connectedForecast];
    projChartInstance.update();

    updateCrashDate(crashMonth);
}

function updateFinancials(growthRate, data) {
    const finansData = calculateFinancials(data.guncel, data.ortalama_gelir, growthRate);
    
    finChartInstance.data.datasets[0].data = finansData.gider; 
    finChartInstance.data.datasets[1].data = finansData.gelir; 
    finChartInstance.update();
}

function calculateForecast(current, capacity, rate) {
    const forecast = [];
    let currentVal = current;
    let crashMonth = null;

    for (let i = 1; i <= 12; i++) {
        currentVal = currentVal * (1 + (rate / 100));
        forecast.push(Math.round(currentVal));
        if (currentVal > capacity && !crashMonth) crashMonth = `Ay +${i}`;
    }
    return { forecastData: forecast, crashMonth };
}

function calculateFinancials(currentYolcu, ortGelir, rate) {
    const gelirler = [];
    const giderler = [];
    
    let yolcu = currentYolcu; 
    
    const bazMaliyetBirim = ortGelir * 0.85; 

    let anlikGelir = yolcu * ortGelir;
    let anlikGider = yolcu * bazMaliyetBirim;
    
    gelirler.push(Math.round(anlikGelir));
    giderler.push(Math.round(anlikGider));

    for (let i = 1; i <= 12; i++) {
        yolcu = yolcu * (1 + (rate / 100));

        const gelir = yolcu * ortGelir;
        
        let stresFaktoru = 1.0;
        if (rate > 4.0) stresFaktoru = 1.05; 

        const enflasyon = Math.pow(1.02, i);
        const gider = (yolcu * bazMaliyetBirim * enflasyon) * stresFaktoru;

        gelirler.push(Math.round(gelir));
        giderler.push(Math.round(gider));
    }

    return { gelir: gelirler, gider: giderler };
}


function generateNextMonths(count) {
    const arr = [];
    for(let i=1; i<=count; i++) arr.push(`Ay +${i}`);
    return arr;
}

function updateCrashDate(month) {
    const el = document.getElementById('crashDate');
    if (month) {
        el.innerText = month;
        el.style.color = '#e74c3c';
        el.parentElement.style.border = '1px solid #e74c3c';
    } else {
        el.innerText = "Güvenli";
        el.style.color = '#2ecc71';
        el.parentElement.style.border = '1px solid #2ecc71';
    }
}

function initGrowthChart(data) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    const labels = data.map(d => d.ilce_adi);
    const values = data.map(d => d.mevcut_yuk);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mevcut Yük',
                data: values,
                backgroundColor: '#9b59b6',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } }
        }
    });
}