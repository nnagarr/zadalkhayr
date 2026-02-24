"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Donation, DonationStatus, Zone, Beneficiary } from "@prisma/client"

// Extend Donation type to include beneficiary
type DonationWithBeneficiary = Donation & {
    beneficiary: Beneficiary | null
}

// Define locally since Prisma client types may not be synced
type HelpRequestStatus = "PENDING" | "ACCEPTED" | "RESOLVED" | "CANCELLED"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { assignDonationToSelf, updateDonationStatus, releaseDonation, createHelpRequest, acceptHelpRequest, resolveHelpRequest, cancelHelpRequest } from "../actions"
import { STATUS_LABELS, STATUS_COLORS, ZONE_LABELS } from "@/lib/constants"
import { Loader2, MapPin, Phone, Package, Clock, Truck, XCircle, RefreshCw, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react"

// Type for help request with included relations
interface HelpRequestWithRelations {
    id: string
    createdAt: Date
    reason: string
    location: string
    status: HelpRequestStatus
    requesterId: string
    helperId: string | null
    donationId: string | null
    requester: { id: string; name: string; phone: string }
    helper: { id: string; name: string; phone: string } | null
}

interface VolunteerDashboardProps {
    donations: DonationWithBeneficiary[]
    availableDonations: DonationWithBeneficiary[]
    volunteerName: string
    volunteerZone: Zone | null
    volunteerId: string
    helpRequests: HelpRequestWithRelations[]
    myHelpRequest: HelpRequestWithRelations | null
    isSystemOpen: boolean
}

export function VolunteerDashboardClient({
    donations,
    availableDonations,
    volunteerName,
    volunteerZone,
    volunteerId,
    helpRequests,
    myHelpRequest,
    isSystemOpen
}: VolunteerDashboardProps) {
    const router = useRouter()
    // Use admin-controlled system setting instead of time-based window
    const isWithinWindow = isSystemOpen
    const [loadingAction, setLoadingAction] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'available' | 'my-orders' | 'help'>('available')
    const [lastRefresh, setLastRefresh] = useState(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Help request form state
    const [showHelpForm, setShowHelpForm] = useState(false)
    const [helpReason, setHelpReason] = useState("")
    const [helpLocation, setHelpLocation] = useState("")

    // Auto-refresh every 30 seconds to keep data in sync
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            router.refresh()
            setLastRefresh(new Date())
        }, 30000) // 30 seconds

        return () => clearInterval(refreshInterval)
    }, [router])

    // Manual refresh function
    const handleManualRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        setLastRefresh(new Date())
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    const handleClaim = async (id: string) => {
        setLoadingAction(id)
        try {
            const result = await assignDonationToSelf(id)
            if (result.success) {
                alert("تم استلام الطلب بنجاح")
                setActiveTab('my-orders')
            } else {
                alert(result.error)
            }
        } catch (error) {
            alert("حدث خطأ أثناء استلام الطلب")
        } finally {
            setLoadingAction(null)
        }
    }

    const handleStatusUpdate = async (id: string, newStatus: DonationStatus) => {
        setLoadingAction(id)
        try {
            const result = await updateDonationStatus(id, newStatus)
            if (result.success) {
                // Silent success
            } else {
                alert(result.error)
            }
        } catch (error) {
            alert("حدث خطأ أثناء تحديث الحالة")
        } finally {
            setLoadingAction(null)
        }
    }

    const handleRelease = async (id: string) => {
        if (!confirm("هل أنت متأكد من إلغاء استلام هذا الطلب؟ سيصبح متاحاً لمتطوع آخر.")) {
            return
        }
        setLoadingAction(`release-${id}`)
        try {
            const result = await releaseDonation(id)
            if (result.success) {
                alert("تم إلغاء استلام الطلب بنجاح")
            } else {
                alert(result.error)
            }
        } catch (error) {
            alert("حدث خطأ أثناء إلغاء الاستلام")
        } finally {
            setLoadingAction(null)
        }
    }

    // Help request handlers
    const handleCreateHelpRequest = async () => {
        if (!helpReason.trim() || !helpLocation.trim()) {
            alert("يرجى إدخال سبب المساعدة والموقع")
            return
        }
        setLoadingAction('create-help')
        try {
            const result = await createHelpRequest(helpReason, helpLocation)
            if (result.success) {
                alert("تم إرسال طلب المساعدة بنجاح")
                setShowHelpForm(false)
                setHelpReason("")
                setHelpLocation("")
            } else {
                alert(result.error)
            }
        } catch (error) {
            alert("حدث خطأ أثناء إرسال طلب المساعدة")
        } finally {
            setLoadingAction(null)
        }
    }

    const handleAcceptHelp = async (requestId: string) => {
        setLoadingAction(`accept-${requestId}`)
        try {
            const result = await acceptHelpRequest(requestId)
            if (result.success) {
                alert("تم قبول طلب المساعدة - يمكنك الآن التواصل مع المتطوع")
            } else {
                alert(result.error)
            }
        } catch (error) {
            alert("حدث خطأ")
        } finally {
            setLoadingAction(null)
        }
    }

    const handleResolveHelp = async (requestId: string) => {
        setLoadingAction(`resolve-${requestId}`)
        try {
            const result = await resolveHelpRequest(requestId)
            if (result.success) {
                alert("تم إغلاق طلب المساعدة")
            } else {
                alert(result.error)
            }
        } catch (error) {
            alert("حدث خطأ")
        } finally {
            setLoadingAction(null)
        }
    }

    const handleCancelHelp = async (requestId: string) => {
        if (!confirm("هل أنت متأكد من إلغاء طلب المساعدة؟")) return
        setLoadingAction(`cancel-${requestId}`)
        try {
            const result = await cancelHelpRequest(requestId)
            if (result.success) {
                alert("تم إلغاء طلب المساعدة")
            } else {
                alert(result.error)
            }
        } catch (error) {
            alert("حدث خطأ")
        } finally {
            setLoadingAction(null)
        }
    }

    // Count of pending help requests (for badge)
    const pendingHelpCount = helpRequests.filter(r => r.status === "PENDING" && r.requesterId !== volunteerId).length

    // Message for outside hours
    if (!isWithinWindow) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-12 h-12 text-amber-500" />
                </div>
                <h2 className="text-3xl font-bold text-white">النظام مغلق حالياً</h2>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 max-w-md w-full text-right text-sm text-white/80 space-y-2">
                    <p className="font-bold text-amber-400 mb-2">تعليمات العمل:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>يمكنك اختيار حتى 5 طلبات في وقت واحد.</li>
                        <li>الأولوية للطلبات في منطقتك السكنية.</li>
                        <li>يجب تحديث حالة الطلب أولاً بأول (استلام من المتبرع -&gt; في الطريق -&gt; تم التوصيل).</li>
                        <li>التزم بالمواعيد المحددة لضمان وصول الطعام طازجاً.</li>
                    </ul>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Tabs and Refresh */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full md:w-fit">
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'available'
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        الطلبات المتاحة ({availableDonations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('my-orders')}
                        className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'my-orders'
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        طلباتي ({donations.filter(d => d.status !== 'COMPLETED' && d.status !== 'CANCELLED').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative ${activeTab === 'help'
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className="flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            المساعدة
                        </span>
                        {pendingHelpCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                {pendingHelpCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Refresh button and indicator */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        تحديث
                    </button>
                    <span className="text-xs text-white/40">
                        آخر تحديث: {lastRefresh.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'available' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableDonations.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-white/50 bg-white/5 rounded-2xl border border-white/10">
                            لا توجد طلبات متاحة حالياً
                        </div>
                    ) : (
                        availableDonations.map(donation => {
                            return (
                                <Card key={donation.id} className="bg-white/5 border-white/10 overflow-hidden hover:border-teal-500/30 transition-all group">
                                    <div className="p-1">
                                        {donation.zone === volunteerZone && (
                                            <div className="bg-teal-500/20 text-teal-400 text-xs font-bold px-3 py-1 text-center rounded-t-lg">
                                                في منطقتك
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{donation.donorName || "فاعل خير"}</h3>
                                                <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {donation.zone ? ZONE_LABELS[donation.zone] : "منطقة غير محددة"}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[donation.status]}`}>
                                                {STATUS_LABELS[donation.status]}
                                            </span>
                                        </div>

                                        {/* Only show quantity, not description */}
                                        <div className="bg-black/20 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 text-sm text-white/80">
                                                <Package className="w-4 h-4 text-white/40" />
                                                <span>{donation.quantity} وجبة</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleClaim(donation.id)}
                                            disabled={loadingAction === donation.id}
                                            className="w-full font-bold h-11 bg-teal-500 hover:bg-teal-600 text-white"
                                        >
                                            {loadingAction === donation.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : "استلام من المتبرع"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            ) : activeTab === 'my-orders' ? (
                <div className="space-y-4">
                    {donations.filter(d => d.status !== 'COMPLETED' && d.status !== 'CANCELLED').length === 0 ? (
                        <div className="py-12 text-center text-white/50 bg-white/5 rounded-2xl border border-white/10">
                            ليس لديك طلبات نشطة حالياً. اذهب لتبويب "الطلبات المتاحة" لاستلام طلب جديد.
                        </div>
                    ) : (
                        donations.filter(d => d.status !== 'COMPLETED' && d.status !== 'CANCELLED').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(donation => {
                            // Determine Next Action
                            let actionButton = null
                            let statusMessage = ""

                            switch (donation.status) {
                                case 'ASSIGNED':
                                    statusMessage = "المطلوب: استلام الطعام من المتبرع"
                                    actionButton = (
                                        <Button
                                            onClick={() => handleStatusUpdate(donation.id, 'COLLECTED')} // Requires 'COLLECTED' in enum
                                            disabled={loadingAction === donation.id}
                                            className="w-full bg-purple-500 hover:bg-purple-600 font-bold"
                                        >
                                            {loadingAction === donation.id ? <Loader2 className="animate-spin" /> : "تم الاستلام من المتبرع"}
                                        </Button>
                                    )
                                    break;
                                case 'COLLECTED':
                                    statusMessage = "المطلوب: التوجه للمستفيد لتسليم التبرع"
                                    actionButton = (
                                        <Button
                                            onClick={() => handleStatusUpdate(donation.id, 'OUT_FOR_DELIVERY')}
                                            disabled={loadingAction === donation.id}
                                            className="w-full bg-orange-500 hover:bg-orange-600 font-bold"
                                        >
                                            {loadingAction === donation.id ? <Loader2 className="animate-spin" /> : "في الطريق للمستفيد"}
                                        </Button>
                                    )
                                    break;
                                case 'OUT_FOR_DELIVERY':
                                    statusMessage = "المطلوب: تسليم الطعام للمستفيد (نهاية الرحلة)"
                                    actionButton = (
                                        <Button
                                            onClick={() => handleStatusUpdate(donation.id, 'COMPLETED')}
                                            disabled={loadingAction === donation.id}
                                            className="w-full bg-green-500 hover:bg-green-600 font-bold"
                                        >
                                            {loadingAction === donation.id ? <Loader2 className="animate-spin" /> : "تم التوصيل بنجاح"}
                                        </Button>
                                    )
                                    break;
                                default:
                                    statusMessage = "حالة غير معروفة"
                            }

                            return (
                                <Card key={donation.id} className="bg-white/5 border-white/10 relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 left-0 h-1 ${STATUS_COLORS[donation.status]?.split(' ')[0].replace('/20', '') || 'bg-gray-500'}`} />
                                    <CardContent className="p-5 md:p-6 grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[donation.status] || ''}`}>
                                                    {STATUS_LABELS[donation.status] || donation.status}
                                                </span>
                                                <span className="text-white/40 text-xs font-mono" dir="ltr">
                                                    #{donation.id.slice(-6)}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-white text-xl">{donation.donorName}</h3>
                                                <div className="flex items-center gap-2 text-white/60 mt-1" dir="ltr">
                                                    <Phone className="w-4 h-4" />
                                                    <a href={`tel:${donation.donorPhone}`} className="hover:text-white transition-colors">
                                                        {donation.donorPhone}
                                                    </a>
                                                </div>
                                            </div>

                                            {donation.addressText && (
                                                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                                    <p className="text-xs text-white/40 mb-1">العنوان</p>
                                                    <p className="text-white/80 text-sm leading-relaxed">{donation.addressText}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col justify-between space-y-4">
                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                                                    <Truck className="w-5 h-5" />
                                                    <span>الخطوة الحالية</span>
                                                </div>
                                                <p className="text-white/90">{statusMessage}</p>

                                            </div>

                                            {/* Beneficiary Info - Shown only in delivery phases */}
                                            {(donation.status === 'COLLECTED' || donation.status === 'OUT_FOR_DELIVERY' || donation.status === 'COMPLETED') && donation.beneficiary && (
                                                <div className="bg-pink-500/10 p-4 rounded-xl border border-pink-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    <div className="flex items-center gap-2 text-pink-400 font-bold mb-3 border-b border-pink-500/20 pb-2">
                                                        <div className="p-1 bg-pink-500/20 rounded-full">
                                                            <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </div>
                                                        <span>بيانات المستفيد</span>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-bold text-white text-lg">{donation.beneficiary.name}</h4>
                                                            <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                                                                <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{donation.beneficiary.zone}</span>
                                                                <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{donation.beneficiary.familyMembers} أفراد</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                                                            <div className="flex items-center gap-2 text-white/80" dir="ltr">
                                                                <Phone className="w-4 h-4 text-pink-400" />
                                                                <a href={`tel:${donation.beneficiary.phone}`} className="hover:text-pink-400 transition-colors font-mono">
                                                                    {donation.beneficiary.phone}
                                                                </a>
                                                            </div>
                                                            <a href={`tel:${donation.beneficiary.phone}`} className="p-2 bg-pink-500 hover:bg-pink-600 rounded-full text-white transition-colors">
                                                                <Phone className="w-4 h-4" />
                                                            </a>
                                                        </div>

                                                        <div className="text-sm text-white/70 bg-white/5 p-2 rounded-lg border border-white/5">
                                                            {donation.beneficiary.address}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 space-y-2">
                                                {actionButton}
                                                <Button
                                                    onClick={() => handleRelease(donation.id)}
                                                    disabled={loadingAction === `release-${donation.id}`}
                                                    variant="outline"
                                                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-10"
                                                >
                                                    {loadingAction === `release-${donation.id}` ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-4 h-4 ml-2" />
                                                            إلغاء استلام الطلب
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            ) : activeTab === 'help' ? (
                <div className="space-y-6">
                    {/* My Help Request Status */}
                    {myHelpRequest && (
                        <Card className="bg-amber-500/10 border-amber-500/30">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                                        <div>
                                            <h3 className="font-bold text-white text-lg">طلب المساعدة الخاص بك</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${myHelpRequest.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {myHelpRequest.status === 'PENDING' ? 'في انتظار المساعدة' : 'تم قبول المساعدة'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-white/80">
                                    <p><strong>السبب:</strong> {myHelpRequest.reason}</p>
                                    <p><strong>الموقع:</strong> {myHelpRequest.location}</p>
                                    {myHelpRequest.helper && (
                                        <div className="bg-green-500/10 p-3 rounded-lg mt-3 border border-green-500/30">
                                            <p className="text-green-400 font-bold mb-1">المتطوع القادم لمساعدتك:</p>
                                            <p className="text-white">{myHelpRequest.helper.name}</p>
                                            <a href={`tel:${myHelpRequest.helper.phone}`} className="text-green-400 hover:underline" dir="ltr">
                                                {myHelpRequest.helper.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        onClick={() => handleResolveHelp(myHelpRequest.id)}
                                        disabled={loadingAction === `resolve-${myHelpRequest.id}`}
                                        className="flex-1 bg-green-500 hover:bg-green-600"
                                    >
                                        {loadingAction === `resolve-${myHelpRequest.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 ml-2" /> تم حل المشكلة</>}
                                    </Button>
                                    <Button
                                        onClick={() => handleCancelHelp(myHelpRequest.id)}
                                        disabled={loadingAction === `cancel-${myHelpRequest.id}`}
                                        variant="outline"
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    >
                                        {loadingAction === `cancel-${myHelpRequest.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إلغاء'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Request Help Form */}
                    {!myHelpRequest && (
                        <Card className="bg-white/5 border-white/10">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                    طلب مساعدة
                                </h3>
                                {showHelpForm ? (
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-white/80">سبب طلب المساعدة</Label>
                                            <Input
                                                value={helpReason}
                                                onChange={(e) => setHelpReason(e.target.value)}
                                                placeholder="مثال: عطل في السيارة، إطار مثقوب..."
                                                className="bg-slate-900/50 border-white/10 text-white mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-white/80">موقعك الحالي</Label>
                                            <Input
                                                value={helpLocation}
                                                onChange={(e) => setHelpLocation(e.target.value)}
                                                placeholder="أدخل العنوان أو علامة مميزة..."
                                                className="bg-slate-900/50 border-white/10 text-white mt-1"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleCreateHelpRequest}
                                                disabled={loadingAction === 'create-help'}
                                                className="flex-1 bg-amber-500 hover:bg-amber-600"
                                            >
                                                {loadingAction === 'create-help' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال طلب المساعدة'}
                                            </Button>
                                            <Button
                                                onClick={() => setShowHelpForm(false)}
                                                variant="outline"
                                                className="border-white/10 text-white/60"
                                            >
                                                إلغاء
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => setShowHelpForm(true)}
                                        className="w-full bg-amber-500 hover:bg-amber-600 h-12"
                                    >
                                        <AlertTriangle className="w-5 h-5 ml-2" />
                                        أحتاج مساعدة
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Other Volunteers' Help Requests */}
                    <div>
                        <h3 className="font-bold text-white text-lg mb-4">طلبات المساعدة من المتطوعين</h3>
                        {helpRequests.filter(r => r.requesterId !== volunteerId).length === 0 ? (
                            <div className="py-8 text-center text-white/50 bg-white/5 rounded-2xl border border-white/10">
                                لا توجد طلبات مساعدة حالياً
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {helpRequests.filter(r => r.requesterId !== volunteerId).map(request => (
                                    <Card key={request.id} className={`border ${request.status === 'PENDING' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-white">{request.requester.name}</h4>
                                                    <a href={`tel:${request.requester.phone}`} className="text-sm text-white/60 hover:text-white" dir="ltr">
                                                        {request.requester.phone}
                                                    </a>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${request.status === 'PENDING' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-green-500/20 text-green-400'}`}>
                                                    {request.status === 'PENDING' ? 'يحتاج مساعدة' : 'تم قبول المساعدة'}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-white/80 text-sm mb-4">
                                                <p><strong>السبب:</strong> {request.reason}</p>
                                                <p><strong>الموقع:</strong> {request.location}</p>
                                            </div>
                                            {request.status === 'PENDING' ? (
                                                <Button
                                                    onClick={() => handleAcceptHelp(request.id)}
                                                    disabled={loadingAction === `accept-${request.id}`}
                                                    className="w-full bg-green-500 hover:bg-green-600"
                                                >
                                                    {loadingAction === `accept-${request.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : 'أنا قادم للمساعدة'}
                                                </Button>
                                            ) : (
                                                <div className="text-center text-green-400 text-sm py-2">
                                                    {request.helperId === volunteerId ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <CheckCircle className="w-4 h-4" />
                                                            أنت تقوم بمساعدته
                                                        </span>
                                                    ) : (
                                                        <span>يساعده: {request.helper?.name}</span>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : null
            }
        </div >
    )
}
