import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AdminDashboard } from "./admin-dashboard"

export default async function AdminPage() {
    const session = await auth()

    // Check session role first
    if (session?.user?.role !== "ADMIN") {
        redirect("/")
    }

    // Double-check admin status from database (not just session)
    const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, phone: true }
    })

    if (!dbUser || dbUser.role !== "ADMIN") {
        redirect("/")
    }

    // Check if user is blocked
    if (dbUser.phone) {
        const blocked = await db.blockedPhone.findUnique({
            where: { phone: dbUser.phone.replace(/\s/g, "") }
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
                            تم حظر حسابك من الوصول للوحة التحكم. يرجى التواصل مع الدعم الفني.
                        </p>
                        <a href="/" className="inline-block px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10">
                            العودة للرئيسية
                        </a>
                    </div>
                </div>
            )
        }
    }

    // Fetch stats
    const usersCount = await db.user.count()
    const donationsCount = await db.donation.count()
    const pendingDonations = await db.donation.count({
        where: { status: "PENDING" }
    })
    const todayDonations = await db.donation.count({
        where: {
            scheduledDate: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        }
    })

    // Fetch all donations (ordered by scheduled date and creation)
    const donations = await db.donation.findMany({
        orderBy: [
            { scheduledDate: "asc" },
            { createdAt: "desc" }
        ]
    })

    // Get unique phone numbers with donation count
    const phoneStats = await db.donation.groupBy({
        by: ['donorPhone'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
    })

    // Get blocked phones
    const blockedPhones = await db.blockedPhone.findMany({
        orderBy: { createdAt: "desc" }
    })

    // Fetch all volunteers (and admins who can also volunteer)
    const volunteers = await db.user.findMany({
        where: {
            role: { in: ["VOLUNTEER", "ADMIN"] }
        },
        select: { id: true, name: true, phone: true, zone: true }
    })

    // Fetch pending volunteer requests
    const pendingVolunteers = await db.user.findMany({
        where: { role: "PENDING_VOLUNTEER" },
        select: {
            id: true,
            name: true,
            phone: true,
            nationalId: true,
            vehicleType: true,
            zone: true,
            addressText: true,
            gender: true,
            dateOfBirth: true,
            createdAt: true
        },
        orderBy: { createdAt: "desc" }
    })

    // Fetch all users for user management
    const allUsers = await db.user.findMany({
        select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            zone: true,
            vehicleType: true,
            createdAt: true,
            _count: {
                select: {
                    assignedDonations: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    // Create a map of phone -> isBlocked
    const blockedPhonesSet = new Set(blockedPhones.map(b => b.phone))

    // Combine phone stats with blocked status
    const phonesWithStats = phoneStats.map(p => ({
        phone: p.donorPhone,
        donationCount: p._count.id,
        isBlocked: blockedPhonesSet.has(p.donorPhone)
    }))

    // Combine users with blocked status
    const usersWithStatus = allUsers.map(u => ({
        ...u,
        isBlocked: blockedPhonesSet.has(u.phone)
    }))

    // Get or create system settings
    let systemSettings = await db.systemSettings.findUnique({
        where: { id: "main" }
    })
    if (!systemSettings) {
        systemSettings = await db.systemSettings.create({
            data: { id: "main" }
        })
    }

    return (
        <AdminDashboard
            userName={session.user.name || ""}
            stats={{
                usersCount,
                donationsCount,
                pendingDonations,
                todayDonations,
                pendingVolunteersCount: pendingVolunteers.length
            }}
            donations={donations}
            phones={phonesWithStats}
            blockedPhones={blockedPhones}
            volunteers={volunteers}
            pendingVolunteers={pendingVolunteers}
            allUsers={usersWithStatus}
            systemSettings={{
                volunteerDashOpen: systemSettings.volunteerDashOpen,
                updatedAt: systemSettings.updatedAt,
                updatedBy: systemSettings.updatedBy
            }}
        />
    )
}
