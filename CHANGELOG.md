# Sürüm Notları

## 1.0.0

GTA World TR için ilk herkese açık sürüm. Önceki geliştirme sürümlerindeki özellikler ve düzeltmeler bu sürümde bir araya getirilmiştir.

### Discord
- Discord durumu yeniden düzenlendi. Uygulama adının altında yapılan işlem ("Sorgulama yapıyor", "Haritaya bakıyor", "Ceza kanununa bakıyor" gibi) ve bir alt satırda oturum açan karakterin adı gösterilir.

### Arayüz
- Hakkında penceresindeki düğmeler düzeltildi: "Şimdi Güncelle" ve "Sürüm Sayfasını Aç" metinleri artık düğme sınırlarının dışına taşmıyor; güncelleme paneli dar pencerelerde düzgün satırlara bölünüyor.

### Evraklar
- Rapor düzenleyicisindeki metin rengi/vurgu seçicisi düzeltildi. Renk örnekleri artık boş düğmeler gibi görünmek yerine gerçek renklerini gösteriyor; palet tam genişlikte açılıyor ve Arka Plan ile Ön Plan sütunları birlikte görünüyor.
- Seçicideki özel renk alanı yeniden doğru bir renk girişi olarak görüntüleniyor.

### Gezinme
- Hızlı kısayollardan, ana sayfaya yönlendiren Sevk düğmesi kaldırıldı. Uygulama sekmeleri MDC, LSSD Intranet, LSSD Forum ve Ceza Kanunu olarak sıralandı.
- Gezinme çubuğu artık Font Awesome dolu simgelerini ve çok daha geniş bir simge eşlemesini kullanıyor: ana sayfa, kişi sorgusu, APB, evraklar, tutuklama sonrası işlemler, etkin arama emirleri, arama emirleri, acil durum, DMV, haritalar, veritabanları, ceza kanunu, profil, oturumu kapatma ve daha fazlası.
- Gezinme sekmelerindeki simgeler daha düzgün hizalandı, etkin sekme vurgu çubuğuyla belirginleştirildi ve oturumu kapatma sekmesinin kendine özgü stili korundu.
- Font Awesome'a erişilemezse çubuk boş kalmasın diye istemci otomatik olarak yerleşik simge karakterlerine geçiyor.

### Temalar
- Yeni **LSSD Mobil** teması eklendi. LSPD Mobil ile aynı yerleşimi kullanır; istemci arayüzü, MDC ve ceza kanunu sekmesi koyu yeşil zemin ve altın vurgularla gösterilir. Görünüm menüsünden, Araçlar > Ayarlar bölümünden ya da F8 ile temalar arasında geçerek seçilebilir.
- Başarı, uyarı ve tehlike renkleri LSSD temasında da korunur; bağlantılar ve seçili öğe kenarlıkları altın rengindedir.
- Windows 7 temaları artık orta noktada belirgin parlaklık geçişi olan, iki tonlu özgün Aero parlaklığını kullanıyor. Paneller, başlıklar, düğmeler ve pencere başlık çubukları gerçek Aero cam görünümüne daha yakın.

Görseller
- APB'lerde, kayıtlarda, arama emirlerinde ve diğer tüm bölümlerdeki Imgur görselleri artık bir görsel proxy'si üzerinden yükleniyor. Böylece bölge engeline takılan görseller (mor "Bölgenizde görüntülenemiyor" yer tutucusu) normal biçimde görüntüleniyor.
- İlk proxy başarısız olursa istemci otomatik olarak ikinci proxy'yi, ardından özgün bağlantıyı deniyor.

Pencereler
- Sistem tepsisinden tek tıklamayla geri yükledikten sonra istemcinin donması düzeltildi. Pencere artık yanıt vermeyen durumda açılmak yerine yeniden etkinleştiriliyor, küçültülmüş durumdan çıkarılıyor ve doğru şekilde odaklanıyor.
- Tepsiye küçültme artık pencereyi gizli ve küçültülmüş durumda bırakmıyor; donmanın nedeni buydu.

