'use client'

import { useActionState, useState, forwardRef, ReactNode } from "react"
import { login } from "@/lib/auth-actions"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================
// ICONS
// ============================================

function LoadingSpinner() {
    return (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}

function PhoneIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    )
}

function LockIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    )
}

function EyeIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    )
}

function EyeOffIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    )
}

// ============================================
// AUTH INPUT
// ============================================

const authInputBaseStyles = "h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl"

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: ReactNode
    rightElement?: ReactNode
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
    ({ icon, rightElement, className, ...props }, ref) => {
        return (
            <div className="relative">
                {icon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                        {icon}
                    </div>
                )}
                <Input
                    ref={ref}
                    className={cn(
                        authInputBaseStyles,
                        icon && "pr-12",
                        rightElement && "pl-12",
                        !icon && "pr-4",
                        !rightElement && "pl-4",
                        className
                    )}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
        )
    }
)
AuthInput.displayName = "AuthInput"

// ============================================
// FORM ERROR
// ============================================

function FormError({ error }: { error?: string | null }) {
    if (!error) return null
    return (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center flex items-center justify-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
        </div>
    )
}

// ============================================
// PAGE
// ============================================

export default function LoginPage() {
    const [state, action, isPending] = useActionState(login, undefined)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="min-h-screen bg-slate-950 flex -mt-16 md:-mt-20 pt-16 md:pt-20">
            {/* Left Side - Decorative Panel (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/bgs/bg1.png"
                        alt=""
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-amber-900/50" />
                </div>

                {/* Decorative Content */}
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
                    {/* Logo */}
                    <Link href="/" className="mb-8 group">
                        <div className="relative w-24 h-24 transition-transform duration-300 group-hover:scale-110">
                            <Image
                                src="/logo/logo.png"
                                alt="زاد الخير"
                                fill
                                className="object-contain drop-shadow-2xl"
                            />
                        </div>
                    </Link>

                    {/* Brand Name */}
                    <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">
                        زاد الخير
                    </h1>

                    {/* Tagline */}
                    <p className="text-xl text-white/80 mb-8 max-w-md">
                        مساهمتك هي إفطارهم
                    </p>

                    {/* Features List */}
                    <div className="space-y-4 text-right max-w-sm">
                        {[
                            { icon: "🍽️", text: "تبرع بالطعام للمحتاجين" },
                            { icon: "🤝", text: "انضم لفريق التطوع" },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-white/90 font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-20 right-20 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-32 left-16 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl" />
                </div>
            </div>

            {/* Right Side - Form Panel */}
            <div className="w-full lg:w-1/2 flex flex-col">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-center gap-3 p-6 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <Image
                                src="/logo/logo.png"
                                alt="زاد الخير"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">
                            زاد الخير
                        </span>
                    </Link>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
                    <div className="w-full max-w-md">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">مرحباً بعودتك</h2>
                            <p className="text-white/60">سجل الدخول إلى حسابك للمتابعة</p>
                        </div>

                        {/* Form */}
                        <form action={action} className="space-y-6">
                            {/* Phone Input */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-medium text-white/80">
                                    رقم الهاتف
                                </label>
                                <AuthInput
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="010xxxxxxxx"
                                    required
                                    dir="ltr"
                                    className="text-left"
                                    icon={<PhoneIcon />}
                                />
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-medium text-white/80">
                                        كلمة المرور
                                    </label>
                                    <Link
                                        href="#"
                                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                                    >
                                        نسيت كلمة المرور؟
                                    </Link>
                                </div>
                                <AuthInput
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    dir="ltr"
                                    icon={<LockIcon />}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-white/40 hover:text-white/60 transition-colors"
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    }
                                />
                            </div>

                            {/* Error Message */}
                            <FormError error={state?.error} />

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold text-lg rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <LoadingSpinner />
                                        جاري تسجيل الدخول...
                                    </span>
                                ) : (
                                    "تسجيل الدخول"
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-slate-950 text-white/40">أو</span>
                                </div>
                            </div>

                            {/* Signup Link */}
                            <div className="text-center">
                                <p className="text-white/60">
                                    ليس لديك حساب؟{" "}
                                    <Link
                                        href="/signup"
                                        className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
                                    >
                                        إنشاء حساب جديد
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 text-center text-white/40 text-sm border-t border-white/10">
                    <p>© {new Date().getFullYear()} زاد الخير - جميع الحقوق محفوظة</p>
                </div>
            </div>
        </div>
    )
}
