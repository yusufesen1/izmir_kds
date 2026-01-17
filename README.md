# 🚍 İzmir Ulaşım Karar Destek Sistemi (KDS)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v20.x-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-blue)
![Architecture](https://img.shields.io/badge/Architecture-MVC-orange)

> **Veriye Dayalı Gelecek, Akılcı Ulaşım.**

Bu proje, İzmir genelindeki toplu taşıma verilerini (yolcu hareketleri, durak konumları, demografik veriler) işleyerek yöneticilerin stratejik ve operasyonel kararlar almasını sağlayan web tabanlı bir **Karar Destek Sistemidir (DSS)**.

---

## 📖 Proje Açıklaması

Geleneksel raporlama sistemlerinden farklı olarak bu proje, sadece "geçmişte ne olduğunu" değil, **"gelecekte ne olacağını"** ve **"ne yapılması gerektiğini"** analiz eder. 

Sistem; **Coğrafi Bilgi Sistemleri (CBS)**, **İstatistiksel Regresyon** ve **Kütle Çekim Modeli (Gravity Model)** gibi analitik yaklaşımları kullanarak hat planlama, fiyatlandırma ve sefer optimizasyonu konularında karar vericiye rehberlik eder.

### 🚀 Temel Özellikler
- **🔮 Gelecek Tahmini:** Lineer Regresyon ile önümüzdeki 12 ayın yolcu ve finansal projeksiyonu.
- **🗺️ Senaryo Analizi:** Kütle Çekim Modeli ile iki ilçe arasındaki potansiyel yolcu etkileşim skoru.
- **⚙️ Operasyonel Simülasyon:** Sefer sıklığı değişimlerinin maliyet ve bekleme süresine etkisinin anlık simülasyonu ("What-If" Analizi).
- **🛡️ Veri Güvenliği:** Veritabanı seviyesinde Trigger'lar ile iş kurallarının denetlenmesi.

---

## 🛠️ Kurulum Adımları

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### 1. Ön Koşullar
- Node.js (v18+)
- PostgreSQL (v14+) ve PostGIS Eklentisi

### 2. Projeyi İndirin
```bash
git clone [https://github.com/kullaniciadiniz/izmir-ulasim-kds.git](https://github.com/kullaniciadiniz/izmir-ulasim-kds.git)
cd izmir-ulasim-kds

### 3. Çevre Değişkenlerini Ayarlayın
Ana dizindeki .env.example dosyasının adını .env olarak değiştirin ve kendi PostgreSQL veritabanı bilgilerinizi girin.

### 4. Veritabanını Hazırlayın
PostgreSQL üzerinde izmir_ulasim adında bir veritabanı oluşturun ve db/ klasörü içinde verilen SQL yedeğini (backup) import edin. PostGIS eklentisinin aktif olduğundan emin olun.

### 5. Uygulamayı Başlatın