### Evraklar
- Ücret ve ihlal seçicileri artık anlatım düzenleyicisinin ve araç çubuğunun arkasında kalmak yerine bunların üzerinde açılıyor.
- Seçici açıkken çevresindeki ücret satırı kendi katman bağlamından çıkarılıyor ve pencere kapanınca eski haline getiriliyor; böylece rapor penceresindeki diğer öğeler etkilenmiyor.

- Önceki derlemede boş görünen ücret ve ihlal seçicileri düzeltildi. Menüler artık sayfadan kopuk olmadığından seçenek listesi yeniden normal görüntüleniyor.
- Önceki derlemede yanlış konumlanan ve boş görünen Summernote renk paleti düzeltildi.
- Ücret ve ihlal seçicileri açıkken ekrana sabitleniyor. Böylece rapor penceresinin kenarında kesilmiyor ve pencere ne kadar küçük olursa olsun listenin tamamı görüntüleniyor.
- Seçicilerdeki yinelenen kaydırma çubuğu kaldırıldı; artık yalnızca seçenek listesi kayıyor.

- Ücret ve ihlal seçicileri artık kayan listeler olarak açılıyor ve rapor penceresi tarafından kesilmiyor; pencere boyutundan bağımsız olarak tüm liste görüntülenip kaydırılabiliyor.
- Ücret ve ihlal seçicilerindeki yinelenen kaydırma çubuğu kaldırıldı; yalnızca seçenek listesi kaydırılıyor.
- Alanın altında yer yoksa seçici liste alanın üzerine açılıyor; pencere taşındığında, boyutlandırıldığında veya kaydırıldığında alanı izliyor.
- Uzun seçenek adları kesilmek yerine alt satıra geçiyor.
- Anlatım düzenleyicisinin üstündeki istenmeyen beyaz şerit kaldırıldı.

- Anlatım alanına yazılan metin artık yazarken ortalanmıyor. Kayıt gönderildikten sonraki görünümle eşleşecek şekilde sola hizalanıyor; elle ortaladığınız metinler ortalı kalmaya devam ediyor.
- Ücret ve ihlal seçicileri yeniden kullanılabilir boyutta açılıyor. Ücret kutusu listeyi artık kesmiyor; tek satır yerine ücretlerin tamamını kaydırabilirsiniz.
- Uzun ücret adları kesilmek yerine alt satıra geçiyor.
- Ücret satırları kutularında düzgün hizalanıyor: seçiciler genişliği eşit paylaşıyor, kaldırma düğmesi doğal boyutunda kalıyor ve satırlar arasında boşluk bulunuyor.

### Pencereler

- Açılır pencereler artık boyutlandırılabiliyor. Genişletmek, daraltmak, uzatmak veya kısaltmak için pencerenin sağ alt köşesindeki tutamacı sürükleyin. Pencere kapatıldığında boyutu sıfırlanır.

### Windows 7 Aero temaları

- Evrak penceresinin renkleri düzeltildi. Anlatım düzenleyicisi, durum çubuğu ve ücret kutusu artık koyu kalmak yerine pencerenin geri kalanıyla aynı cam alan renklerini kullanıyor.

### Düzeltmeler

- Klasik ve Windows 7 Aero temalarındaki form sayfaları artık MDC'nin özgün temasındaki yerleşimi kullanıyor: her etiket tam genişlikli alanının üstünde ayrı satırda duruyor, satırlar doğal sütunlarını koruyor ve harita sağdaki sütununda kalıyor. Önceki sürüm etiket ve alanları aynı satıra sıkıştırıyor, alan metinlerini kesiyordu.

