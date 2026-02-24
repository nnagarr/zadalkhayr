"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Donation, DonationStatus, DeliveryMethod, BlockedPhone, VehicleType, Gender, Zone } from "@prisma/client"
import { updateDonation, blockPhone, unblockPhone, approveVolunteer, rejectVolunteer, changeUserRole, deleteUser, toggleVolunteerDashboard, importBeneficiaries } from "./actions"
import { ZONE_LABELS, VEHICLE_TYPE_LABELS, GENDER_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"

interface PhoneStats {
    phone: string
    donationCount: number
    isBlocked: boolean
}

interface Volunteer {
    id: string
    name: string | null
    phone: string | null
    zone: string | null
    vehicleType?: VehicleType | null
    gender?: Gender | null
    dateOfBirth?: Date | null
    addressText?: string | null
}

interface PendingVolunteer {
    id: string
    name: string
    phone: string
    nationalId: string | null
    vehicleType: VehicleType | null
    zone: Zone | null
    addressText: string | null
    gender: Gender | null
    dateOfBirth: Date | null
    createdAt: Date
}

interface UserData {
    id: string
    name: string
    phone: string
    role: string
    zone: Zone | null
    vehicleType: VehicleType | null
    createdAt: Date
    _count: {
        assignedDonations: number
    }
    isBlocked: boolean
}

interface AdminDashboardProps {
    userName: string
    stats: {
        usersCount: number
        donationsCount: number
        pendingDonations: number
        todayDonations: number
        pendingVolunteersCount: number
    }
    donations: Donation[]
    phones: PhoneStats[]
    blockedPhones: BlockedPhone[]
    volunteers: Volunteer[]
    pendingVolunteers: PendingVolunteer[]
    allUsers: UserData[]
    systemSettings: {
        volunteerDashOpen: boolean
        updatedAt: Date
        updatedBy: string | null
    }
}

const ROLE_LABELS: Record<string, string> = {
    USER: "مستخدم",
    PENDING_VOLUNTEER: "متطوع قيد المراجعة",
    VOLUNTEER: "متطوع",
    ADMIN: "مدير"
}

const ROLE_COLORS: Record<string, string> = {
    USER: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    PENDING_VOLUNTEER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    VOLUNTEER: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    ADMIN: "bg-amber-500/20 text-amber-400 border-amber-500/30"
}



export function AdminDashboard({ userName, stats, donations, phones, blockedPhones, volunteers, pendingVolunteers, allUsers, systemSettings }: AdminDashboardProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"donations" | "volunteers" | "users" | "beneficiaries">("donations")
    const [processingVolunteer, setProcessingVolunteer] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("today")
    const [expandedDonations, setExpandedDonations] = useState<Set<string>>(new Set())
    const [blockReason, setBlockReason] = useState("")
    const [isBlocking, setIsBlocking] = useState<string | null>(null)

    // User management state
    const [userSearch, setUserSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [processingUser, setProcessingUser] = useState<string | null>(null)

    // System settings state
    const [isVolunteerDashOpen, setIsVolunteerDashOpen] = useState(systemSettings.volunteerDashOpen)
    const [isTogglingSystem, setIsTogglingSystem] = useState(false)

    // Beneficiary Import State
    const [isImporting, setIsImporting] = useState(false)
    const [importResult, setImportResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)

    // Auto-refresh state
    const [lastRefresh, setLastRefresh] = useState(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            router.refresh()
            setLastRefresh(new Date())
        }, 30000)

        return () => clearInterval(refreshInterval)
    }, [router])

    // Manual refresh
    const handleManualRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        setLastRefresh(new Date())
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        setImportResult(null)

        try {
            const text = await file.text()
            // Basic validation it looks like JSON
            JSON.parse(text) // Will throw if invalid

            const result = await importBeneficiaries(text)
            setImportResult(result)
            if (result.success) {
                // Clear file input
                e.target.value = ""
            }
        } catch (error) {
            setImportResult({ success: false, error: "فشل في قراءة الملف. تأكد من أنه ملف JSON صحيح." })
        } finally {
            setIsImporting(false)
        }
    }

    // Filter users
    const filteredUsers = allUsers.filter(user => {
        if (roleFilter !== "all" && user.role !== roleFilter) {
            return false
        }
        if (userSearch && !user.name.includes(userSearch) && !user.phone.includes(userSearch)) {
            return false
        }
        return true
    })

    // Filter donations
    const filteredDonations = donations.filter(donation => {
        if (statusFilter !== "all" && donation.status !== statusFilter) {
            return false
        }

        if (dateFilter !== "all") {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            const donationDate = new Date(donation.scheduledDate)
            donationDate.setHours(0, 0, 0, 0)

            if (dateFilter === "today" && donationDate.getTime() !== today.getTime()) {
                return false
            }
            if (dateFilter === "tomorrow" && donationDate.getTime() !== tomorrow.getTime()) {
                return false
            }
        }

        return true
    })

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("ar-EG", {
            weekday: "short",
            month: "short",
            day: "numeric"
        })
    }

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getScheduleLabel = (date: Date) => {
        const d = new Date(date)
        const now = new Date()

        // Convert to Egypt time for comparison
        const egyptNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const egyptDate = new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));

        // Reset hours to compare dates only
        egyptNow.setHours(0, 0, 0, 0)
        egyptDate.setHours(0, 0, 0, 0)

        const timeDiff = egyptDate.getTime() - egyptNow.getTime()
        const dayDiff = timeDiff / (1000 * 3600 * 24)

        if (dayDiff === 0) return "اليوم"
        if (dayDiff === 1) return "غداً"

        return formatDate(d)
    }

    const handleBlock = async (phone: string) => {
        setIsBlocking(phone)
        try {
            const result = await blockPhone(phone, blockReason)
            if (result && !result.success && result.error) {
                alert(result.error)
            } else {
                setBlockReason("")
            }
        } finally {
            setIsBlocking(null)
        }
    }

    const handleUnblock = async (phone: string) => {
        setIsBlocking(phone)
        try {
            await unblockPhone(phone)
        } finally {
            setIsBlocking(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 -mt-16 md:-mt-20 pt-16 md:pt-20 relative overflow-hidden pb-24 md:pb-8">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 py-6 md:py-8 relative">
                {/* Header - Compact on Mobile */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-6 mb-4 md:mb-6">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-white">
                                    لوحة التحكم
                                </h1>
                                <p className="text-sm md:text-base text-white/60">
                                    أهلاً بك <span className="text-amber-400 font-medium">{userName}</span>
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-amber-400">مدير النظام</span>
                        </div>
                    </div>
                    {/* Mobile Admin Badge */}
                    <div className="flex md:hidden justify-center mt-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-amber-400">مدير النظام</span>
                        </div>
                    </div>

                    {/* System Toggle Control */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-white/70">لوحة المتطوعين:</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        setIsTogglingSystem(true)
                                        try {
                                            await toggleVolunteerDashboard(!isVolunteerDashOpen)
                                            setIsVolunteerDashOpen(!isVolunteerDashOpen)
                                        } finally {
                                            setIsTogglingSystem(false)
                                        }
                                    }}
                                    disabled={isTogglingSystem}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${isVolunteerDashOpen ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                    dir="ltr"
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isVolunteerDashOpen ? 'translate-x-5' : 'translate-x-0.5'
                                            }`}
                                    />
                                </button>
                                <span className={`text-sm font-semibold ${isVolunteerDashOpen ? 'text-green-400' : 'text-red-400'}`}>
                                    {isTogglingSystem ? 'جاري...' : (isVolunteerDashOpen ? 'مفتوحة' : 'مغلقة')}
                                </span>
                            </div>
                        </div>
                        <span className="text-xs text-white/40">
                            {systemSettings.updatedBy && `آخر تحديث: ${systemSettings.updatedBy}`}
                        </span>
                    </div>

                    {/* Refresh Controls */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all text-sm"
                            >
                                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                تحديث
                            </button>
                            <span className="text-xs text-white/40">
                                آخر تحديث: {lastRefresh.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <span className="text-xs text-white/30">تحديث تلقائي كل 30 ثانية</span>
                    </div>
                </div>

                {/* Stats Cards - Better mobile grid */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4 mb-4 md:mb-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 p-4 md:p-5">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs md:text-sm text-white/60 mb-1">إجمالي التبرعات</p>
                        <p className="text-xl md:text-2xl font-bold text-white">{stats.donationsCount}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 p-4 md:p-5">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs md:text-sm text-white/60 mb-1">قيد الانتظار</p>
                        <p className="text-xl md:text-2xl font-bold text-yellow-400">{stats.pendingDonations}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 p-4 md:p-5">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs md:text-sm text-white/60 mb-1">تبرعات اليوم</p>
                        <p className="text-xl md:text-2xl font-bold text-green-400">{stats.todayDonations}</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 p-4 md:p-5">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs md:text-sm text-white/60 mb-1">طلبات التطوع</p>
                        <p className="text-xl md:text-2xl font-bold text-teal-400">{stats.pendingVolunteersCount}</p>
                    </div>

                    <div className="col-span-2 md:col-span-1 bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 p-4 md:p-5">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs md:text-sm text-white/60 mb-1">مستخدمون محظورون</p>
                        <p className="text-xl md:text-2xl font-bold text-red-400">{blockedPhones.length}</p>
                    </div>
                </div>

                {/* Desktop Tabs - Hidden on mobile */}
                <div className="hidden md:flex gap-2 mb-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-2">
                    <button
                        onClick={() => setActiveTab("donations")}
                        className={`flex-1 px-4 py-3 font-medium rounded-xl transition-all ${activeTab === "donations"
                            ? "bg-amber-500 text-slate-900"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        التبرعات ({donations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("volunteers")}
                        className={`flex-1 px-4 py-3 font-medium rounded-xl transition-all ${activeTab === "volunteers"
                            ? "bg-amber-500 text-slate-900"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        طلبات التطوع ({pendingVolunteers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`flex-1 py-3 px-4 text-center rounded-xl transition-all font-medium border ${activeTab === "users"
                            ? "bg-amber-500 text-slate-900 border-amber-500 shadow-lg shadow-amber-500/20"
                            : "bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10"
                            }`}
                    >
                        المستخدمين ({stats.usersCount})
                    </button>
                    <button
                        onClick={() => setActiveTab("beneficiaries")}
                        className={`flex-1 py-3 px-4 text-center rounded-xl transition-all font-medium border ${activeTab === "beneficiaries"
                            ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20"
                            : "bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10"
                            }`}
                    >
                        المستفيدين
                    </button>
                </div>

                {/* Mobile Fixed Bottom Navigation */}
                <div className="fixed md:hidden bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 px-2 py-2 z-50">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab("donations")}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${activeTab === "donations"
                                ? "bg-amber-500 text-slate-900"
                                : "text-white/60"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className="text-[10px] font-medium">التبرعات</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("volunteers")}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${activeTab === "volunteers"
                                ? "bg-amber-500 text-slate-900"
                                : "text-white/60"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] font-medium">التطوع</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${activeTab === "users"
                                ? "bg-amber-500 text-slate-900"
                                : "text-white/60"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1H3v-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] font-medium">المستخدمين</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("beneficiaries")}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${activeTab === "beneficiaries"
                                ? "bg-pink-500 text-white"
                                : "text-white/60"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-[10px] font-medium">المستفيدين</span>
                        </button>
                    </div>
                </div>

                {/* Donations Tab */}
                {activeTab === "donations" && (
                    <>
                        {/* Filters */}
                        <div className="flex gap-4 flex-wrap bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-white/70">الحالة:</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Label className="text-white/70">التاريخ:</Label>
                                <Select value={dateFilter} onValueChange={setDateFilter}>
                                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        <SelectItem value="today">اليوم</SelectItem>
                                        <SelectItem value="tomorrow">الغد</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Donations List */}
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-white">التبرعات ({filteredDonations.length})</h2>

                            {filteredDonations.length === 0 ? (
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center text-white/60">
                                    لا توجد تبرعات مطابقة للفلتر
                                </div>
                            ) : (
                                filteredDonations.map(donation => (
                                    <DonationCard
                                        key={donation.id}
                                        donation={donation}
                                        isExpanded={expandedDonations.has(donation.id)}
                                        onToggle={() => {
                                            setExpandedDonations(prev => {
                                                const newSet = new Set(prev)
                                                if (newSet.has(donation.id)) {
                                                    newSet.delete(donation.id)
                                                } else {
                                                    newSet.add(donation.id)
                                                }
                                                return newSet
                                            })
                                        }}
                                        formatDate={formatDate}
                                        formatTime={formatTime}
                                        getScheduleLabel={getScheduleLabel}
                                        onBlockPhone={handleBlock}
                                        isBlocking={isBlocking}
                                        volunteers={volunteers}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )
                }

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="بحث بالاسم أو رقم الهاتف..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-white/70">الدور:</Label>
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-white">المستخدمين ({filteredUsers.length})</h2>

                            {filteredUsers.length === 0 ? (
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center text-white/60">
                                    لا يوجد مستخدمين مطابقين للبحث
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredUsers.map(user => (
                                        <div key={user.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-bold text-white">{user.name}</h3>
                                                        <span className={`px-2 py-1 text-xs rounded-full border ${ROLE_COLORS[user.role]}`}>
                                                            {ROLE_LABELS[user.role]}
                                                        </span>
                                                        {user.isBlocked && (
                                                            <span className="px-2 py-1 text-xs rounded-full border border-red-500/30 bg-red-500/20 text-red-400">
                                                                محظور
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid gap-1 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white/60">الهاتف:</span>
                                                            <span dir="ltr" className="font-mono text-white">{user.phone}</span>
                                                        </div>
                                                        {user.zone && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white/60">المنطقة:</span>
                                                                <span className="text-white">{ZONE_LABELS[user.zone]}</span>
                                                            </div>
                                                        )}
                                                        {user.vehicleType && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white/60">المركبة:</span>
                                                                <span className="text-white">{VEHICLE_TYPE_LABELS[user.vehicleType]}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white/60">تاريخ التسجيل:</span>
                                                            <span className="text-white">{formatDate(user.createdAt)}</span>
                                                        </div>
                                                        {user._count.assignedDonations > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white/60">التبرعات المسندة:</span>
                                                                <span className="text-teal-400 font-bold">{user._count.assignedDonations}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Select
                                                        value={user.role}
                                                        onValueChange={async (newRole) => {
                                                            setProcessingUser(user.id)
                                                            try {
                                                                await changeUserRole(user.id, newRole)
                                                            } finally {
                                                                setProcessingUser(null)
                                                            }
                                                        }}
                                                        disabled={processingUser === user.id}
                                                    >
                                                        <SelectTrigger className="w-full md:w-40 bg-white/10 border-white/20 text-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        variant={user.isBlocked ? "outline" : "destructive"}
                                                        size="sm"
                                                        onClick={async () => {
                                                            if (user.isBlocked) {
                                                                if (confirm(`هل أنت متأكد من إلغاء حظر المستخدم "${user.name}"؟`)) {
                                                                    setProcessingUser(user.id)
                                                                    try {
                                                                        await unblockPhone(user.phone)
                                                                    } finally {
                                                                        setProcessingUser(null)
                                                                    }
                                                                }
                                                            } else {
                                                                if (confirm(`هل أنت متأكد من حظر المستخدم "${user.name}"؟ سيتم منع هذا الرقم من التبرع.`)) {
                                                                    setProcessingUser(user.id)
                                                                    try {
                                                                        const result = await blockPhone(user.phone)
                                                                        if (result && !result.success && result.error) {
                                                                            alert(result.error)
                                                                        }
                                                                    } finally {
                                                                        setProcessingUser(null)
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                        disabled={processingUser === user.id}
                                                        className={user.isBlocked ? "border-white/20 text-white hover:bg-white/10" : ""}
                                                    >
                                                        {processingUser === user.id ? "جاري..." : (user.isBlocked ? "إلغاء الحظر" : "حظر")}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Volunteers Tab */}
                {activeTab === "volunteers" && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white">طلبات التطوع ({pendingVolunteers.length})</h2>

                        {pendingVolunteers.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">
                                لا توجد طلبات تطوع جديدة
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {pendingVolunteers.map(volunteer => (
                                    <div key={volunteer.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:border-teal-500/30 transition-all">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center justify-between md:justify-start gap-3">
                                                    <h3 className="text-xl font-bold text-white">{volunteer.name}</h3>
                                                    <span className="px-3 py-1 text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-full">
                                                        قيد المراجعة
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white/40 w-24">الهاتف:</span>
                                                        <span dir="ltr" className="font-mono text-white/90">{volunteer.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white/40 w-24">الرقم القومي:</span>
                                                        <span dir="ltr" className="font-mono text-white/90">{volunteer.nationalId || "—"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white/40 w-24">نوع المركبة:</span>
                                                        <span className="text-white/90">{volunteer.vehicleType ? VEHICLE_TYPE_LABELS[volunteer.vehicleType] : "—"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white/40 w-24">المنطقة:</span>
                                                        <span className="text-white/90">{volunteer.zone ? ZONE_LABELS[volunteer.zone] : "—"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white/40 w-24">النوع:</span>
                                                        <span className="text-white/90">{volunteer.gender ? GENDER_LABELS[volunteer.gender] : "—"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white/40 w-24">تاريخ الطلب:</span>
                                                        <span className="text-white/90">{formatDate(volunteer.createdAt)}</span>
                                                    </div>
                                                </div>

                                                {volunteer.addressText && (
                                                    <div className="bg-black/20 rounded-lg p-3 text-sm border border-white/5 mt-2">
                                                        <span className="text-white/40 block mb-1 text-xs">العنوان:</span>
                                                        <span className="text-white/90 leading-relaxed">{volunteer.addressText}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex md:flex-col gap-3 pt-4 md:pt-0 border-t border-white/10 md:border-none">
                                                <Button
                                                    onClick={async () => {
                                                        setProcessingVolunteer(volunteer.id)
                                                        try {
                                                            await approveVolunteer(volunteer.id)
                                                        } finally {
                                                            setProcessingVolunteer(null)
                                                        }
                                                    }}
                                                    disabled={processingVolunteer === volunteer.id}
                                                    className="w-full bg-green-500 hover:bg-green-600 font-bold shadow-lg shadow-green-500/20"
                                                >
                                                    {processingVolunteer === volunteer.id ? "جاري..." : "قبول الطلب"}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={async () => {
                                                        setProcessingVolunteer(volunteer.id)
                                                        try {
                                                            await rejectVolunteer(volunteer.id)
                                                        } finally {
                                                            setProcessingVolunteer(null)
                                                        }
                                                    }}
                                                    disabled={processingVolunteer === volunteer.id}
                                                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                                                >
                                                    {processingVolunteer === volunteer.id ? "جاري..." : "رفض"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
                }

                {/* Beneficiaries Tab */}
                {activeTab === "beneficiaries" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            إدارة المستفيدين (الفقراء)
                        </h2>

                        {/* Import Section */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                استيراد المستفيدين من ملف JSON
                            </h3>

                            <p className="text-white/60 text-sm mb-4">
                                قم برفع ملف JSON يحتوي على بيانات المستفيدين. الملف يجب أن يكون مصفوفة تحتوي على:
                                <code className="bg-black/30 px-2 py-1 rounded mx-1 text-pink-400">name, phoneNumber, zone, address, familyMembers</code>
                            </p>

                            <div className="flex flex-col md:flex-row gap-4 items-start">
                                <label className="flex-1 cursor-pointer">
                                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${isImporting ? 'border-pink-500/50 bg-pink-500/10' : 'border-white/20 hover:border-pink-500/50 hover:bg-white/5'}`}>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleFileUpload}
                                            disabled={isImporting}
                                            className="hidden"
                                        />
                                        {isImporting ? (
                                            <div className="flex items-center justify-center gap-2 text-pink-400">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                جاري الاستيراد...
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-10 h-10 mx-auto mb-2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-white/70">اضغط هنا أو اسحب ملف JSON</p>
                                                <p className="text-white/40 text-xs mt-1">يدعم ملفات .json فقط</p>
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>

                            {/* Import Result */}
                            {importResult && (
                                <div className={`mt-4 p-4 rounded-xl border ${importResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                    {importResult.success ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            تم استيراد {importResult.count} مستفيد بنجاح
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {importResult.error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-6">
                            <h4 className="font-bold text-pink-400 mb-3">📋 تنسيق الملف المطلوب:</h4>
                            <pre dir="ltr" className="bg-black/30 rounded-lg p-4 text-xs text-white/80 overflow-x-auto">
                                {`[
  {
    "name": "اسم المستفيد",
    "phoneNumber": 1012345678,
    "zone": "المنطقة",
    "address": "العنوان التفصيلي",
    "familyMembers": 4
  }
]`}
                            </pre>
                            <p className="text-white/60 text-sm mt-3">
                                💡 <strong>ملاحظة:</strong> سيتم تعيين المستفيدين تلقائياً للتبرعات عندما يستلم المتطوع الطلب.
                                يتم اختيار مستفيد عشوائي لم يستلم تبرعاً اليوم، مع تفضيل نفس منطقة المتطوع.
                            </p>
                        </div>
                    </div>
                )}
            </div >
        </div >
    )
}

interface DonationCardProps {
    donation: Donation
    isExpanded: boolean
    onToggle: () => void
    formatDate: (date: Date) => string
    formatTime: (date: Date) => string
    getScheduleLabel: (date: Date) => string
    onBlockPhone: (phone: string) => void
    isBlocking: string | null
    volunteers: Volunteer[]
}

function DonationCard({ donation, isExpanded, onToggle, formatDate, formatTime, getScheduleLabel, onBlockPhone, isBlocking, volunteers }: DonationCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [status, setStatus] = useState(donation.status)
    const [volunteerId, setVolunteerId] = useState(donation.volunteerId || "none")
    const [adminNotes, setAdminNotes] = useState(donation.adminNotes || "")

    // Sync local state when donation prop changes (e.g., when volunteer claims order)
    useEffect(() => {
        setStatus(donation.status)
        setVolunteerId(donation.volunteerId || "none")
        setAdminNotes(donation.adminNotes || "")
    }, [donation.status, donation.volunteerId, donation.adminNotes])

    const handleUpdate = async () => {
        setIsUpdating(true)
        try {
            await updateDonation(donation.id, {
                status,
                volunteerId: volunteerId === "none" ? null : volunteerId,
                adminNotes: adminNotes || null
            })
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            {/* Header - Always visible */}
            <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={onToggle}
            >
                <div className="flex flex-col gap-3">
                    {/* Top Row: Badges & Date */}
                    <div className="flex items-start justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Status Badge */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[donation.status]}`}>
                                {STATUS_LABELS[donation.status]}
                            </span>



                            {/* Delivered By Badge - shown for completed orders */}
                            {donation.status === "COMPLETED" && donation.deliveredByName && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
                                    وصّل بواسطة: {donation.deliveredByName}
                                </span>
                            )}
                        </div>

                        <span className="text-xs font-medium text-white/50 bg-white/5 px-2.5 py-1 rounded-lg whitespace-nowrap">
                            {getScheduleLabel(donation.scheduledDate)}
                        </span>
                    </div>

                    {/* Donor Info Row */}
                    <div>
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="font-bold text-white text-base md:text-lg leading-tight">
                                {donation.donorName}
                            </h3>
                            <span className="text-xs text-white/40 whitespace-nowrap bg-white/5 px-2 py-1 rounded hidden md:inline-block">
                                {donation.zone ? ZONE_LABELS[donation.zone] : "غير محدد"}
                            </span>
                        </div>
                        <p dir="ltr" className="text-sm text-white/60 font-mono mt-0.5 text-right w-full flex justify-end md:justify-start md:w-auto">
                            {donation.donorPhone}
                        </p>
                    </div>

                    {/* Description Row (Mobile Zone here) */}
                    <div className="flex items-start justify-between gap-4 pt-1 border-t border-white/5 md:border-none md:pt-0">
                        <span className="text-white/90 font-bold">{donation.quantity} وجبة</span>
                        <span className="text-xs text-white/40 whitespace-nowrap bg-white/5 px-2 py-1 rounded md:hidden">
                            {donation.zone ? ZONE_LABELS[donation.zone] : "غير محدد"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-white/10 p-4 md:p-5 bg-black/20 space-y-5 md:space-y-6">
                    {/* Address Section */}
                    {donation.addressText && (
                        <div className="p-3 md:p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <Label className="text-xs font-semibold text-orange-400 mb-1.5 block">العنوان التفصيلي</Label>
                            <p className="text-sm text-white/90 leading-relaxed">{donation.addressText}</p>
                        </div>
                    )}

                    {/* Admin Controls Grid */}
                    <div className="grid gap-4 md:gap-5 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/80">حالة التبرع</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as DonationStatus)}>
                                <SelectTrigger className="bg-slate-900/50 border-white/10 text-white h-11 focus:ring-amber-500/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    {Object.entries(STATUS_LABELS)
                                        .map(([value, label]) => (
                                            <SelectItem key={value} value={value} className="focus:bg-white/10 focus:text-white cursor-pointer py-2">
                                                {label}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/80">تعيين متطوع</Label>
                            {/* Completed orders - show who delivered */}
                            {donation.status === "COMPLETED" ? (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 flex items-center h-11 text-green-400 text-sm">
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {donation.deliveredByName ? `وصّل بواسطة: ${donation.deliveredByName}` : "تم التوصيل"}
                                </div>
                            ) : donation.status === "CANCELLED" ? (
                                /* Cancelled orders */
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 flex items-center h-11 text-red-400 text-sm">
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    الطلب ملغي
                                </div>
                            ) : donation.deliveryMethod === "SELF_DELIVERY" && !(["OUT_FOR_DELIVERY"].includes(donation.status)) ? (
                                /* Self-delivery in early stages doesn't need volunteer */
                                <div className="bg-white/5 border border-white/10 rounded-lg px-3 flex items-center h-11 text-white/50 text-sm">
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    توصيل شخصي
                                </div>
                            ) : (
                                <>
                                    {donation.volunteerId ? (
                                        <div className="space-y-2">
                                            <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-teal-400 text-sm">
                                                        {volunteers.find(v => v.id === donation.volunteerId)?.name || "متطوع غير معرف"}
                                                    </span>
                                                    <a href={`tel:${volunteers.find(v => v.id === donation.volunteerId)?.phone}`} className="text-xs text-teal-500/70 hover:text-teal-400" dir="ltr">
                                                        {volunteers.find(v => v.id === donation.volunteerId)?.phone}
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-teal-500/70 bg-teal-500/10 px-2 py-1 rounded whitespace-nowrap">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                    تم الاستلام
                                                </div>
                                            </div>
                                            {/* Unassign button */}
                                            <Button
                                                type="button"
                                                onClick={async () => {
                                                    // Determine the new status - reset to PENDING
                                                    const newStatus: DonationStatus = "PENDING"

                                                    // Update local state immediately for UI feedback
                                                    setVolunteerId("none")
                                                    setStatus(newStatus)

                                                    // Save to database immediately
                                                    setIsUpdating(true)
                                                    try {
                                                        await updateDonation(donation.id, {
                                                            status: newStatus,
                                                            volunteerId: null,
                                                            adminNotes: adminNotes || null
                                                        })
                                                    } finally {
                                                        setIsUpdating(false)
                                                    }
                                                }}
                                                variant="outline"
                                                size="sm"
                                                disabled={isUpdating}
                                                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                            >
                                                {isUpdating ? (
                                                    <svg className="animate-spin w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                                {isUpdating ? "جاري الإلغاء..." : "إلغاء تعيين المتطوع"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-lg px-3 flex items-center h-11 text-white/50 text-sm">
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            في انتظار متطوع
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/80">ملاحظات الإدارة</Label>
                            <Input
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="أضف ملاحظات داخلية..."
                                className="bg-slate-900/50 border-white/10 text-white h-11 focus:ring-amber-500/50 placeholder:text-white/30"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col gap-4 pt-2 border-t border-white/5">
                        <Button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="w-full bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold h-12 shadow-lg shadow-amber-500/20 transition-all text-base"
                        >
                            {isUpdating ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري الحفظ...
                                </span>
                            ) : "حفظ التغييرات"}
                        </Button>

                        <div className="flex items-center justify-between">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onBlockPhone(donation.donorPhone)
                                }}
                                disabled={isBlocking === donation.donorPhone}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 transition-all text-xs h-9"
                            >
                                {isBlocking === donation.donorPhone ? "جاري..." : "حظر المتبرع"}
                            </Button>

                            <span className="text-[10px] text-white/40 font-mono" dir="ltr">
                                {formatDate(donation.createdAt)} • {formatTime(donation.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
