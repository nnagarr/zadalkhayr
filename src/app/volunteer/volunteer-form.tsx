'use client'

import { useActionState, useState, useMemo } from "react"
import { registerAsVolunteer } from "./actions"
import { ZONE_LABELS, VEHICLE_TYPE_LABELS, GENDER_LABELS } from "@/lib/constants"

interface FormState {
    error?: string | {
        nationalId?: string[]
        vehicleType?: string[]
        addressText?: string[]
        zone?: string[]
        gender?: string[]
        dateOfBirth?: string[]
    }
}

export function VolunteerRegistrationForm() {
    const [state, formAction, isPending] = useActionState<FormState | null, FormData>(registerAsVolunteer, null)
    const [vehicleType, setVehicleType] = useState("")
    const [dateOfBirth, setDateOfBirth] = useState("")

    // Calculate age from date of birth
    const age = useMemo(() => {
        if (!dateOfBirth) return null
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--
        }
        return calculatedAge
    }, [dateOfBirth])

    const isAdult = age !== null && age >= 18

    const getFieldError = (field: keyof NonNullable<Exclude<FormState['error'], string>>) => {
        if (state?.error && typeof state.error !== 'string') {
            return state.error[field]?.[0]
        }
        return undefined
    }

    return (
        <form action={formAction} className="space-y-6">
            {/* Date of Birth - Asked first to determine if ID is needed */}
            <div className="space-y-2">
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-white/80">
                    تاريخ الميلاد <span className="text-red-400">*</span>
                </label>
                <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-800/80 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
                />
                {age !== null && (
                    <p className="text-sm text-white/60">العمر: {age} سنة</p>
                )}
                {getFieldError('dateOfBirth') && (
                    <p className="text-sm text-red-400">{getFieldError('dateOfBirth')}</p>
                )}
            </div>

            {/* National ID - Only shown if age >= 18 */}
            {isAdult && (
                <div className="space-y-2">
                    <label htmlFor="nationalId" className="block text-sm font-medium text-white/80">
                        رقم البطاقة القومية <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id="nationalId"
                            name="nationalId"
                            maxLength={14}
                            required
                            placeholder="أدخل رقم البطاقة المكون من 14 رقم"
                            className="w-full h-12 pr-12 pl-4 bg-slate-800/80 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all placeholder:text-white/40"
                            dir="ltr"
                        />
                    </div>
                    {getFieldError('nationalId') && (
                        <p className="text-sm text-red-400">{getFieldError('nationalId')}</p>
                    )}
                </div>
            )}

            {/* Vehicle Type - Visual Selection */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-white/80">
                    نوع المركبة <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setVehicleType(value)}
                            className={`p-4 rounded-xl border-2 transition-all ${vehicleType === value
                                ? "border-teal-500 bg-teal-500/10"
                                : "border-white/10 hover:border-teal-500/50 bg-white/5"
                                }`}
                        >
                            <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${vehicleType === value ? "bg-teal-500/20 text-teal-400" : "bg-white/10 text-white/60"
                                }`}>
                                {value === "CAR" && (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                                    </svg>
                                )}
                                {value === "MOTORCYCLE" && (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM5 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm14 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                                    </svg>
                                )}
                                {value === "BICYCLE" && (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5zm5.8-10l2.4 2.4-2.2 2.2c-.7.7-1.2 1.8-1.2 3v.3h-2l.1-1.2c0-.8.4-1.6 1-2.3l2.1-2.1-2.4-2.4-3.7 3.7h-2l4.8-4.8c.7-.7 1.9-.8 2.6-.1l2.2 2c.5-.3 1.1-.5 1.8-.5 1.8 0 3.2 1.4 3.2 3.2 0 1.8-1.4 3.2-3.2 3.2-1.8 0-3.2-1.4-3.2-3.2 0-.3 0-.6.1-.8l-1.4-1.4zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
                                    </svg>
                                )}
                                {value === "WALKING" && (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
                                    </svg>
                                )}
                            </div>
                            <p className={`text-sm font-medium ${vehicleType === value ? "text-white" : "text-white/70"}`}>
                                {label}
                            </p>
                        </button>
                    ))}
                </div>
                <input type="hidden" name="vehicleType" value={vehicleType} />
                {getFieldError('vehicleType') && (
                    <p className="text-sm text-red-400">{getFieldError('vehicleType')}</p>
                )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
                <label htmlFor="gender" className="block text-sm font-medium text-white/80">
                    النوع <span className="text-red-400">*</span>
                </label>
                <select
                    id="gender"
                    name="gender"
                    className="w-full h-12 px-4 bg-slate-800/80 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all cursor-pointer"
                >
                    <option value="" className="bg-slate-900">اختر النوع</option>
                    {Object.entries(GENDER_LABELS).map(([value, label]) => (
                        <option key={value} value={value} className="bg-slate-900">
                            {label}
                        </option>
                    ))}
                </select>
                {getFieldError('gender') && (
                    <p className="text-sm text-red-400">{getFieldError('gender')}</p>
                )}
            </div>

            {/* Zone */}
            <div className="space-y-2">
                <label htmlFor="zone" className="block text-sm font-medium text-white/80">
                    المنطقة <span className="text-red-400">*</span>
                </label>
                <select
                    id="zone"
                    name="zone"
                    className="w-full h-12 px-4 bg-slate-800/80 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all cursor-pointer"
                >
                    <option value="" className="bg-slate-900">اختر المنطقة</option>
                    {Object.entries(ZONE_LABELS).map(([value, label]) => (
                        <option key={value} value={value} className="bg-slate-900">
                            {label}
                        </option>
                    ))}
                </select>
                {getFieldError('zone') && (
                    <p className="text-sm text-red-400">{getFieldError('zone')}</p>
                )}
            </div>

            {/* Address */}
            <div className="space-y-2">
                <label htmlFor="addressText" className="block text-sm font-medium text-white/80">
                    العنوان التفصيلي <span className="text-red-400">*</span>
                </label>
                <textarea
                    id="addressText"
                    name="addressText"
                    rows={3}
                    placeholder="أدخل عنوانك التفصيلي (الشارع، العمارة، الشقة...)"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all resize-none placeholder:text-white/40"
                />
                {getFieldError('addressText') && (
                    <p className="text-sm text-red-400">{getFieldError('addressText')}</p>
                )}
            </div>

            {/* General Error */}
            {typeof state?.error === 'string' && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400">{state.error}</p>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isPending}
                className="w-full h-14 bg-gradient-to-l from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        جاري التسجيل...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        التسجيل كمتطوع
                    </span>
                )}
            </button>
        </form>
    )
}
