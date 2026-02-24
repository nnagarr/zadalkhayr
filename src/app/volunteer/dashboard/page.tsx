import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { VolunteerDashboardClient } from "./volunteer-dashboard"
import Link from "next/link"

export default async function VolunteerDashboardPage() {
    const session = await auth()

    // Must be logged in
    if (!session?.user?.id) {
        redirect("/volunteer")
    }

    // Check user role from database
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            assignedDonations: {
                orderBy: { scheduledDate: 'desc' },
                include: {
                    beneficiary: true
                }
            }
        }
    })

    if (!user) {
        redirect("/volunteer")
    }

    // Check if user is blocked
    const blocked = await db.blockedPhone.findUnique({
        where: { phone: user.phone.replace(/\s/g, "") }
    })

    if (blocked) {
        redirect("/volunteer")
    }

    // Must be a volunteer or admin
    if (user?.role !== "VOLUNTEER" && user?.role !== "ADMIN") {
        redirect("/volunteer")
    }

    // Fetch available donations:
    // PENDING orders (for pickup from donor) - exclude SELF_DELIVERY
    // Only show orders scheduled for TODAY (Egypt timezone)

    // Get today's date range in Egypt timezone
    const now = new Date()
    const egyptNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    const todayStart = new Date(egyptNow)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(egyptNow)
    todayEnd.setHours(23, 59, 59, 999)

    const pendingDonations = await db.donation.findMany({
        where: {
            status: "PENDING",
            volunteerId: null,  // Only show if no volunteer assigned
            deliveryMethod: {
                not: "SELF_DELIVERY"  // Exclude self-delivery for pickup phase
            },
            scheduledDate: {
                gte: todayStart,
                lte: todayEnd
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            beneficiary: true
        }
    })

    // Available donations are just pending ones now (no hub workflow)
    const sortedAvailableDonations = [...pendingDonations].sort((a, b) => {
        // Priority: Same zone first
        if (a.zone === user.zone && b.zone !== user.zone) return -1
        if (a.zone !== user.zone && b.zone === user.zone) return 1
        return 0
    })

    // Calculate stats
    const todayDonations = user.assignedDonations.filter(d => {
        const today = new Date()
        const donationDate = new Date(d.scheduledDate)
        return donationDate.toDateString() === today.toDateString()
    })

    const activeDonations = user.assignedDonations.filter(
        d => d.status !== "COMPLETED" && d.status !== "CANCELLED"
    )

    const completedDonations = user.assignedDonations.filter(
        d => d.status === "COMPLETED"
    )

    // Fetch active help requests
    const helpRequests = await db.helpRequest.findMany({
        where: {
            status: {
                in: ["PENDING", "ACCEPTED"]
            }
        },
        include: {
            requester: {
                select: { id: true, name: true, phone: true }
            },
            helper: {
                select: { id: true, name: true, phone: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Check if current user has a pending help request
    const myHelpRequest = helpRequests.find(r => r.requesterId === user.id)

    // Get system settings
    let systemSettings = await db.systemSettings.findUnique({
        where: { id: "main" }
    })
    if (!systemSettings) {
        systemSettings = await db.systemSettings.create({
            data: { id: "main" }
        })
    }

    return (
        <div className="min-h-screen bg-slate-950 -mt-16 md:-mt-20 pt-16 md:pt-20 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 py-8 relative">
                {/* Header */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    لوحة التحكم
                                </h1>
                                <p className="text-white/60">
                                    أهلاً بك <span className="text-teal-400 font-medium">{user.name}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full">
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-teal-400">متطوع نشط</span>
                            </div>
                            <Link href="/">
                                <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-white/60 mb-1">طلبات اليوم</p>
                        <p className="text-2xl font-bold text-white">{todayDonations.length}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-white/60 mb-1">الطلبات النشطة</p>
                        <p className="text-2xl font-bold text-white">{activeDonations.length}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-white/60 mb-1">الطلبات المكتملة</p>
                        <p className="text-2xl font-bold text-white">{completedDonations.length}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-white/60 mb-1">إجمالي الطلبات</p>
                        <p className="text-2xl font-bold text-white">{user.assignedDonations.length}</p>
                    </div>
                </div>

                {/* Dashboard Content */}
                <VolunteerDashboardClient
                    donations={user.assignedDonations}
                    availableDonations={sortedAvailableDonations}
                    volunteerName={user.name}
                    volunteerZone={user.zone}
                    volunteerId={user.id}
                    helpRequests={helpRequests}
                    myHelpRequest={myHelpRequest || null}
                    isSystemOpen={systemSettings.volunteerDashOpen}
                />
            </div>
        </div>
    )
}
