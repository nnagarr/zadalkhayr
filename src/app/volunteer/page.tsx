import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { VolunteerRegistrationForm } from "./volunteer-form";
import Link from "next/link";

export default async function VolunteerPage() {
    const session = await auth();

    // If user is already a volunteer, pending, or admin - redirect appropriately
    if (session?.user?.id) {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, phone: true } // Fetch phone to check if blocked
        });

        // Check if user is blocked
        if (user?.phone) {
            const blocked = await db.blockedPhone.findUnique({
                where: { phone: user.phone.replace(/\s/g, "") }
            });

            if (blocked) {
                return (
                    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                        <div className="max-w-md w-full bg-red-950/30 border border-red-500/20 rounded-3xl p-8 text-center backdrop-blur-sm">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-red-400 mb-2">حساب محظور</h1>
                            <p className="text-white/60 mb-6">
                                تم حظر حسابك من الوصول لصفحة التطوع. يرجى التواصل مع الإدارة للمراجعة.
                            </p>
                            <Link href="/" className="inline-block px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10">
                                العودة للرئيسية
                            </Link>
                        </div>
                    </div>
                )
            }
        }

        // If user was deleted from DB but JWT is still valid, redirect to login
        if (!user) {
            redirect("/login");
        }

        // Determine redirect destination based on role
        let redirectTo: string | null = null;

        if (user.role === "ADMIN" || user.role === "VOLUNTEER") {
            redirectTo = "/volunteer/dashboard";
        } else if (user.role === "PENDING_VOLUNTEER") {
            redirectTo = "/volunteer/pending";
        }

        if (redirectTo) {
            redirect(redirectTo);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 -mt-16 md:-mt-20 pt-16 md:pt-20 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 py-12 relative">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    العودة للرئيسية
                </Link>

                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 text-teal-400 mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        انضم لفريق <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-300 to-teal-500">التطوع</span>
                    </h1>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        ساهم معنا في توصيل الطعام للمحتاجين وكن جزءاً من هذا العمل الخيري المبارك
                    </p>
                </div>

                {/* Benefits Section - Compact for mobile */}
                <div className="max-w-4xl mx-auto mb-6 md:mb-12">
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                        <div className="p-2 md:p-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-center">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-1 md:mb-3">
                                <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-white text-xs md:text-base mb-0 md:mb-1">عمل جماعي</h3>
                            <p className="text-[10px] md:text-sm text-white/60 hidden md:block">انضم لفريق متعاون</p>
                        </div>
                        <div className="p-2 md:p-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-center">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-1 md:mb-3">
                                <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-white text-xs md:text-base mb-0 md:mb-1">بركة الوقت</h3>
                            <p className="text-[10px] md:text-sm text-white/60 hidden md:block">استثمر وقتك في الخير</p>
                        </div>
                        <div className="p-2 md:p-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-center">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-1 md:mb-3">
                                <svg className="w-4 h-4 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-white text-xs md:text-base mb-0 md:mb-1">أجر عظيم</h3>
                            <p className="text-[10px] md:text-sm text-white/60 hidden md:block">ثواب إفطار الصائمين</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-2xl mx-auto">
                    {!session?.user ? (
                        // Not logged in - show login prompt
                        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">سجّل دخولك أولاً</h2>
                            <p className="text-white/60 mb-6">
                                للتسجيل كمتطوع، يجب أن يكون لديك حساب على المنصة
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link href="/login">
                                    <button className="w-full sm:w-auto px-8 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all">
                                        تسجيل الدخول
                                    </button>
                                </Link>
                                <Link href="/signup">
                                    <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-900 font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25">
                                        إنشاء حساب جديد
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        // Logged in - show registration form
                        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 md:p-8">
                            {/* Notice at the beginning */}
                            <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-teal-400 mb-1">ملاحظة مهمة</p>
                                    <p className="text-sm text-white/60">
                                        سيتم مراجعة طلبك.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">نموذج التسجيل</h2>
                                <p className="text-white/60">أكمل البيانات التالية للانضمام لفريق التطوع</p>
                            </div>
                            <VolunteerRegistrationForm />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
