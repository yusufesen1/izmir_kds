const fs = require('fs');
const path = require('path');

// Hedef klasör yolu
const klasorYolu = path.join(__dirname, 'csv_data');

console.log("------------------------------------------------");
console.log("📂 İNCELENEN KLASÖR: " + klasorYolu);
console.log("------------------------------------------------");

if (fs.existsSync(klasorYolu)) {
    console.log("✅ Klasör bulundu. İçindeki dosyalar listeleniyor:");
    const dosyalar = fs.readdirSync(klasorYolu);
    
    dosyalar.forEach(dosya => {
        // Dosya adını tırnak içinde yazdırıyoruz ki boşluk hatası varsa görelim
        console.log(`   📄 [${dosya}]`);
    });
    
    console.log("------------------------------------------------");
    console.log("⚠️  LÜTFEN DİKKAT:");
    console.log("1. Eğer 'hatlar.csv.csv' görüyorsan, sondaki fazlalığı sil.");
    console.log("2. Eğer 'hatlar.csv ' (sonunda boşluk) görüyorsan düzelt.");
    console.log("3. Eğer dosya adında büyük/küçük harf farkı varsa düzelt.");
} else {
    console.log("❌ HATA: 'csv_data' klasörü bulunamadı!");
    console.log("   Lütfen klasör adının tam olarak 'csv_data' olduğundan emin ol.");
}