# Mobile Data Computer - GTA World TR

GTA World Web MDC için sade bir masaüstü kabuğu
(<https://mdc-tr.gta.world/>). Site, uygulamanın içine gömülü bir tarayıcıda
açılır; menü çubuğu, araç çubuğu ve durum çubuğu ise standart HTML öğeleridir.
Görünüm bilerek gösterişsiz tutuldu: sistem yazı tipleri, gri paneller ve köşeli
çizgiler. 2008'den beri bir sevk merkezinde çalışıyormuş gibi.

Kodda bilerek açıklama satırı kullanılmıyor. Açıklanması gereken her şey,
tekrarlanmaması gereken hatalar listesi de dahil, bu dosyada yer alıyor. Sürüm
geçmişi için `CHANGELOG.md` dosyasına bakın.

### Nasıl geliştirildi, sizin için ne anlama geliyor?

Bu istemci bir API kullanmaz. Gerçek siteyi yükler ve görünümünü dışarıdan
değiştirir. Uygulanan her kural, MDC'nin gerçek sayfa kaynak kodu incelenerek
yazılmıştır: iletişim pencerelerinin, tabloların, formların ve araç çubuklarının
işaretlemesi okunup seçiciler tek tek eşleştirilmiştir. Kaynak koduna erişim
varken hiçbir şey ekran görüntüsünden tahmin edilmemiştir.

Bu yaklaşım uygulamanın sınırlarını da belirler. **Amirler ve üst rütbeli
memurlar bazı özelliklerin eksik çalışabileceğini veya hiç çalışmayabileceğini
hesaba katmalıdır.** Bu rütbeler, geliştirme sırasında kullanılan hesapta
görünmeyen sayfalar, paneller ve pencereler görür. Bu nedenle ilgili sayfaların
kaynak kodu alınamamış, davranışları test edilememiş ve stilleri
düzenlenememiştir. Amir izinlerinin arkasındaki bölümler en iyi ihtimalle
stilsiz, en kötü ihtimalle hizası bozuk olabilir. Bu sayfalara erişiminiz varsa,
yanlış görünen ekranın sayfa kaynağını paylaşın; diğer bölümler gibi onu da
düzeltebiliriz.

### Sayfalar

Aynı anda birden fazla MDC sayfası açabilirsiniz. Sekmelerin altındaki `SAYFALAR`
şeridi açık sayfaları listeler. `+` yeni sayfa açar, çarpı sayfayı kapatır;
Ctrl+T ve Ctrl+W aynı işlemleri klavyeden yapar. Sitenin yeni pencerede açtığı
öğeler de yeni sayfa olarak eklenir. Her sayfa ayrı bir görünüm olduğundan,
başka bir sayfada çalışırken kayıtların kaydırma konumu ve yarım bırakılmış
formları korunur.

Bir öğeye sağ tıklayarak onu yeni sayfada açabilirsiniz: Acil Durum Haritası gibi
bir gezinme düğmesi, hızlı kısayol veya kişinin kaydı ya da arama emri gibi bir
sayfa bağlantısı. Sol tıklama geçerli sayfada gezinmeye devam eder.

Sayfa sekmelerinde sitenin hemen her ekranda kullandığı "Mobil Veri Bilgisayarı"
başlığı yerine sayfanın gezinme adı veya kayıt numarası gösterilir.

### Geçmiş

Araçlar > Geçmiş bölümünü veya Ctrl+H kısayolunu kullanın. İstemcide açılan her
sayfa ve kayıt, açılma saati ve türüyle birlikte kaydedilir: kişi adı, plaka
sorgusu, arama emri, olay veya harita. Geçmiş listesinin araması isim, plaka,
kayıt numarası, adres, sayfa adı ve tarihe göre eşleşme bulur; böylece hangi
kayıtları ne zaman sorguladığınızı sonradan görebilirsiniz.

Bir kayda sol tıklayarak öndeki sayfada, sağ tıklayarak yeni bir sayfada
açabilirsiniz. Geçmiş yalnızca bu bilgisayarda, istemcinin kendi depolama alanında
tutulur ve hiçbir yere gönderilmez. Oturumu Temizle işlemi geçmişi silmez; geçmiş
penceresindeki Geçmişi Temizle düğmesini kullanın veya kaydı tamamen kapatmak
için Araçlar > Ayarlar bölümüne gidin.

Geçmiş anahtarının altındaki **Yalnızca kişi ve araç sorgularını kaydet**
seçeneği açıldığında yalnızca kayıtlar, isim ve plaka sorguları, araçlar ve
arama emirleri tutulur; ana sayfalar, listeler, haritalar ve ceza kanunu
atlanır. Geçmiş kapalıyken bu seçenek devre dışıdır.

### Sesler

Sesler Araçlar > Ayarlar bölümünde bulunur ve varsayılan olarak kapalıdır. Dokuz
ses vardır: tıklama, gezinme, sayfa açma, pencere kapatma veya geri gitme,
kopyalama onayı, bildirim, kısıtlı işlem uyarısı, işlem ya da MDC hata mesajı ve
başlangıç sesi.

---

## 1. Kaynak koddan çalıştırma

Windows'ta Node.js 18 veya üzeri gerekir.

```
npm install
npm start
```

İlk açılışta GTA World UCP oturum açma sayfası gösterilir. Tarayıcıda yaptığınız
gibi giriş yapın. Çerezler saklandığından, uygulamayı yeniden açtığınızda oturum
açık kalır.

### Betikler

| Komut | Açıklama |
| --- | --- |
| `npm start` | Uygulamayı kaynak koddan çalıştırır |
| `npm run smoke` | Betiklerin sözdizimini denetler ve renderer'ı sahte DOM üzerinde çalıştırır |
| `npm run pack` | Uygulama klasörünü `dist/win-unpacked` içine paketler |
| `npm run dist` | electron-builder ile NSIS kurulum paketi oluşturur |
| `npm run icon` | `build/icon.png` dosyasından `build/icon.ico` üretir (Python + Pillow gerekir) |

Renderer'da her değişiklikten sonra `npm run smoke` çalıştırın. Test gerçek
`renderer/index.html` dosyasını ayrıştırır ve `renderer/renderer.js` dosyasını
elle hazırlanmış bir DOM taslağı üzerinde çalıştırır. Sözdizimi hatasında,
bulunamayan bir öğe kimliğinde, olay bağlantısı yapılmamış menü başlığı ya da
öğesinde veya açılıp kapanmayan bir menüde başarısız olur. Yüklenirken hata veren
renderer tüm menü çubuğunu sessizce devre dışı bırakabilir; daha önce yaşanan
bir sürümde sorun tam olarak buydu.

## 2. Paketleme

`npm run pack`, `Mobile Data Computer - GTA World TR.exe` dosyasını, Electron
çalışma zamanını ve `resources/` klasörünü içeren `dist/win-unpacked/` dizinini
oluşturur. Bu klasör kurulum paketi için girdi olarak kullanılır;
`installer/mdc-client.iss` dizini paketlemeye hazır bir Inno Setup betiğidir.
Betiğin `AppVersion` değerini `package.json` içindeki `version` değeriyle aynı
tutun.

---

## 3. Dizin yapısı

```
main.js               pencere, kalıcı oturum, sistem tepsisi, IPC
preload.js            uygulama penceresi için küçük köprü
webview-preload.js    MDC sayfasında tema, düzeltmeler ve yan panel anahtarı
renderer/
    index.html            menü, araç çubuğu, arama çubuğu, durum çubuğu, pencere
    style.css             yalnızca uygulama arayüzünün stilleri
    renderer.js           uygulama arayüzünün tüm davranışları
    sounds/               click.mp3, close.mp3, error.mp3
build/                uygulama simgesi (.ico ve .png)
installer/            Inno Setup betiği
.github/workflows/    etiketten otomatik kurulum paketi derleyen iş akışı
tools/
    smoke.js            renderer için çalışma zamanı testi
    release-notes.js    CHANGELOG'dan sürüm notunu çıkarır
    mk_icon.py          simgeyi yeniden üretir
```

---

## 4. Oturum açma ve gizlilik

Uygulama UCP parolanızı hiçbir zaman istemez, saklamaz veya iletmez. Girişi
uygulamanın içindeki sayfadan yaparsınız. Çerezler, **sabit** bir klasör altında
bulunan kalıcı `persist:gtaw-mdc` oturum bölümünde tutulur:
`%APPDATA%\gtaw-mdc-client`.

Bu klasör `main.js` içinde sabitlenmiştir ve öyle kalmalıdır. Electron normalde
veri klasörünü uygulama adından türetir. Ürün adı bir kez değiştirildiğinde
oturum başka, boş bir klasöre yönelmiş; kayıtlı giriş kaybolmuş ve oturum
kapanmış olmasına rağmen sayfa bozukmuş gibi görünmüştü. Önceki adlardan kalma
bir klasör bulunursa içeriği yeni konuma bir kez kopyalanır.

Dosya > Oturumu Temizle komutu isteğiniz üzerine oturumu siler. Uygulamayı
kaldırmak bu klasöre dokunmaz; bu nedenle yeniden kurulumda tekrar giriş
yapmanız gerekmez. Tamamen çıkış yapmak için klasörü kendiniz silin.

---

## 5. Özellikler

### Temalar

| Tema | Açıklama |
| --- | --- |
| Klasik Açık | Gri paneller, köşeli görünüm; varsayılan tema |
| Klasik Koyu | Aynı düzen, koyu renk paleti |
| LSPD Mobil | İstemciye, MDC'ye ve ceza kanunu sekmesine PremierOne laciverti uygulanır |
| LSSD Mobil          | İstemciye, MDC'ye ve ceza kanunu sekmesine koyu yeşil ve altın vurgular uygulanır |
| Windows 7 Aero | Cam efektleri, yuvarlatılmış paneller, mavi odak parıltıları ve açık vurgular |
| Windows 7 Aero LSPD | Windows 7 cam efektleri altında lacivert tema |
| Windows 7 Aero Koyu | Gece kullanımı için grafit cam görünümü |
| Özgün MDC | Ek stil uygulanmaz; site özgün görünümüyle açılır |

Temayı Görünüm veya Araçlar > Ayarlar menüsünden değiştirebilir ya da F8 ile
temalar arasında geçiş yapabilirsiniz. **Oturum açma sayfalarına tema uygulanmaz.**
Tema yalnızca `mdc-tr.gta.world` üzerinde etkinleşir; UCP ve Google giriş
ekranları özgün görünümleriyle gösterilir.

Tema davranışıyla ilgili notlar:

- ARANIYOR (WANTED) çubuğu panelinin tamamı boyunca düz kırmızı gösterilir; sabit ve kısa satır yüksekliği, çubuğun gereğinden fazla uzamasını önler.
- Ceza Puanı (Criminal Points) şeridinin ve Yaş (Age) alanının arka planı ile kenarlığı kaldırılır; böylece düz metin gibi görünürler.
- Kayıtlarda çift yıldız (`**`) içine alınan metinler, `/me` rol yapma yazımı doğrultusunda italik mor gösterilir.
- Üzerine gelindiğinde yan panel satırlarının metin veya arka plan rengi değişmez.
- Çift yıldızların yalnızca içindeki metin renklendirilir; yıldızlar gizlenir. Özgün MDC teması seçildiğinde karakterler geri yüklenir.

### Yan panel

Görünüm alanını genişletmek için MDC'nin sol gezinme panelini gizleyebilirsiniz:
araç çubuğundaki **Yan Panel** düğmesini, Görünüm > MDC Yan Paneli seçeneğini,
F10'u veya Araçlar > Ayarlar'ı kullanın. Tercih kaydedilir, sayfa geçişlerinde
korunur ve temalar kapalıyken de çalışır.

### MDC arama kutuları

Sitenin Kişi Sorgula ve Araç Sorgula alanlarını Araçlar > Ayarlar > Yerleşim
bölümünden gizleyebilirsiniz. Uygulamanın isim ve plaka sorguları aynı alanları
kullandığı için bu durumda da çalışmaya devam eder.

### Sesler

Varsayılan olarak kapalıdır; Araçlar > Ayarlar > Sesler bölümünden açabilirsiniz.
`renderer/sounds` klasöründeki üç kısa ses dosyası şunlardır: tıklama ve gezinme
için `click.mp3`, pencere kapatma, bildirimi kapatma veya geri gitme için
`close.mp3`, başarısız işlemler, yüklenemeyen sayfalar ve site hata mesajları
için `error.mp3`. Sesleri değiştirmek için dosyaları yenileriyle değiştirin;
dosya adları sabittir.

### Uygulama sekmeleri

Sayfa alanının üzerinde MDC, LSSD Intranet, LSSD Forum, Ceza Kanunu ve Ceza
Kanunu (Yedek) sekmeleri bulunur (sırasıyla Ctrl+1–5; ayrıca Görünüm menüsünde).
LSSD Intranet sekmesi LSSD Portal giriş sayfasını, LSSD Forum sekmesi ise
<https://lssd-tr.gta.world/index.php> adresini uygulama içinde açar. Ceza Kanunu sekmesi,
GTA World forumlarındaki San Andreas Ceza Kanunu konusunu yükler ve yalnızca
kanun metnini bırakır. Forum başlığı, gezinme alanları, içerik yolu, alt bilgi,
yazar panelleri, gönderi kontrolleri, tepkiler, sayfalama ve profil bağlantıları
gösterilmez. Başlıklar, tablolar ve alıntılar uygulamanın geri kalanıyla aynı
temayla yeniden biçimlendirilir; koyu tema burada da geçerlidir. Ceza Kanunu
(Yedek) aynı görünüm, arama ve oturum kapatma özelliklerini ayrı bir oturum
deposunda çalıştırır; ilk sekmedeki forum doğrulama/oturum sorunları için
alternatif olarak kullanılabilir.

Forumda ayrıca oturum açmanız gerekir; bunu sekmede, tarayıcıda yaptığınız gibi
yapabilirsiniz. Forum giriş bilgileri saklanmaz. Giriş yapana kadar forum sayfası
özgün stiliyle gösterilir, böylece giriş formu normal çalışır. Ceza Kanunu
çubuğundaki Forum Oturumunu Kapat düğmesi iki Ceza Kanunu oturumundaki forum
çerezlerini siler; MDC oturumu açık kalır.

Ceza kanunu arama kutusu yazdıkça maddeleri filtreler. Aranan metni içermeyen
maddeler gizlenir, eşleşmeler vurgulanır ve sonuç sayısı durum çubuğunda
gösterilir. Temizle düğmesi tüm maddeleri yeniden gösterir.

### Bildirim alanı (sistem tepsisi)

Varsayılan olarak kapalıdır; Araçlar > Ayarlar > Pencere bölümünden açabilirsiniz.
Açıkken pencereyi küçültmek veya kapatmak uygulamayı sistem tepsisinde çalışır
durumda bırakır. Geri açmak için simgeye tıklayın; çıkmak için simgenin menüsündeki
Çıkış komutunu kullanın. Kapalıyken pencere normal şekilde davranır.

### Klavye

| Tuş | İşlev |
| --- | --- |
| F5 | Yenile |
| F3 | Sonrakini bul |
| F8 | Temalar arasında geçiş yap |
| F9 | Adres çubuğu |
| F10 | MDC yan panelini göster/gizle |
| Ctrl+F | Sayfada bul |
| Ctrl+N / Ctrl+L | İsim sorgusu / plaka sorgusu |
| Ctrl+P | Yazdır |
| Ctrl +, Ctrl -, Ctrl+0 | Yakınlaştır, uzaklaştır, sıfırla |
| Alt+Sol / Alt+Sağ | Geri / ileri |
| Esc | Menüyü, arama çubuğunu veya iletişim penceresini kapatır; aksi durumda yüklemeyi durdurur |

### Tanılama

Araçlar > Yerleşim Raporu; pencere boyutunu, gömülü görünümün boyutunu, sayfa
görüntü alanını ve belge boyutunu, bunların oranını ve görüntü alanından uzun
öğeleri gösterir. Uygulama kabuğundaki boyutlandırma sorunlarını sayfa
sorunlarından ayırmanın en hızlı yoludur.

---

## 6. Deneyimle öğrenilen kurallar

Bu maddelerin her biri ekranda görünen bir hataya yol açtı. Kodda artık yorum
satırı bulunmadığından, tekrarlanmaması gerekenleri burada topladık.

1. **`font-family` listesine `inherit` eklemeyin.** Geçerli bir değer değildir
   ve bildirimin tamamını geçersiz kılar; sonuçta tüm simgeler boş kareye döner.
2. **Genel bir `transition: none` veya `animation: none` kuralı uygulamayın.**
   Bootstrap açma ve kapama işlemlerini geçiş olaylarıyla yürütür. Bunları
   kaldırmak panellerin açık kalmasına neden olur.
3. **`transition: revert` çözüm değildir.** Tarayıcının varsayılanına döner ve
   yazarın tanımladığı geçişi yok sayar. Süreyi açıkça belirtin.
4. **Bootstrap'in animasyon uyguladığı bir özelliği sabitlemeyin.** Değer
   değişmeyince `transitionend` olayı oluşmaz, iç geçiş bayrağı açık kalır ve
   sonraki gösterme çağrıları erken döner.
5. **`.modal` öğesine arka plan vermeyin.** Bu öğe tüm pencereyi kaplayan
   kapsayıcıdır; görünen panel `.modal-content` öğesidir. Kapsayıcıyı boyamak
   pencerenin tamamını griye çevirip tıklamaları engeller; dosya yüklemelerinin
   çalışmıyor gibi görünmesinin nedeni buydu.
6. **`input[type="file"]` alanlarını ve kırpma araçlarını biçimlendirmeyin**
   (`all: revert`).
7. **Yan panelde etkin satırı mavi üzerinde beyaz yapmayın.** Yan panel simgeleri
   panel rengini devralmamalı; fareyle üzerine gelindiğinde imleç dışında hiçbir
   şey değişmemelidir.
8. **MDC işlevlerini yeniden oluşturmayın.** Sayfada zaten Kişi Sorgula ve Araç
   Sorgula alanları bulunur; uygulama kendi alanlarını eklemek yerine bunları
   kullanır.
9. **`html`, `body` veya `.wrapper` için `height` ya da `overflow` değerini
   zorlamayın.** Material Dashboard yerleşimini bu öğelere göre kurar. Bu
   değerleri zorlamak sayfayı ince bir şeride sıkıştırmıştı. Yinelenen kaydırma
   çubukları çalışma sırasında ölçüm yapılarak giderilir.
10. **Gömülü görünümün `display` değerini değiştirmeyin; `flex` dışında bir
    değer kullanmayın.** Electron, iç çerçevenin öğeyi doldurması için
    `webview` öğesine `display: flex` verir. Bunu `block` yapmak çerçeveyi doğal
    150 piksel yüksekliğinde bırakıp sayfayı pencerenin üstünde kısa bir şerit ve
    ayrı kaydırma çubuğu olarak gösterir. Genişlik doğru dolduğu için sorun ilk
    bakışta sayfadan kaynaklanıyor gibi görünmüştü. Ek güvence olarak
    `renderer.js` açık piksel boyutları da atar.
11. **Görsel boyutu sınırını kaldırmayın.** Sitenin görsellerindeki `max-height`
    sınırını kaldırmak eyalet mührünün doğal boyutta çizilmesine ve belgenin
    birkaç ekran boyu uzamasına neden oldu.
12. **Yalnızca MDC ana makinesine tema uygulayın.** Kimlik doğrulama sayfaları
    özgün stilleriyle gösterilmelidir.
13. **JavaScript şablon dizgesi içindeki yorumlarda ters tırnak kullanmayın.**
    Dizgeyi erken kapatıp dosyayı bozar. Artık yorum satırı kullanılmadığı için
    bu kuralın pratikte önemi kalmadı.
14. **İşaretleme yapısı bilinmiyorsa sınıfa değil içeriğe göre hedefleyin.**
    ARANIYOR bandı, Ceza Puanı göstergesi, Yaş alanı ve Günün Mesajı renk
    seçicileri üç tur boyunca `:has()` seçicileriyle tahmin edildi ve her defasında
    yanlış eşleşti. Artık kendi metinlerinden bulunuyor, yalnızca başka içerik
    barındırmayan üst kapsayıcılara çıkılıyor ve yapılan her değişiklik öğeye
    kaydediliyor; böylece Özgün MDC teması değişiklikleri geri alabiliyor.
15. **Tek başına `node --check` yeterli değildir.** Yalnızca çalışma zamanı testi,
    yüklenirken hata veren renderer'ı yakalar. `npm run smoke` çalıştırın.
16. **Kontrast çalışma sırasında korunur.** Sitenin satır içi renkleri,
    yeniden boyanmış arka plan üzerinde okunamaz olabilir.
17. **İletişim penceresi alanlarına sabit yükseklik, düğmelere ise yalnızca
    minimum yükseklik verin.** Alanlar sabit yükseklikte düzgün görünür. Düğmeleri
    sabit yüksekliğe zorlamak açılır menü oklarını kutunun dışına itmiş ve
    tıklamaları engellemişti.
18. **Bildirim kapsayıcısının konumunu ayarlamayın.** Konumu kütüphane belirler.
    Üzerine yazıldığında bildirimler sayfa akışına düşüyor, ekranın yarısında
    görünüyor, bazen görünüm dışına kayıyor ve süreleri doluyordu.
19. **Tek bir ölçüme bakarak dikey kaydırma çubuğunu gizlemeyin.** Sonradan
    eklenen ücretler gibi içerikler kesilir ve erişilemez olur. Yalnızca içerik
    gerçekten sığıyorsa yatay kaydırma çubukları kaldırılır.
20. **`.dropdown-menu` için `overflow: visible` kullanmayın.** Uzun seçenek
    listelerinin kaydırılmasını engeller. Bunun yerine düğme grubunun taşmasına
    izin verin.
21. **İletişim penceresi veya açılır menü içindeki kaydırmayı değiştirmeyin.**
    Site betikleri bu öğeleri açılırken boyutlandırır ve kaydırır. Üzerine yazılan
    her kural ek kaydırma çubuklarına veya erişilemeyen listelere yol açtı. Artık
    bu öğelerin kendi kaydırmaları korunuyor, yalnızca renkleri değiştiriliyor.
22. **Ölçüm sırasında bir özelliği tekrar tekrar açıp kapatmayın.** Kaydırma
    çubuğunu gizlemek, gizleme kararını veren ölçümü değiştirir; sonraki tur
    kararı tersine çevirerek titreşmeye ve kaydırma konumunun kaybolmasına yol
    açar. Her öğe için karar sayfa yüklemesinde bir kez verilir.
23. **Kaydırma çubuğunu dar tutun ve kapladığı alanı ayırın.** Tam genişlik için
    tasarlanan bir yerleşimin üzerine geniş kaydırma çubuğu çizilirse yanındaki
    içeriği kapatır.
24. **Sesleri tür başına sınırlandırın ve çalmakta olan sesi yeniden başlatmayın.**
    Aksi halde ücret ekleme gibi bir düğmeye art arda basıldığında aynı ses
    üst üste çalar.

21. `.dropdown-menu`, `div.inner` veya `.bootstrap-select` üzerinde `max-height`
    ya da `overflow` değerini zorlamayın. bootstrap-select açılırken seçenek
    listesini kendisi boyutlandırıp kaydırır; her müdahale kaydırılamayan, kesik
    bir liste oluşturur.
22. Bootstrap iletişim penceresinin içine kaydırma alanı eklemeyin. Pencere zaten
    kayar ve site kendi kaydırma alanını ekler; üçüncü bir kaydırma alanı ortaya
    çıkar.
23. İletişim penceresi kapsayıcılarında `overflow: visible` zorlamayın. Zararsız
    görünse de doğal olarak kaydırılan kapsayıcının satırları dışarı taşar ve
    alttaki blok tarafından örtülür.
24. İsteğe bağlı arayüz öğelerini eşleştirirken öğe kimlikleri yerine içeriği
    kullanmayı tercih edin. Alan etiketleri sayfa değişikliklerinde kalır,
    kimlikler kalmayabilir.
25. MDC'nin bazı bölümlerine hiç dokunulmamalıdır. Tutuklama Raporu Ekle
    (Add Arrest Report) ve Ücretler (Charges),
    satırlarını Bootstrap ızgarası ve mutlak konumlandırmayla yerleştirir; içindeki
    düğme görünümünü veya satır hizasını değiştirmek ücret satırlarını bozar.
    Yeniden yerleşim uygulamayın, yalnızca renklerini değiştirin.

---

## Klavye kısayolları ve yeniden atama

Yardım > Klavye Kısayolları (F1) tüm kısayolları tek tabloda listeler. Bir
satırdaki **Değiştir** düğmesine basıp istediğiniz tuş birleşimine basın; Escape
kaydı iptal eder. Birleşim başka bir eylemde kullanılıyorsa o eylemden alınır ve
pencere bunu bildirir. **Varsayılanları geri yükle** tüm özel atamaları temizler.

Yeni atamalar bu bilgisayarda saklanır ve gömülü MDC sayfalarına da iletilir.
Böylece sayfa odaktayken basılan bir tuş, uygulama arayüzü odaktayken olduğu gibi
çalışır. Sayfa içinde yalnızca değiştiricisiz işlev tuşları ve tek harfli Ctrl
birleşimleri kullanılabilir; daha karmaşık birleşimler yalnızca istemcide çalışır.
Escape yeniden atanamaz: önce arama çubuğunu, sonra iletişim penceresini kapatır;
ardından yüklenen sayfayı durdurur.

Ctrl+N ve Ctrl+L küçük **İsim Sorgusu** ve **Plaka Sorgusu** pencerelerini açar.
Bilgiyi yazıp Enter'a basınca sorgu çalıştırılır ve geçmişe kaydedilir. Önceden bu
kısayollar yalnızca araç çubuğu alanlarına odaklanıyordu; sorgu alanları gizliyken
bu işlem sonuç vermiyordu.

## Güncellemeler

Yardım > Hakkında penceresindeki **Güncellemeleri Denetle** düğmesi, projenin
herkese açık sürüm listesini okur ve en yeni etiketi çalışan sürümle karşılaştırır.
Daha yeni bir sürüm varsa **Şimdi Güncelle** düğmesi görünür. Bu düğme kurulum
paketini indirip Windows'a açtırır ve dosyaların değiştirilmesi için istemciyi
kapatır. Güncellemeyi elle yapmak isterseniz **Sürüm Sayfasını Aç** düğmesini de
kullanabilirsiniz.

İstemci açılırken denetim yapılması Araçlar > Ayarlar > Pencere bölümünden
etkinleştirilebilir; varsayılan olarak kapalıdır. Güncelle düğmesine basmadan
hiçbir şey indirilmez veya kurulmaz ve hakkınızda bilgi gönderilmez; denetim,
herkese açık sürüm listesinin okunmasından ibarettir.

Otomatik denetimin ve Güncelle düğmesinin çalışması için kurulum dosyasının proje
sayfasında bir GitHub Release varlığı olarak yayımlanması gerekir. Sürüm etiketi
de sürüm numarasıyla eşleşmelidir (örneğin `v1.0.0`).

## Yeni sürüm yayımlama

Sürüm numarasını elle değiştirmenize gerek yoktur. GitHub'da **Releases > Draft a new
release** ile `v1.2.3` biçiminde yeni bir etiket oluşturup yayımlayın. İş akışı
(`.github/workflows/main.yml`) etiketten sürümü alır, `package.json` ve Inno Setup
betiğine yazar, testleri çalıştırır, kurulum paketini derler ve exe dosyasını bu
sürüme yükler. Sürüm notları `CHANGELOG.md` içinde aynı numaralı başlıktan alınır
(örneğin `## 1.2.3`). Bu başlık yoksa kısa bir varsayılan metin kullanılır.

Belirli bir etiket için yeniden derlemek isterseniz Actions sekmesinde "Build Windows
installer" iş akışını elle çalıştırıp etiketi yazın.

## Uygulama notları

Kaynak dosyalarda satır içi açıklama yoktur. Önceden kod içinde açıklanan
davranışlar burada kayıtlıdır.

**Tema başlangıcı.** Her sayfa etkin temasını kendi yerel depolama alanında tutar
ve site çizilmeden önce bu temayı uygular. Yükleyici tüm tema adlarını kabul
etmelidir. Yalnızca `light`, `dark` ve `off` kabul edildiği dönemde Aero veya LSPD
sayfaları önce Klasik Açık temayla açılıyor, bir saniye sonra düzeliyordu; eski
görselin kısa süre parlamasının nedeni buydu. Cam katmanı da aynı ilk geçişte
uygulanır.

**Açılır pencereleri sürükleme.** İletişim penceresi CSS dönüşümüyle taşınır ve
normal yerleşim konumundan ayrılmaz; böylece Bootstrap'in kapatma mantığı
çalışmaya devam eder. Ofset, sürüklemeler arasında öğede tutulur ve pencere
gösterildiğinde ya da gizlendiğinde temizlenir. Böylece pencere her açılışta
ortalanmış ve görünür olur. Açılır pencerenin arkasındaki MDC'ye tıklamayı
sağlayan davranış yalnızca pencere gerçekten sürüklendikten sonra etkinleşir;
öncesinde pencereler sitenin tasarladığı gibi davranır.

**Paneller.** Kartlar renk paletinden düz ve açık bir yüzey, ince bir kenarlık,
6 piksel çerçeve ve gölge alır; sayfa arka planı hafif renklidir. Kart başlıkları
saydamdır, yalnızca metinleri görünür. Daraltma düğmeleri kendi başlıklarında,
sabit boyutla konumlandırılır. Kartın mutlak konumlandırılmış her alt öğesini
sabitlemek, başıboş karelerin panel dışına taşmasına neden olmuştu.

**Görseller.** Resimler panellerinin genişliğiyle sınırlandırılır. Yükseklik,
yalnızca kendi boyutunu belirtmeyen görsellere uygulanır; bunu tüm görsellere
zorlamak departman armalarını doğal boyutlarına indiriyordu. Arama emri mühürleri
için yükseklik ayrıca belirtilir.

**Discord durumu.** Zengin Durum (Rich Presence), üçüncü taraf bağımlılık olmadan
doğrudan Discord'un yerel soketi üzerinden gönderilir. Varsayılan olarak kapalıdır ve
Discord'un çalışmaması olağan durum olduğundan hatalar sessizce geçilir.
Discord'da görünen ilk satır (örneğin "Mobile Data Computer") koddan değil, Discord
Developer Portal'daki uygulamanın adından gelir. Yeni bir uygulama oluşturup adını
"Mobile Data Computer" yapın, **Application ID** değerini `main.js` içindeki
`DISCORD_APP_ID` sabitine yazın ve uygulamanın Rich Presence > Art Assets bölümüne
simgeyi `app_icon` adıyla yükleyin. İkinci satır yapılan işlemi, üçüncü satır karakter
adını gösterir; ikisi de `renderer/renderer.js` içindeki `pushPresence` işlevinden gelir.

**Amir özellikleri.** Amirlerin ve üst rütbeli memurların erişebildiği bazı
görünümler yanlış çalışabilir; bu sayfaların kaynak koduna erişim yoktu. İstemci,
web MDC'nin sayfa kaynak kodu incelenerek geliştirildi.
