import Link from "next/link";

const termsSections = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
        ),
        title: "مقدمة عامة",
        color: "amber",
        content: [
            "مرحباً بكم في منصة \"زاد الخير\". باستخدامك لهذه المنصة سواء كنت متبرعاً أو متطوعاً، فإنك توافق على الالتزام بالشروط والأحكام التالية.",
            "تهدف هذه الشروط لضمان سلامة وجودة العملية الخيرية وتنظيم العلاقة بين جميع الأطراف.",
            "هذه المبادرة هي عمل تطوعي خيري غير هادف للربح، وجميع المشاركين فيها يساهمون بدافع المسؤولية المجتمعية وحب الخير."
        ]
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        title: "شروط التبرع بالطعام",
        color: "red",
        items: [
            "يجب أن يكون الطعام طازجاً وصالحاً للاستهلاك الآدمي وصحياً تماماً",
            "يجب تغليف الطعام بشكل نظيف وآمن لضمان عدم تعرضه للتلوث أثناء النقل",
            "يفضل تحديد مكونات الوجبة وتاريخ إعدادها إذا لزم الأمر",
            "المتبرع يتحمل المسؤولية الأخلاقية عن جودة الطعام المقدم"
        ]
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
        title: "مجال التوصيل والتطوع",
        color: "teal",
        items: [
            "التطوع للتوصيل هو مسؤولية وأمانة، يلتزم المتطوع بالحفاظ على الطعام وتوصيله في الوقت المحدد",
            "التعامل مع المستفيدين يجب أن يكون بقمة الاحترام وحفظ الكرامة والخصوصية",
            "جميع البيانات الخاصة بالمتبرعين أو المستفيدين هي سرية ولا يجوز مشاركتها"
        ]
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: "الخصوصية وحماية البيانات",
        color: "blue",
        items: [
            "نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية",
            "لن يتم مشاركة بياناتك مع أي جهة خارجية دون موافقتك",
            "تُستخدم بياناتك فقط لغرض تنظيم وتسهيل عملية التبرع والتوصيل",
            "يمكنك طلب حذف بياناتك في أي وقت عبر التواصل معنا"
        ]
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        title: "إخلاء المسؤولية",
        color: "orange",
        content: [
            "تعمل منصة زاد الخير كوسيط تقني بين المتبرعين والمتطوعين والمحتاجين.",
            "نحن نبذل قصارى جهدنا للتحقق وضمان سير العملية بسلاسة، ولكننا لا نتحمل المسؤولية القانونية المباشرة عن جودة الطعام أو تصرفات الأفراد الشخصية خارج إطار المبادرة المنظم."
        ]
    }
];

const colorClasses: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", iconBg: "bg-amber-500/20" },
    red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", iconBg: "bg-red-500/20" },
    teal: { bg: "bg-teal-500/10", border: "border-teal-500/20", text: "text-teal-400", iconBg: "bg-teal-500/20" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", iconBg: "bg-blue-500/20" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", iconBg: "bg-orange-500/20" },
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-950 -mt-16 md:-mt-20 pt-16 md:pt-20 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 py-12 relative">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    العودة للرئيسية
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-semibold mb-4 border border-amber-500/20">
                        القانونية
                    </span>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        الشروط <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">والأحكام</span>
                    </h1>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        سياسة الاستخدام والمشاركة في مبادرة زاد الخير
                    </p>
                </div>

                {/* Terms Sections */}
                <div className="max-w-3xl mx-auto space-y-6">
                    {termsSections.map((section, index) => {
                        const colors = colorClasses[section.color];
                        return (
                            <div
                                key={index}
                                className={`rounded-2xl ${colors.bg} border ${colors.border} overflow-hidden`}
                            >
                                {/* Section Header */}
                                <div className="p-6 flex items-center gap-4 border-b border-white/5">
                                    <div className={`w-12 h-12 rounded-xl ${colors.iconBg} ${colors.text} flex items-center justify-center`}>
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-bold text-white">{section.title}</h2>
                                </div>

                                {/* Section Content */}
                                <div className="p-6 pt-4">
                                    {section.content ? (
                                        <div className="space-y-4">
                                            {section.content.map((paragraph, pIndex) => (
                                                <p key={pIndex} className="text-white/70 leading-relaxed">
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>
                                    ) : section.items ? (
                                        <ul className="space-y-3">
                                            {section.items.map((item, iIndex) => (
                                                <li key={iIndex} className="flex items-start gap-3">
                                                    <span className={`w-2 h-2 mt-2 rounded-full ${colors.text.replace('text-', 'bg-')} flex-shrink-0`} />
                                                    <span className="text-white/70">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Note */}
                <div className="max-w-3xl mx-auto mt-12">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <p className="text-white/60 text-sm mb-2">
                            باستخدامك للمنصة، فإنك توافق على هذه الشروط والأحكام
                        </p>
                        <p className="text-white/40 text-xs">
                            آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Contact Prompt */}
                <div className="mt-8 text-center">
                    <p className="text-white/40 text-sm">
                        لديك استفسار؟{" "}
                        <Link href="/contact" className="text-amber-400 hover:text-amber-300 transition-colors">
                            تواصل معنا
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
