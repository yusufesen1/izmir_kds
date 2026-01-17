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
