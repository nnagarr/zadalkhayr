"use client"

import { useActionState, useState } from "react"
import { updateProfile, changePassword, updateVolunteerProfile } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Donation, User } from "@prisma/client"
import { signOut } from "next-auth/react"
import { ZONE_LABELS, VEHICLE_TYPE_LABELS, GENDER_LABELS } from "@/lib/constants"

interface ProfileClientProps {
    user: User
    donations: Donation[]
    donationsCount: number
}

const initialState = {
    error: undefined,
    success: undefined
}

export function ProfileClient({ user, donations, donationsCount }: ProfileClientProps) {
    const [profileState, profileAction, isProfilePending] = useActionState(updateProfile, initialState)
    const [passwordState, passwordAction, isPasswordPending] = useActionState(changePassword, initialState)
    const [volunteerState, volunteerAction, isVolunteerPending] = useActionState(updateVolunteerProfile, initialState)

    // Explicitly define error types for type safety access
    const profileErrors = (typeof profileState.error === 'object' ? profileState.error : {}) as { name?: string[] }
    const passwordErrors = (typeof passwordState.error === 'object' ? passwordState.error : {}) as {
        currentPassword?: string[],
        newPassword?: string[],
        confirmPassword?: string[]
    }
    const volunteerErrors = (typeof volunteerState.error === 'object' ? volunteerState.error : {}) as {
        vehicleType?: string[],
        zone?: string[],
        addressText?: string[]
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-4xl font-bold text-slate-900 shadow-xl shadow-amber-500/20">
                    {user.name.charAt(0)}
                </div>
                <div className="text-center md:text-right space-y-2 flex-1">
                    <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-white/60">
                        <span dir="ltr" className="font-mono">{user.phone}</span>
                        <span>•</span>
                        <span>عضو منذ {formatDate(user.createdAt)}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <div className="bg-white/5 rounded-xl p-4 text-center min-w-[140px] border border-white/10">
                        <p className="text-2xl font-bold text-amber-400">{donationsCount}</p>
                        <p className="text-sm text-white/60">تبرع مساهم</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Edit Profile Form */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        المعلومات الشخصية
                    </h2>

                    <form action={profileAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">الاسم</Label>
                            <Input
                                name="name"
                                defaultValue={user.name}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            {profileErrors?.name && (
                                <p className="text-red-400 text-xs">{profileErrors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2 opacity-60">
                            <Label className="text-white/80">رقم الهاتف (لا يمكن تغييره)</Label>
                            <Input
                                value={user.phone}
                                disabled
                                className="bg-white/5 border-white/10 text-white cursor-not-allowed"
                                dir="ltr"
                            />
                        </div>



                        {profileState.success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm text-center">
                                {profileState.success}
                            </div>
                        )}

                        {profileState.error && typeof profileState.error === 'string' && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                                {profileState.error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isProfilePending}
                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        >
                            {isProfilePending ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </Button>
                    </form>
                </div>

                {/* Change Password Form */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        تغيير كلمة المرور
                    </h2>

                    <form action={passwordAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">كلمة المرور الحالية</Label>
                            <Input
                                name="currentPassword"
                                type="password"
                                className="bg-white/5 border-white/10 text-white"
                            />
                            {passwordErrors?.currentPassword && (
                                <p className="text-red-400 text-xs">{passwordErrors.currentPassword}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/80">كلمة المرور الجديدة</Label>
                            <Input
                                name="newPassword"
                                type="password"
                                className="bg-white/5 border-white/10 text-white"
                            />
                            {passwordErrors?.newPassword && (
                                <p className="text-red-400 text-xs">{passwordErrors.newPassword}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/80">تأكيد كلمة المرور الجديدة</Label>
                            <Input
                                name="confirmPassword"
                                type="password"
                                className="bg-white/5 border-white/10 text-white"
                            />
                            {passwordErrors?.confirmPassword && (
                                <p className="text-red-400 text-xs">{passwordErrors.confirmPassword}</p>
                            )}
                        </div>

                        {passwordState.success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm text-center">
                                {passwordState.success}
                            </div>
                        )}

                        {passwordState.error && typeof passwordState.error === 'string' && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                                {passwordState.error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isPasswordPending}
                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        >
                            {isPasswordPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
                        </Button>
                    </form>
                </div>

                {/* Address and Vehicle Information Form */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 md:p-8 md:col-span-2">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        بيانات العنوان والمركبة (للمتطوعين)
                    </h2>

                    <form action={volunteerAction} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-white/80">نوع المركبة</Label>
                                <Select name="vehicleType" defaultValue={user.vehicleType || undefined}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-right" dir="rtl">
                                        <SelectValue placeholder="اختر نوع المركبة" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl" className="bg-slate-900 border-white/10 text-white">
                                        {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {volunteerErrors?.vehicleType && (
                                    <p className="text-red-400 text-xs">{volunteerErrors.vehicleType}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white/80">المنطقة</Label>
                                <Select name="zone" defaultValue={user.zone || undefined}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-right" dir="rtl">
                                        <SelectValue placeholder="اختر المنطقة" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl" className="bg-slate-900 border-white/10 text-white max-h-60">
                                        {Object.entries(ZONE_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {volunteerErrors?.zone && (
                                    <p className="text-red-400 text-xs">{volunteerErrors.zone}</p>
                                )}
                            </div>
                        </div>



                        <div className="space-y-2">
                            <Label className="text-white/80">العنوان التفصيلي</Label>
                            <Textarea
                                name="addressText"
                                defaultValue={user.addressText || ""}
                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                            />
                            {volunteerErrors?.addressText && (
                                <p className="text-red-400 text-xs">{volunteerErrors.addressText}</p>
                            )}
                        </div>

                        {volunteerState.success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm text-center">
                                {volunteerState.success}
                            </div>
                        )}

                        {volunteerState.error && typeof volunteerState.error === 'string' && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                                {volunteerState.error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isVolunteerPending}
                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        >
                            {isVolunteerPending ? "جاري الحفظ..." : "حفظ البيانات"}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Donation History */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    سجل التبرعات ({donations.length})
                </h2>

                {donations.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 text-white/40 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">لم تقم بأي تبرعات بعد</h3>
                        <p className="text-white/60 mb-6">شارك معنا في الخير وساهم في إطعام صائم</p>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8" asChild>
                            <a href="/donate">تبرع الآن</a>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {donations.map(donation => (
                            <div key={donation.id} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 md:p-6 transition-colors hover:border-amber-500/30">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${donation.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                                            donation.status === "CANCELLED" ? "bg-red-500/20 text-red-400" :
                                                donation.status === "ASSIGNED" ? "bg-blue-500/20 text-blue-400" :
                                                    "bg-amber-500/20 text-amber-400"
                                            }`}>
                                            {donation.status === "COMPLETED" ? (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : donation.status === "CANCELLED" ? (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white text-lg">
                                                    {donation.quantity} وجبة
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs border ${donation.status === "COMPLETED" ? "border-green-500/30 bg-green-500/10 text-green-400" :
                                                    donation.status === "CANCELLED" ? "border-red-500/30 bg-red-500/10 text-red-400" :
                                                        donation.status === "ASSIGNED" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" :
                                                            "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                                    }`}>
                                                    {donation.status === "COMPLETED" ? "تم التسليم" :
                                                        donation.status === "CANCELLED" ? "ملغي" :
                                                            donation.status === "ASSIGNED" ? "جاري التوصيل" :
                                                                "في الانتظار"}
                                                </span>
                                            </div>
                                            <p className="text-white/60 text-sm mb-1">{donation.description}</p>
                                            <p className="text-white/40 text-xs">
                                                سجل بتاريخ {formatDate(donation.createdAt)} • موعد التسليم {formatDate(donation.scheduledDate)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-white/60 md:text-left">
                                        {/* We can add more details here if needed */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Logout Button */}
            <div className="flex justify-center pt-8">
                <Button
                    variant="destructive"
                    className="w-full md:w-auto px-8 py-6 text-lg rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    onClick={() => signOut({ callbackUrl: '/' })}
                >
                    تسجيل الخروج
                </Button>
            </div>
        </div>
    )
}