- Anlatım düzenleyicisindeki yer tutucu metin artık dolu bir blok üzerinde görünmüyor. Arka planı saydam ve metin temanın soluk rengini kullanıyor; böylece hem açık Windows 7 ve Klasik temalarda hem de koyu temalarda okunabiliyor.
- MDC genelindeki alan yer tutucuları da aynı kurala uyarak beyaz alanlar üzerinde görünmez hale gelmiyor.
- Olay formu artık MDC'nin kendi alan konumlarını koruyor. İstemci girişleri tam genişliğe uzatmıyor ve her etiketi ayrı satıra zorlamıyor; böylece yarım genişlikli alanlar, Durum ile Tarih ve Saat gibi yan yana satırlar ve anlatım sütunu web MDC'deki konumlarında kalıyor.

- Olay formundaki Anlatım ve Ek Bilgiler düzenleyicilerinin üstünde görünen boş yinelenen metin kutuları kaldırıldı. Bunlar zengin metin düzenleyicisinin arka planda tuttuğu gizli kaynak alanlarıydı; istemci artık bunları görünür hale getirmiyor.
- Fotoğraf Yükle penceresi, kırpma aracı yüklenmeden önce seçtiğiniz resmi hemen gösteriyor; böylece yükleme sonrasında pencere boş kalmıyor.
- Başlangıç sesi artık istemci her açıldığında bir kez çalıyor. Ctrl+R ile sayfa yenilemek sesi yeniden başlatmıyor.
### Sabıka fotoğrafları

- Yerleşik kırpma aracı kaldırıldı. Fotoğraf Yükle penceresine artık hiç müdahale edilmiyor; böylece MDC'nin kendi kırpma ve yükleme araçları tarayıcıdaki gibi çalışıyor.
- Önizleme gizlenmiyor, Yükle düğmesi zorla etkinleştirilmiyor ve yüklenen görsele müdahale edilmiyor.

### Tanılama

- Ctrl+Shift+M kopyalanabilir sayfa raporunu açmaya devam ediyor.

### Sabıka fotoğrafları

- Fotoğrafı formun içinde değil tek başına taşıyan yüklemelerde de artık kırpılmış kare kullanılıyor. Böylece MDC'nin fotoğraf gönderebildiği bir yöntem daha destekleniyor.

### Tanılama

- Sabıka fotoğrafı raporu eklendi. Kayıt sayfasında Ctrl+Shift+M tuşlarına basarak hangi kırpma aracının kullanıldığını, Fotoğraf Yükle penceresinin içeriğini ve son isteklerin gerçekten ne gönderdiğini gösteren kopyalanabilir raporu açabilirsiniz. Fotoğraf sorununu bildirirken raporu paylaşın.

### Sabıka fotoğrafları

- Sitenin özgün temasında kırpma çerçevesinin altında görünen yinelenen fotoğraf düzeltildi. İstemci sayfanın yedek görselini yanlışlıkla yeniden gösteriyordu; artık yalnızca kırpılan fotoğraf görünür, penceredeki diğer kopyalar gizlenir.
- Yükleme sırasında kırpmanın yok sayılması düzeltildi. MDC'nin kendi kodu kırpılmış fotoğrafı isterken görselin başka bir kopyasına başvuruyor ve sonuç alamadığı için özgün dosyaya dönüyordu. İstek artık her zaman seçtiğiniz kareyi döndürüyor; kodlanmış metin olarak fotoğraf taşıyan yüklemeler de destekleniyor.

### Sabıka fotoğrafları

- Fotoğraf Yükle penceresindeki küçük önizleme resmi kaldırıldı.
- Kırpma sırasında Yükle düğmesi artık devre dışı görünmüyor. Kırpma çerçevesi açık olduğu sürece etkin ve belirgin kalıyor.
- Kırpma çerçevesini taşıyıp boyutlandırdıktan sonra Yükle'ye basıldığında artık kırpılmış kare gönderiliyor. Her ayarlamadan sonra kırpma kaydediliyor ve istemci yüklemedeki görseli de kırpılmış olanla değiştiriyor; böylece fotoğrafın tamamı yanlışlıkla gönderilemiyor.

### Sabıka fotoğrafları

