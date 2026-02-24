import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function VolunteerPendingPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Check user role
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, name: true, phone: true }
    });

    // Check if user is blocked
    if (user?.phone) {
        const blocked = await db.blockedPhone.findUnique({
            where: { phone: user.phone.replace(/\s/g, "") }
        });

        if (blocked) {
            redirect("/volunteer");
        }
    }

    // If already approved, redirect to dashboard
    if (user?.role === "VOLUNTEER") {
        redirect("/volunteer/dashboard");
    }

    // If not a pending volunteer, redirect to registration
    if (user?.role !== "PENDING_VOLUNTEER") {
        redirect("/volunteer");
    }

    return (
        <div className="min-h-screen bg-slate-950 -mt-16 md:-mt-20 pt-16 md:pt-20 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 py-12 relative">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    العودة للرئيسية
                </Link>

                {/* Main Content */}
                <div className="max-w-xl mx-auto text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 mb-8">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        طلبك <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">قيد المراجعة</span>
                    </h1>

                    {/* Message */}
                    <p className="text-lg text-white/70 mb-8 leading-relaxed">
                        شكراً لك يا <span className="text-amber-400 font-medium">{user?.name}</span> على رغبتك في التطوع معنا!
                        <br />
                        طلبك قيد المراجعة من قبل الإدارة وسيتم إشعارك عند الموافقة.
                    </p>

                    {/* Status Card */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-amber-400 font-medium">في انتظار الموافقة</span>
                        </div>
                        <p className="text-sm text-white/60">
                            يرجى الانتظار، سيتم مراجعة طلبك في أقرب وقت ممكن
                        </p>
                    </div>

                    {/* Info Note */}
                    <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                        <div className="flex items-start gap-3 text-right">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-teal-400 mb-1">ملاحظة</p>
                                <p className="text-sm text-white/60">
                                    بمجرد الموافقة على طلبك، ستتمكن من الوصول للوحة تحكم المتطوعين واستلام المهام.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
