import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ProfileClient } from "./profile-client"
import Link from "next/link"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
    })

    if (!user) {
        redirect("/login")
    }

    // Check blocked status
    const blocked = await db.blockedPhone.findUnique({
        where: { phone: user.phone.replace(/\s/g, "") }
    })

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
                        تم حظر حسابك من الوصول للمنصة. يرجى التواصل مع الإدارة.
                    </p>
                    <Link href="/" className="inline-block px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10">
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
        )
    }

    // Fetch user donations using phone number
    const donations = await db.donation.findMany({
        where: {
            donorPhone: user.phone.replace(/\s/g, "")
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit history for performance
    })

    return (
        <div className="min-h-screen bg-slate-950 -mt-16 md:-mt-20 pt-16 md:pt-20 relative overflow-hidden pb-12">
            {/* Backgrounds */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-amber-500/5 to-transparent" />
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 py-8 relative">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    العودة للرئيسية
                </Link>

                <ProfileClient
                    user={user}
                    donations={donations}
                    donationsCount={donations.length}
                />
            </div>
        </div>
    )
}