- Yerleşik kırpma aracı artık sitenin özgün teması dahil tüm temalarda MDC'nin kırpma kitaplığının yerini alıyor. Sitenin pencerede bıraktığı kırpma kapsayıcısı yüzünden vazgeçmiyor; kapsayıcıyı temizliyor ve sayfa önizleme fotoğrafına hangi adı vermiş olursa olsun onu buluyor.
- MDC kodunun yaptığı tüm kırpma istekleri artık yerleşik araç tarafından yanıtlanıyor. Böylece pencereyi açma ve Yükle'ye basma işlemleri birbiriyle yarışan iki kırpma katmanı yerine tek araçtan geçiyor.

### Düzeltmeler

- Olay formunda anlatım düzenleyicisinin yanında görünen gereksiz "Anlatım:" başlığı kaldırıldı.

### Sabıka fotoğrafları

- İstemci artık Fotoğraf Yükle penceresi için kendi kırpma ve boyutlandırma aracını içeriyor. Böylece MDC'nin kendi kırpma kitaplığı istemcide yüklenmese bile fotoğraf işlemleri çalışıyor. Bir fotoğraf seçtiğinizde üzerinde kare bir kırpma çerçevesi beliriyor: taşımak için çerçeveyi, boyutlandırmak için köşelerinden birini sürükleyin; küçük canlı önizleme anında güncellenir. Yükle'ye basıldığında fotoğrafın tamamı yerine kırpılmış kare gönderilir.

### Sayfalar ve yerleşim

- Olay oluşturma ve diğer MDC form sayfaları artık sitenin kendi dikey yerleşimini koruyor. Etiketler tek satıra sıkıştırılmak yerine tam genişlikli alanlarının üzerinde duruyor; bu sayfalarda istemcinin düğme ve sütunları sıkıştıran düzeni devre dışı.
- Araç plakalarında MDC'nin kendi işaretlemesi korunuyor. Kırmızı San Andreas başlığı, iki kırmızı sekme ve lacivert plaka numarası web MDC'deki gibi görüntüleniyor; istemci artık üzerlerine ikinci bir plaka çizmiyor.
- MDC'nin beyaz olarak işaretlediği panel ve kartlar beyaz kalmak yerine etkin temayı izliyor. Böylece Windows 7 Aero LSPD temasında Olay Veritabanı sayfasındaki Birim Ara kutusu da düzeldi.
- Araç plakaları, DMV araç kaydında gösterilen plaka dahil her yerde MDC'nin kendi tasarımını kullanıyor; DMV kaydıyla olay formunda aynı plaka görünür.
- Fotoğraf Yükle penceresindeki kırpma ve boyutlandırma aracı düzgün görüntüleniyor. Resim, kırpma çerçevesi, tutamaçları ve canlı önizleme web MDC'deki gibi görüntülenip taşınabiliyor ve boyutlandırılabiliyor.
- Araç Haritası'ndaki sokak araması sonuçları artık haritanın ve arama kutusunun üzerine düz metin çizmek yerine kutunun altında, okunaklı ve düz bir arka planla açılıyor.
- Birim ve diğer seçim alanları beyaz kalmak yerine etkin temayı izliyor.
- Kişisel kayıt açılırken önceki ayarların ve MDC yan panelinin güncel ayarlar yüklenene kadar kısa süre görünmesi düzeltildi.
- Ceza Kanunu sekmesinde artık forumun "San Andreas Ceza Kanunu" sayfa başlığı ve arka planı görünmüyor.

### Geçmiş

- Ctrl+H ile açılan geçmiş penceresi artık sayfalara ayrılıyor. İlk, önceki, sonraki ve son sayfa düğmeleri ile 25, 50, 100 veya 200 kayıtlık sayfa boyutu eklendi; uzun geçmiş artık pencerenin altından taşmıyor. Arama ilk sayfaya döner.

### Kısayollar

- Kısayollar artık fare düğmelerine atanabiliyor. Yardım > Klavye Kısayolları bölümünde Değiştir'e basıp orta veya yan düğmeye tıklayın. Geri/ileri yan düğmeleri ve orta düğme kabul edilir; istemcide ve MDC sayfalarında çalışır.

