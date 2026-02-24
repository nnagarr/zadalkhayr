import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SuccessPageProps {
    searchParams: Promise<{ method?: string; tomorrow?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const params = await searchParams;
    // const isForTomorrow = params.tomorrow === "true"; // Already declared below? No, I will fix the duplicate params first.

    // Correcting the duplicate params issue from previous edit attempt
    // And fixing the header text

    // START FIX
    const isForTomorrow = params.tomorrow === "true";

    return (
        <div className="min-h-screen bg-slate-950 -mt-16 md:-mt-20 pt-16 md:pt-20 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
                {/* Confetti-like dots */}
                <div className="absolute top-20 left-1/4 w-2 h-2 bg-amber-400 rounded-full animate-float opacity-60" />
                <div className="absolute top-32 right-1/3 w-3 h-3 bg-green-400 rounded-full animate-float opacity-40" style={{ animationDelay: "0.5s" }} />
                <div className="absolute top-48 left-1/3 w-2 h-2 bg-amber-300 rounded-full animate-float opacity-50" style={{ animationDelay: "1s" }} />
                <div className="absolute top-40 right-1/4 w-2 h-2 bg-teal-400 rounded-full animate-float opacity-40" style={{ animationDelay: "1.5s" }} />
            </div>

            <div className="container mx-auto max-w-xl px-4 py-12 relative">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse-soft">
                            <div className="w-16 h-16 rounded-full bg-green-500/30 flex items-center justify-center">
                                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        {/* Sparkles */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 text-amber-400">
                            <svg fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-1 -left-3 w-4 h-4 text-amber-300">
                            <svg fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        تم استلام تبرعك <span className="text-transparent bg-clip-text bg-gradient-to-l from-green-300 to-green-500">بنجاح!</span>
                    </h1>
                    <p className="text-white/60 text-lg">
                        {isForTomorrow
                            ? "سيتواصل معك أحد متطوعينا غداً"
                            : "سيتواصل معك أحد متطوعينا قريباً"}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">

                    {/* Tomorrow Notice */}
                    {isForTomorrow && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-amber-400">تبرعك مسجل لإفطار الغد</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* What's Next Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                            الخطوات التالية
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    1
                                </div>
                                <div>
                                    <p className="font-medium text-white">جهّز الطعام للاستلام</p>
                                    {isForTomorrow && (
                                        <p className="text-sm text-amber-400">غداً إن شاء الله</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    2
                                </div>
                                <div>
                                    <p className="font-medium text-white">انتظر اتصالاً من المتطوع</p>
                                    <p className="text-sm text-white/60">سيتصل بك قبل الحضور</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                    3
                                </div>
                                <div>
                                    <p className="font-medium text-white">سلّم الطعام للمتطوع</p>
                                    <p className="text-sm text-white/60">عند بابك مباشرة</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hadith Quote */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-green-500/10 border border-teal-500/20 text-center">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-teal-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <p className="text-xl font-bold text-teal-300 leading-relaxed" style={{ fontFamily: "var(--font-cairo), serif" }}>
                            «مَن فَطَّرَ صائِمًا كانَ لَهُ مِثلُ أجْرِهِ»
                        </p>
                        <p className="text-sm text-white/50 mt-2">
                            رواه الترمذي
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pt-2">
                        <Link href="/donate">
                            <Button className="w-full h-14 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 text-lg font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]">
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                تبرع آخر
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button
                                variant="outline"
                                className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                الرئيسية
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Thank You Note */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                        <span className="text-white/80 font-medium">جزاك الله خيراً على كرمك</span>
                    </div>
                </div>

                {/* Share Section */}
                <div className="mt-6 text-center">
                    <p className="text-white/40 text-sm mb-3">شارك المبادرة مع الآخرين</p>
                    <div className="flex justify-center gap-3">
                        <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
