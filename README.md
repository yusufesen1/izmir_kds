# 🚍 İzmir Ulaşım Karar Destek Sistemi (KDS)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v20.x-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-blue)
![Architecture](https://img.shields.io/badge/Architecture-MVC-orange)

> **Veriye Dayalı Gelecek, Akılcı Ulaşım.**

İzmir genelindeki toplu taşıma verilerini (yolcu hareketleri, durak konumları, demografik veriler) analiz ederek yöneticilerin stratejik ve operasyonel kararlar almasını sağlayan web tabanlı bir **Karar Destek Sistemi (KDS / DSS)**.

---

## 📖 Proje Açıklaması

Bu proje, klasik raporlama sistemlerinden farklı olarak yalnızca **geçmiş veriyi** incelemez; aynı zamanda **geleceğe yönelik tahminler üretir** ve **karar önerileri sunar**.

Sistem;  
- **Coğrafi Bilgi Sistemleri (CBS / GIS)**  
- **İstatistiksel Regresyon**  
- **Kütle Çekim Modeli (Gravity Model)**  

gibi analitik yaklaşımlar kullanarak hat planlama, sefer sıklığı ve kaynak optimizasyonu konularında karar vericilere destek olur.

---

## 🚀 Temel Özellikler

- **🔮 Gelecek Tahmini**  
  Lineer regresyon ile önümüzdeki 12 aya ait yolcu ve finansal projeksiyonlar.

- **🗺️ Senaryo Analizi**  
  Kütle Çekim Modeli kullanılarak ilçeler arası potansiyel yolcu etkileşim skorlarının hesaplanması.

- **⚙️ Operasyonel Simülasyon**  
  Sefer sıklığı değişikliklerinin maliyet ve bekleme süresine etkisinin “What-If” analizleri ile simülasyonu.

- **🛡️ Veri Güvenliği**  
  Veritabanı seviyesinde trigger’lar ile iş kurallarının ve veri bütünlüğünün korunması.

---
## 📡 API Uç Noktaları (Endpoints)

Proje **RESTful** mimariye uygun olarak tasarlanmıştır.

### 🔐 Yönetim (Admin - CRUD)
*Base URL: `/api/admin`*
- `GET /api/admin/tariffs` - Tüm tarifeleri listele.
- `POST /api/admin/tariffs` - Yeni tarife ekle.
- `PUT /api/admin/tariffs/:id` - Tarife güncelle (İş kuralı denetimi var).
- `DELETE /api/admin/tariffs/:id` - Tarife sil (Kritik veri koruması var).

### 📊 Dashboard (Genel Görünüm)
*Base URL: `/api`*
- `GET /api/heatmap` - Yoğunluk haritası verileri.
- `GET /api/yillik-ozet` - Yıllık yolcu/hat özeti.
- `GET /api/top-duraklar` - En popüler duraklar.
- `GET /api/top-liste` - En yoğun durakların listesi.

### 🔮 Gelecek Tahmini (Forecast)
*Base URL: `/api/forecast`*
- `GET /api/forecast/projection-data` - 12 aylık regresyon tahmini.
- `GET /api/forecast/district-growth` - İlçe büyüme potansiyelleri.

### ⚙️ Operasyon (Operation)
*Base URL: `/api/operation`*
- `GET /api/operation/base-metrics` - Simülasyon için baz metrikler.

### 🗺️ Senaryo Analizi (Scenario)
*Base URL: `/api/scenario`*
- `POST /api/scenario/analyze-route` - İki nokta arası etkileşim skoru hesapla.

### ♿ Erişim ve Adalet (Access)
*Base URL: `/api/access`*
- `GET /api/access/scatter-data` - Erişim analizi verileri.
- `GET /api/access/map-data` - Harita renklendirme (GeoJSON) verileri.
- `GET /api/access/student-stops` - Öğrenci yoğunluklu duraklar.
---
## 🛠️ Kurulum

### Ön Koşullar

- Node.js (v18+)
- PostgreSQL (v14+)
- PostGIS eklentisi

### Kurulum Adımları

```bash
# Projeyi klonlayın
git clone https://github.com/kullaniciadiniz/izmir-ulasim-kds.git
cd izmir-ulasim-kds

# Bağımlılıkları yükleyin
npm install

# Ortam değişkenlerini ayarlayın
# .env.example dosyasını .env olarak yeniden adlandırın
# ve PostgreSQL bilgilerinizi girin

# PostgreSQL üzerinde izmir_ulasim adında bir veritabanı oluşturun
# db/ klasörü içindeki SQL yedeğini import edin
# PostGIS eklentisinin aktif olduğundan emin olun

# Uygulamayı başlatın
npm start