Büyük bir güncelleme. İstemci yeni bir tema motoruyla yeniden oluşturuldu; Windows 7 tema ailesi, sayfa sistemi, geçmiş ve bildirimler, güncelleme denetimi, Discord durumu ve MDC sayfa yerleşimine yönelik çok sayıda düzeltme eklendi.

### Arama emri görüntüsü alma

- Arama emri kopyalanırken sayfanın görünümü artık yeniden boyanmıyor. İstemci kendi görüntü alma stilini uygulamak yerine çekim anında ekrandaki renkleri sabitliyor; görsel hazırlanırken ekranda hiçbir değişiklik olmuyor.
- Yeşil `Etkin` rozeti gibi durum etiketleri dışa aktarılan görselde kendi metin renklerini koruyor. Önceki görüntü alma stili, Bootstrap rozeti olmayan tüm öğeleri yeniden renklendiriyor ve farklı sınıf kullanan rozetlerin etiketlerini siliyordu.
- Görüntü alma penceresinin süresi 6 saniyeden 1,5 saniyeye indirildi.

### Temalar

- İstemciyle birlikte yedi tema gelir: Klasik Açık, Klasik Koyu, LSPD Mobil, Windows 7 Aero, Windows 7 Aero LSPD, Windows 7 Aero Koyu ve tüm stilleri kapatan Özgün MDC. Yedisi de Ayarlar > Görünüm bölümünde listelenir; F8, Ceza Kanunu sekmesi dahil her yerden temalar arasında geçiş yapar.
- Üç Windows 7 teması yalnızca renk değiştirmek yerine gerçek Aero görünümüyle baştan oluşturuldu: cam geçişleri, ince kenarlıklar ve panellerde iç vurgular, kabartmalı başlıklar, geçişli pencere başlık çubukları, üzerine gelme ve basılma durumları ayrışan metal düğmeler ve geçişli tutamaçlara sahip 17 piksel kaydırma çubukları. Temalar istemci arayüzünü, MDC'yi, Ceza Kanunu sekmesini ve açılır pencereleri değiştirir.
- Windows 7 Aero LSPD, lacivert metal paleti her yerde kullanır. Böylece düğmeler, açılır menüler, arama alanları ve daraltma anahtarları arayüzle eşleşir; lacivert üzerinde beyaza yakın Aero metali görünmez.
- LSPD Mobil; ana sayfa, tablolar, durum etiketleri ve sayfa başlığı dahil tüm istemciyi devriye laciverdine boyar.
- Temalar sayfa çizilmeden önce uygulanır; sayfa değiştirirken stilsiz sitenin kısa süre görünmesi engellenir.
- Özel tema etkinken sitenin gündüz modu ve diğer tema kontrolleri gizlenir; bunlar özel temayla çakışır.

### Sayfalar ve gezinme

- Aynı anda birden fazla MDC sayfası, her biri ayrı görünümde açılabilir. Böylece öndeki başka bir sayfada çalışırken kayıtların kaydırma konumu ve yarım doldurulmuş formları korunur. Sekmelerin altındaki sayfa şeridinde her sayfanın kapatma düğmesi ve yeni sayfa düğmesi bulunur. Ctrl+T sayfa açar, Ctrl+W kapatır; sitenin yeni pencerede açacağı bağlantılar açılır pencere yerine yeni sayfada gösterilir.
- Sayfalar, sitenin başlığını tekrarlamak yerine içeriklerine göre gezinme adı veya kayıt numarasıyla adlandırılır.
- Bir gezinme düğmesine, hızlı kısayola veya bağlantıya sağ tıklayarak onu öndeki sayfanın yerine açmak yerine yeni sayfada açabilirsiniz.
- İsteğe bağlı MDC gezinme çubuğu yan panel bağlantılarını sekme olarak gösterir; yan panelin kendisi gizlenip kilitlenebilir. Hızlı kısayollar, sekme şeridinin altındaki adlandırılabilir ve açılıp kapatılabilir Ana Sayfa, Sorgu, Trafik, C6 ve Çağrılar simgeleridir.
- Açılır pencereler başlık çubuklarından sürüklenebilir; arkadaki sayfa kullanılmaya devam eder.

