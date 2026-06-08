import { motion } from "motion/react";
import { Compass, ShoppingBag, Map, Award, Clock, ArrowRight, Star } from "lucide-react";

interface LandingPageProps {
  onNavigateToMap: () => void;
  shopCount: number;
}

export default function LandingPage({ onNavigateToMap, shopCount }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0907] text-stone-200 font-sans selection:bg-amber-800/40 relative overflow-hidden">
      
      {/* Decorative Ornaments & Shadows */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-amber-950/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -left-48 top-1/4 w-96 h-96 rounded-full bg-amber-900/5 blur-[100px] pointer-events-none" />
      <div className="absolute -right-48 bottom-1/4 w-96 h-96 rounded-full bg-stone-900/20 blur-[100px] pointer-events-none" />

      {/* Elegant Top Navigation Header */}
      <header className="border-b border-amber-900/20 bg-[#0d0c0a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-7 h-7 text-amber-500 animate-spin-slow" />
            <span className="font-cinzel tracking-widest text-lg font-bold text-amber-500">
              İSTANBUL VİNTAGE
            </span>
          </div>
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-2 group border border-amber-600/30 px-4 py-2 rounded-lg bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-500 transition-all text-xs font-semibold tracking-wider text-amber-400 group uppercase"
          >
            <span>Haritayı Aç</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Intro Text Column */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-amber-950/35 border border-amber-800/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider text-amber-400 uppercase"
          >
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            İstanbul Zaman Yolculuğu Rehberi
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif text-stone-100 leading-tight tracking-tight"
          >
            İstanbul'un Saklı <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 font-bold italic font-serif">
              Vintage & Antika
            </span> <br />
            Hazinelerini Keşfedin
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-stone-400 text-base sm:text-lg leading-relaxed max-w-xl"
          >
            Beyoğlu'nun nostaljik pasajlarından Kadıköy'ün dar sokaklarına kadar uzanan, her biri kendi hikayesine sahip {shopCount || 50} seçkin vintage giyim ve antika obje dükkanını interaktif haritamızla keşfe çıkın.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <button
              onClick={onNavigateToMap}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 hover:from-amber-500 hover:to-amber-600 font-bold font-serif tracking-wide transition-all shadow-[0_4px_20px_rgba(217,119,6,0.3)] hover:shadow-[0_4px_25px_rgba(217,119,6,0.5)] transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              <Map className="w-5 h-5 stroke-[2.5]" />
              Zaman Yolculuğuna Başla
            </button>
            <a
              href="#categories"
              className="px-8 py-4 rounded-xl border border-amber-900/30 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-700 transition-all font-semibold text-amber-500 text-center flex items-center justify-center"
            >
              Zaman Tüneli Kategorileri
            </a>
          </motion.div>

          {/* Core Stat Widgets */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-3 gap-6 pt-10 border-t border-amber-900/20 max-w-xl"
          >
            <div>
              <p className="text-3xl md:text-4xl font-serif text-amber-500 font-medium">50+</p>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">Özel Dükkan</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-serif text-amber-500 font-medium">10+</p>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">Tarihi Semt</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-serif text-amber-500 font-medium">1930s</p>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">Retro Seçkisi</p>
            </div>
          </motion.div>
        </div>

        {/* Right Graphic/Collage Column */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="absolute inset-0 bg-amber-900/10 rounded-3xl blur-3xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative border-2 border-amber-900/40 p-5 rounded-3xl bg-[#0e0d0b]"
          >
            {/* Vintage style mockup */}
            <div className="relative aspect-[4/5] w-[280px] sm:w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-amber-700/30 group">
              <img
                src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
                alt="Vintage Shop Interior"
                className="w-full h-full object-cover grayscale opacity-90 brightness-75 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b] via-[#0e0d0b]/20 to-transparent" />
              {/* Overlapping floating badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#0a0907]/90 border border-amber-600/30 backdrop-blur-md">
                <span className="font-cinzel text-xs text-amber-400 tracking-widest block uppercase mb-1">
                  Sembol Mekan
                </span>
                <span className="font-serif text-lg text-stone-100 font-bold block mb-1">
                  Pied De Poule
                </span>
                <span className="text-xs text-stone-400 block">
                  Çukurcuma, Beyoğlu (Kuruluş: 2005)
                </span>
              </div>
            </div>

            {/* Retro Stamp or Overlay Ornament */}
            <div className="absolute -top-6 -right-6 lg:-right-8 bg-amber-950 border border-amber-600/40 text-amber-500 w-24 h-24 rounded-full flex flex-col items-center justify-center p-2 text-center rotate-12 shadow-lg select-none">
              <span className="font-cinzel font-bold text-[9px] uppercase tracking-wider">MÜHÜRLÜ</span>
              <span className="font-serif italic font-bold text-xs">Zamanın</span>
              <span className="font-cinzel text-[8px] uppercase tracking-wider mt-0.5">Ruhu</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories / Vintage Info Section */}
      <section id="categories" className="py-24 border-t border-amber-900/15 bg-[#080706]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs text-amber-500 uppercase tracking-widest font-bold font-cinzel">Zaman Yolculuğu Durakları</h2>
            <p className="text-3xl font-serif text-stone-100">Küratörlü Vintage Kategorileri</p>
            <p className="text-sm text-stone-400">İstanbul'un her semti kendi ruhunu dükkanlarında yaşatıyor. Aradığınız eşsiz parçaya göre bir derman bulalım.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="border border-amber-950/80 bg-[#0d0c0a] p-8 rounded-2xl relative group overflow-hidden hover:border-amber-700/30 transition-all shadow-md">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-amber-900/5 rounded-full group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-600/20 flex items-center justify-center mb-6 text-amber-500">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif text-stone-100 mb-3">Retro Giyim ve Aksesuar</h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-4">
                1950'ler, 60'lar ve 70'lerden kalma lüks kadife elbiseler, ipek gömlekler, deri ceketler, eski şapkalar ve her kombini taçlandıracak altın dore aksesuarlar.
              </p>
              <div className="text-xs font-bold font-serif text-amber-400 uppercase tracking-widest block">
                Madam Mare • Sentetik Sezar
              </div>
            </div>

            {/* Card 2 */}
            <div className="border border-amber-950/80 bg-[#0d0c0a] p-8 rounded-2xl relative group overflow-hidden hover:border-amber-700/30 transition-all shadow-md">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-amber-900/5 rounded-full group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-600/20 flex items-center justify-center mb-6 text-amber-500">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif text-stone-100 mb-3">Antika Obje ve Dekor</h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-4">
                Tarih kokan mekanlar için pirinç şamdanlar, tavan lambaları, gramofonlar, analog kameralar, nostaljik bavullar ve evinizi müze gibi süsleyecek estetik rölyefler.
              </p>
              <div className="text-xs font-bold font-serif text-amber-400 uppercase tracking-widest block">
                Bin Bavul • Çukurcuma Antikacısı
              </div>
            </div>

            {/* Card 3 */}
            <div className="border border-amber-950/80 bg-[#0d0c0a] p-8 rounded-2xl relative group overflow-hidden hover:border-amber-700/30 transition-all shadow-md">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-amber-900/5 rounded-full group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-600/20 flex items-center justify-center mb-6 text-amber-500">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif text-stone-100 mb-3">Eskiz & Nadir Baskı Koleksiyon</h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-4">
                Sahafların raflarında gizlenen sararmış baskı kitaplar, asırlık mektuplar, antika haritalar, eski plaklar ve sinemanın ilk dönemlerinden orijinal film afişleri.
              </p>
              <div className="text-xs font-bold font-serif text-amber-400 uppercase tracking-widest block">
                Plakhane • Karadeniz Sahaf
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlight Semt Section */}
      <section className="py-20 bg-[#0a0907] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-b from-[#14120e] to-[#0c0a08] border border-amber-900/20 p-8 sm:p-12 md:p-16 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-xs text-amber-500 uppercase tracking-widest font-bold">
                <Clock className="w-4 h-4" />
                Dükkan Seçimleri & Tarihsel Ruh
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif text-stone-100">
                Pera'dan Çukurcuma'ya, Moda'dan Kadıköy'e
              </h2>
              <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
                Her bir Semt dükkanların karakterini belirler: Cihangir fildişi kule aydınları, Çukurcuma asırlık antika simsarları, Kadıköy ise gürültülü punk-rock esintili 80'ler dolapları barındırır. Bu interaktif rehber size dükkanlar arasında gezinirken semtin tarihsel kokusunu da fısıldayacaktır.
              </p>
              <div className="pt-4">
                <button
                  onClick={onNavigateToMap}
                  className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-bold tracking-wide text-sm group"
                >
                  Şimdi Tümünü Haritada İncele
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </div>
            <div className="md:col-span-5 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 border border-amber-500/20 rounded-2xl transform rotate-3" />
                <img
                  src="https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?auto=format&fit=crop&w=600&q=80"
                  alt="Vintage accessories"
                  className="relative rounded-2xl w-[260px] aspect-[4/3] object-cover grayscale opacity-80 border border-amber-900/30 text-stone-400"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-900/10 py-12 bg-[#050403] text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-amber-600/60 font-cinzel tracking-widest font-bold">
            İSTANBUL VİNTAGE
          </div>
          <div>
            © {new Date().getFullYear()} İstanbul Vintage Rehberi. Tüm hakları saklıdır.
          </div>
          <div className="flex gap-4">
            <span className="text-amber-600/40 font-mono">OSM & Leaflet.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
