"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ============================================
// DATA & CONSTANTS
// ============================================

const backgrounds = [
  "/bgs/bg1.png",
  "/bgs/bg2.jpg",
  "/bgs/bg3.jpg",
  "/bgs/bg4.jpg",
];

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "إحياء الأجواء الرمضانية",
    description: "نسعى لجعل رمضان مميزاً للجميع من خلال نشر روح الكرم والمحبة"
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>
    ),
    title: "مساعدة المتعففين",
    description: "توصيل الطعام للمحتاجين بكل كرامة وسرية تامة"
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: "تعزيز روح التطوع",
    description: "بناء مجتمع متحاب يشارك الجميع فيه بالعطاء"
  }
];

const religiousContent = [
  {
    type: "quran",
    title: "من القرآن الكريم",
    content: "وَيُطْعِمُونَ الطَّعَامَ عَلَىٰ حُبِّهِ مِسْكِينًا وَيَتِيمًا وَأَسِيرًا ۝ إِنَّمَا نُطْعِمُكُمْ لِوَجْهِ اللَّهِ لَا نُرِيدُ مِنكُمْ جَزَاءً وَلَا شُكُورًا",
    source: "سورة الإنسان: ٨-٩",
    gradient: "from-emerald-500/20 to-teal-500/20"
  },
  {
    type: "hadith",
    title: "ثواب إفطار الصائم",
    content: "مَنْ فَطَّرَ صَائِمًا كَانَ لَهُ مِثْلُ أَجْرِهِ، غَيْرَ أَنَّهُ لا يَنْقُصُ مِنْ أَجْرِ الصَّائِمِ شَيْئًا",
    source: "رواه الترمذي - حديث حسن صحيح",
    gradient: "from-amber-500/20 to-orange-500/20"
  },
  {
    type: "hadith",
    title: "فضل الصدقة",
    content: "اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ",
    source: "متفق عليه",
    gradient: "from-rose-500/20 to-pink-500/20"
  }
];

const faqs = [
  {
    question: "كيف يتم توزيع الطعام؟",
    answer: "يقوم فريق التطوع بجمع الطعام من المتبرعين وتنظيمه، ثم توزيعه على الأسر المحتاجة في مدينة السادات بشكل يومي خلال شهر رمضان."
  },
  {
    question: "كيف يمكنني التبرع؟",
    answer: "بكل سهولة! اضغط على زر \"تبرع بالطعام\"، عبئ الاستمارة بالتفاصيل، سترى تعليمات تسليم الطعام."
  },
  {
    question: "ما هو نوع الطعام الذي تقبلونه؟",
    answer: "نقبل جميع أنواع الطعام الصالح للأكل، مطبوخاً كان أو مواداً جافة ومعلبات، بالإضافة إلى العصائر والتمور."
  },
  {
    question: "هل يمكنني التطوع معكم؟",
    answer: "طبعاً! نحن نبحث دائماً عن شركاء في الخير. سجل كمتطوع عبر زر \"تطوع للتوصيل\" وسنكون سعداء بانضمامك لمجتمعنا."
  }
];

// ============================================
// SUB-COMPONENTS
// ============================================

function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgrounds.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden -mt-16 md:-mt-20">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {backgrounds.map((bg, index) => (
          <div
            key={bg}
            className={`absolute inset-0 transition-all duration-[2000ms] ease-out ${index === currentIndex
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
              }`}
          >
            <Image
              src={bg}
              alt=""
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        {/* Animated Particles Effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary rounded-full animate-float" />
          <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-primary/70 rounded-full animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-primary/50 rounded-full animate-float" style={{ animationDelay: "2s" }} />
        </div>
      </div>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center pt-20 md:pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div
            className={`text-center transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/90 text-xs md:text-sm font-medium">رمضان كريم ١٤٤٧</span>
            </div>

            {/* Quranic Verses */}
            <div className="mb-4 md:mb-6 max-w-2xl mx-auto">
              <div className="relative px-4 py-3 md:px-5 md:py-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                {/* Decorative Corner Elements */}
                <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-400/50 rounded-tr-md" />
                <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-400/50 rounded-tl-md" />
                <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-400/50 rounded-br-md" />
                <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-400/50 rounded-bl-md" />

                <p className="text-white/95 text-sm md:text-base lg:text-lg leading-relaxed font-arabic mb-2" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                  ۞ وَسَارِعُوٓاْ إِلَىٰ مَغۡفِرَةٖ مِّن رَّبِّكُمۡ وَجَنَّةٍ عَرۡضُهَا ٱلسَّمَٰوَٰتُ وَٱلۡأَرۡضُ أُعِدَّتۡ لِلۡمُتَّقِينَ ﴿۱۳۳﴾
                </p>
                <p className="text-white/90 text-xs md:text-sm lg:text-base leading-relaxed font-arabic" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                  ٱلَّذِينَ يُنفِقُونَ فِي ٱلسَّرَّآءِ وَٱلضَّرَّآءِ وَٱلۡكَٰظِمِينَ ٱلۡغَيۡظَ وَٱلۡعَافِينَ عَنِ ٱلنَّاسِۗ وَٱللَّهُ يُحِبُّ ٱلۡمُحۡسِنِينَ ﴿۱۳٤﴾
                </p>
                <p className="mt-2 text-amber-400/80 text-xs">— سورة آل عمران</p>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="mb-3 md:mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="block mb-1 text-white/90 text-lg sm:text-xl md:text-2xl">مبادرة</span>
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-amber-400 to-amber-500">
                  زاد الخير
                </span>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-l from-amber-300 via-amber-400 to-amber-500 rounded-full opacity-50" />
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mb-2 max-w-xl mx-auto text-base text-white/80 sm:text-lg md:text-xl">
              مساهمتك هي إفطارهم
            </p>
            <p className="mb-6 md:mb-8 text-white/60 text-sm md:text-base">
              مبادرة خيرية رمضانية لجمع وتوزيع الطعام في مدينة السادات
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/donate" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto relative overflow-hidden group bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-bold shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    تبرع بالطعام
                  </span>
                </Button>
              </Link>
              <Link href="/volunteer" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/5 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/15 hover:border-white/50 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-bold transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    تطوع للتوصيل
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

function AboutSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden bg-slate-950">
      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-semibold mb-4 border border-amber-500/20">
            من نحن
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            مبادرة <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">زاد الخير</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            مجموعة شبابية تطوعية من مدينة السادات، جمعنا حب الخير والرغبة في إحياء الأجواء الرمضانية
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative transition-all duration-700 ${isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
                }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative h-full p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-2 hover:border-amber-500/30 hover:bg-white/10">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3">
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Gradient */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div
          className={`mt-16 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/5 to-teal-500/10 border border-white/10 transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mb-6">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed">
              نسعى ليكون رمضان هذا العام مختلفاً، بحيث{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500 font-bold">لا يبقى أي شخص دون طعام إفطار</span>
              ، من خلال جمع الطعام والمواد الغذائية وتوصيلها للمتعففين بكل حب وكرامة.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReligiousSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden bg-slate-900">
      {/* Decorative Islamic Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='1'%3E%3Cpath d='M40 0L0 40l40 40 40-40L40 0zm0 10l30 30-30 30-30-30 30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-semibold mb-4 border border-amber-500/20">
            الثواب والأجر
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            فضل <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">العطاء</span>
          </h2>
          <p className="text-lg text-white/60">
            من القرآن الكريم والسنة النبوية الشريفة
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {religiousContent.map((item, index) => (
            <div
              key={index}
              className={`group transition-all duration-700 ${isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-16"
                }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className={`relative h-full p-8 rounded-3xl bg-gradient-to-br ${item.gradient} backdrop-blur-sm border border-white/10 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:border-amber-500/30 overflow-hidden`}>
                {/* Decorative Corner */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/10 rounded-br-full -ml-8 -mt-8 transition-all group-hover:scale-150 group-hover:bg-amber-500/15" />

                {/* Type Badge */}
                <div className="absolute top-6 left-6 px-3 py-1 rounded-full bg-slate-950/50 backdrop-blur-sm text-xs font-medium text-white/70 border border-white/10">
                  {item.type === "quran" ? "آية" : "حديث"}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-amber-400 mb-4 mt-8">
                  {item.title}
                </h3>

                {/* Content */}
                <p className="text-lg leading-loose text-white/90 font-medium mb-6" style={{ fontFamily: "var(--font-cairo), serif" }}>
                  «{item.content}»
                </p>

                {/* Source */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-white/50">
                    {item.source}
                  </p>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-3xl bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq, index, isVisible }: { faq: typeof faqs[0]; index: number; isVisible: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`transition-all duration-500 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
        }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-right p-6 rounded-2xl transition-all duration-300 ${isOpen
          ? "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10"
          : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-amber-500/20 hover:shadow-md"
          } backdrop-blur-sm border`}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white flex-1 text-right">
            {faq.question}
          </h3>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-48 mt-4" : "max-h-0"}`}>
          <p className="text-white/60 leading-relaxed pr-2 border-r-2 border-amber-500/30">
            {faq.answer}
          </p>
        </div>
      </button>
    </div>
  );
}

function FAQSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="faq" ref={sectionRef} className="py-24 bg-slate-950">
      {/* Decorative Elements */}
      <div className="absolute right-0 top-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-semibold mb-4 border border-amber-500/20">
            الأسئلة الشائعة
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            كل ما تريد معرفته
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            أجوبة على أكثر الأسئلة شيوعاً حول المبادرة
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeedbackSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-slate-950">
      <div className="container mx-auto px-4">
        <div
          className={`max-w-2xl mx-auto transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          {/* Card */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-white mb-3">
              شاركنا رأيك
            </h3>
            <p className="text-white/60 mb-6 leading-relaxed">
              نرحب بملاحظاتكم واقتراحاتكم لتطوير المبادرة. سواء كانت عن النظام أو طريقة العمل أو الفكرة نفسها،
              تواصلوا معنا عبر:
            </p>

            {/* Contact Options */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* WhatsApp */}
              <a
                href="https://wa.me/201550207454"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 font-medium transition-all duration-300 hover:scale-[1.02]"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                واتساب
              </a>

              {/* Email */}
              <a
                href="mailto:zadalkhayr.org@gmail.com"
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 font-medium transition-all duration-300 hover:scale-[1.02]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span dir="ltr">zadalkhayr.org@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden bg-slate-900">
      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative">
        <div
          className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
            }`}
        >
          {/* Decorative Element */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 mb-8 animate-float">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            جاهز للمساهمة في <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">الخير</span>؟
          </h2>

          {/* Subheadline */}
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
            كل وجبة يمكن أن تكون إفطار شخص محتاج
            <br />
            <span className="text-amber-400 font-medium">ابدأ رحلة العطاء الآن</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/donate">
              <Button
                size="lg"
                className="relative overflow-hidden group bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 px-12 py-7 text-xl font-bold shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/50"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  ابدأ التبرع الآن
                </span>
                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>سري وآمن</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>بكل كرامة</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Animated Background */}
      <HeroSection />

      {/* About Section with Features */}
      <AboutSection />

      {/* Religious Content - Virtues of Giving */}
      <ReligiousSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <CTASection />

      {/* Feedback Section */}
      <FeedbackSection />
    </div>
  );
}