### Geçmiş, uyarılar ve bildirimler

- Aranabilir geçmiş, ziyaret edilen her sayfayı kaydeder; isteğe bağlı olarak yalnızca kişiler ve araçlarla sınırlandırılabilir. Ctrl+H ile açılır.
- Okunmamış bildirimleri izleyen bir uyarı sayacı, isteğe bağlı ses ve oturum açma hatırlatıcısı eklendi.
- Dokuz arayüz sesi bulunur: tıklama, gezinme, sayfa açma ve kapatma, onay, kopyalama, bildirim, uyarı, hata ve başlangıç. Varsayılan olarak kapalıdır.
- İsteğe bağlı Discord zengin durumu.

### Güncellemeler ve kimlik

- İstemcinin adı Mobile Data Computer - GTA World TR olarak değiştirildi ve yeni uygulama simgesi eklendi.
- Başlangıçta GitHub'daki yeni sürümler denetlenebilir; güncelleme indirilip mevcut kurulumun üzerine yüklenebilir.
- Yardım menüsüne klavye kısayolları başvurusu eklendi; kısayollar yeniden atanabilir.

### Ceza Kanunu

- Çift parantez içindeki rol dışı notlar; konu olay kaydı, forum alt bilgisi, tema değiştirici ve telif satırıyla birlikte kaldırılır.
- Sayfa artık yatay kaydırılmaz ve sayfa seçicinin arka planı saydamdır.

### Yerleşim ve görüntüleme düzeltmeleri

- Yerleşim kapsayıcıları artık boyanmıyor. Bir kural; ızgara satırları ve sütunları, tablo hücreleri, liste öğeleri, form grupları ve panel gövdeleri dahil sayfadaki tüm yapısal öğelere panel rengini uyguluyordu. Böylece panel içindeki her öğenin arkasında ikinci bir renk bloğu oluşuyordu. Ana sayfa istatistiklerinin, APB alanlarının ve mühür yuvalarının kutu içine alınmış görünmesinin nedeni buydu. Kart, panel, iletişim penceresi ve menü gibi gerçek yüzeyler tema rengini almaya devam eder; yalnızca içerikleri gruplandıran öğeler saydam kalır.
- Uzun ücret adları tüm temalarda kesilmek yerine alt satıra geçer. Rozetler hücre genişliğiyle sınırlandırılır ve gerektiğinde satır kırar.
- Departman mühürleri, mahkeme armaları, birim logoları ve sabıka fotoğrafları artık renkli blokların içinde görünmüyor.
- Aero temalarında kişi kartı, Klasik temalarla uyumlu gerçek bir Windows paneli olarak çizilir.
- Çevrilmemiş etiketler düzeltildi; Kayıt Görüntüle artık `index.CreatedBy` gibi ham anahtarlar göstermiyor ve `index.Report` değerini bağlantıya dönüştürmüyor.
- Hata bildirimi simgesi artık kesilmiyor.
- Arama Emri Kopyala, seçili temadan bağımsız olarak PNG'yi özgün belge renkleriyle dışa aktarır; indirmeler sorulmadan İndirilenler klasörüne kaydedilir.
- Kayıt Düzenle, Kayıt Ekle, tutuklama anlatımları, olay gönderileri ve yorumlardaki BB kodu araç çubukları yataydır ve renk paletleri kullanılabilir durumdadır.
- Ücretler ve ihlaller kendi kenarlıklı, içeriden kaydırılabilir panellerinde alt alta sıralanır; anlatım düzenleyicisinin üzerine taşmaz.
- Kişi Sorgusu ve Kimlik Sorgusu alanları, Sorgula düğmesiyle aynı eksen ve genişlikte ortalanır.
- Perfect Scrollbar rayları artık ikinci bir kaydırma çubuğu oluşturmuyor; dikkat kodu ve profil örneği seçicileri yeniden kaydırılabiliyor.
- Harita çevresinin renkleri güncellendi ve harita arama çubuğu eklentinin gerçek işaretlemesine göre yeniden oluşturuldu.
- İptal Et ve Askıya Al düğmeleri yan yana durur; DMV sınıfı ve Olay Veritabanı düğmeleri tutarlı hizalanıp boyutlandırılır; daraltma düğmeleri artık metnin üzerine taşmaz.
- Fotoğrafı olmayan kayıtlarda büyük bir GÖRSEL BULUNAMADI bloğu yerine küçük bir yer tutucu gösterilir.
- Pencereyi sistem tepsisinden geri yüklemek artık istemciyi dondurmuyor.
- Dağıtılan kaynak dosyalardaki tüm yorumlar kaldırıldı.

- Kayıt Düzenle, Kayıt Ekle, tutuklama anlatımları, olay gönderileri ve sayfa yorumlarındaki BB kodu araç çubukları yeniden yatay hale getirildi. Düzenleyici araç çubuğu `class="note-toolbar card-header"` taşıdığı için kart ve iletişim penceresi başlık kurallarına takılıyor, her düğme grubu tam genişlikli ayrı bir satıra yerleşiyordu. İletişim pencerelerinde ikinci bir kural daha etkiliydi: Tür / Durum / Gizlilik Seviyesi alanlarını başlıklarıyla hizalayan başlık-sütun kuralı araç çubuğu gruplarını da eşleştiriyordu. Bu yüzden ilk düzeltmeden sonra Kayıt Düzenle hâlâ dikey görünüyordu. Artık düzenleyici grupları bu kuralın dışında tutuluyor; araç çubuğu daha yüksek seçici önceliğiyle kendi düzenini kullanıyor: satır kaydırabilen yatay şerit, satır içi düğme grupları, 22 piksel düğmeler ve temalı yazı tipi, stil, tablo ve renk menüleri.
- Düzenleyicideki renk paletleri yeniden kullanılabilir durumda: iki palet yan yana, gerçek satırlara dizilmiş 16 piksellik renk örnekleri var. Renk örneklerinin kendi renklerine dokunulmadığından uygulayacakları rengi göstermeye devam ediyorlar.
- Sayfalar şeridi, hızlı kısayol şeridi gibi `SAYFALAR` başlığını kullanıyor. Her öğe, sitenin her yerde tekrarlanan "Mobil Veri Bilgisayarı" başlığı yerine sayfanın gezinme adıyla veya kayıt numarasıyla adlandırılıyor. Bir gezinme düğmesine, hızlı kısayola ya da kayıt, arama emri veya Acil Durum Haritası gibi sayfa bağlantısına sağ tıklayarak onu öndeki sayfanın yerine açmak yerine yeni sayfada açabilirsiniz.
- Aynı anda birden fazla MDC sayfası açılabiliyor. Her sayfa kendi görünümünü kullandığından başka bir sayfa öndeyken kayıtların kaydırma konumu ve yarım doldurulmuş formları korunuyor. Sekmelerin altındaki sayfa şeridinde her sayfanın kapatma düğmesi ve `+` düğmesi bulunuyor; Ctrl+T sayfa açıyor, Ctrl+W kapatıyor ve sitenin yeni pencerede açacağı bağlantılar açılır pencere yerine yeni sayfa olarak gösteriliyor.
- Kişi Sorgusu ve Kimlik Sorgusu alanları Sorgula düğmesiyle aynı eksen ve genişlikte ortalanıyor. Alanlar bir `form` içinde olmadığından önceki form kapsamlı ortalama kuralı uygulanmıyordu; yeni kurallar gerçek `.tab-content > .tab-pane > .row.justify-content-center > .col-xl-4` işaretlemesini hedefliyor.
