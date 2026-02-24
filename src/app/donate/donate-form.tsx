"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { submitDonation, DonationFormState } from "./actions";
import { ZONE_LABELS } from "@/lib/constants";
import Link from "next/link";

const initialState: DonationFormState = {
    success: false,
};

interface DonateFormProps {
    initialName?: string;
    initialPhone?: string;
    isClosed?: boolean;
    isAfterIftar?: boolean;
}

// Validate Egyptian phone number (must match server-side validation)
function isValidEgyptianPhone(phone: string): boolean {
    const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
    return egyptianPhoneRegex.test(phone.replace(/\s/g, ""));
}

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => (
                <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${i + 1 === currentStep
                        ? "w-8 bg-amber-500"
                        : i + 1 < currentStep
                            ? "w-2 bg-amber-500/50"
                            : "w-2 bg-white/20"
                        }`}
                />
            ))}
        </div>
    );
}

export function DonateForm({
    initialName = "",
    initialPhone = "",
    isClosed = false,
    isAfterIftar = false
}: DonateFormProps) {
    const [state, formAction, isPending] = useActionState(submitDonation, initialState);
    const [step, setStep] = useState(1);
    const [quantity, setQuantity] = useState(1);
    const [donorName, setDonorName] = useState(initialName);
    const [donorPhone, setDonorPhone] = useState(initialPhone);
    const [zone, setZone] = useState("");
    const [addressText, setAddressText] = useState("");

    // Client-side validation errors (shown immediately, before server round-trip)
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    // Fixed description since only full meals are supported
    const description = "وجبة كاملة";

    const needsAddress = true; // Always pickup

    // Validation for step navigation — must match server-side rules
    const nameValid = donorName.trim().length >= 2;
    const phoneValid = donorPhone.trim().length > 0 && isValidEgyptianPhone(donorPhone);
    const zoneValid = zone.length > 0;
    const addressValid = addressText.trim().length >= 10;
    const canProceedToStep2 = nameValid && phoneValid && zoneValid && addressValid;
    // Always can submit if step 1 is valid (quantity has default 1)
    const canSubmit = true;

    // If server returns field errors for step 1 while user is on step 2, go back to step 1
    useEffect(() => {
        if (step === 2 && state.fieldErrors) {
            const step1Errors = state.fieldErrors.donorName || state.fieldErrors.donorPhone || state.fieldErrors.zone || state.fieldErrors.addressText;
            if (step1Errors) {
                setStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [state, step]);

    const validateStep1 = (): boolean => {
        const errors: Record<string, string> = {};

        if (!donorName || donorName.trim().length < 2) {
            errors.donorName = "يرجى إدخال اسمك (على الأقل حرفين)";
        }
        if (!donorPhone) {
            errors.donorPhone = "يرجى إدخال رقم الهاتف";
        } else if (!isValidEgyptianPhone(donorPhone)) {
            errors.donorPhone = "يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)";
        }
        if (!zone) {
            errors.zone = "يرجى اختيار المنطقة";
        }
        if (!addressText || addressText.trim().length < 10) {
            errors.addressText = "يرجى إدخال العنوان بالتفصيل (على الأقل 10 أحرف)";
        }

        setClientErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) {
            setClientErrors({});
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 -mt-16 md:-mt-20 pt-16 md:pt-20">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto max-w-xl px-4 py-12 relative">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <span className="text-white/60 hover:text-white transition-colors text-sm">
                            ← العودة للرئيسية
                        </span>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        تبرع <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">بالطعام</span>
                    </h1>
                    <p className="text-white/60">
                        ساهم في إطعام المحتاجين في رمضان - متطوعونا يصلون لبابك
                    </p>
                </div>

                {/* Time Status Badge */}
                {isClosed ? (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                            <div className="text-center">
                                <p className="font-bold text-amber-400">التبرع لإفطار اليوم مغلق</p>
                                <p className="text-sm text-white/60 mt-1">
                                    تبرعك سيُسجل لإفطار <span className="text-amber-400 font-medium">الغد</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : isAfterIftar ? (
                    <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse" />
                            <div className="text-center">
                                <p className="font-bold text-teal-400">التبرع مفتوح لإفطار الغد</p>
                                <p className="text-sm text-white/60 mt-1">تبرعك سيصل للمحتاجين غداً إن شاء الله</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                            <div className="text-center">
                                <p className="font-bold text-green-400">التبرع مفتوح لإفطار اليوم</p>
                                <p className="text-sm text-white/60 mt-1">تبرعك سيصل للمحتاجين اليوم إن شاء الله</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 md:p-8">
                    {/* Step Indicator */}
                    <StepIndicator currentStep={step} totalSteps={2} />

                    {/* Error Message */}
                    {state.error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center text-sm flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {state.error}
                        </div>
                    )}

                    <form action={formAction}>
                        {/* Hidden Fields */}
                        <input type="hidden" name="donorName" value={donorName} />
                        <input type="hidden" name="donorPhone" value={donorPhone} />
                        <input type="hidden" name="deliveryMethod" value="PICKUP" />
                        <input type="hidden" name="zone" value={zone} />
                        <input type="hidden" name="addressText" value={addressText} />
                        <input type="hidden" name="description" value={description} />
                        <input type="hidden" name="quantity" value={quantity} />

                        {/* Step 1: Personal Info & Address */}
                        <div className={step === 1 ? "block" : "hidden"}>
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm">1</span>
                                بياناتك وعنوان الاستلام
                            </h2>

                            <div className="space-y-5">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white/80">الاسم *</label>
                                    <div className="relative">
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <Input
                                            value={donorName}
                                            onChange={(e) => setDonorName(e.target.value)}
                                            placeholder="اسمك الكريم"
                                            className="h-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 rounded-xl"
                                        />
                                    </div>
                                    {(clientErrors.donorName || state.fieldErrors?.donorName) && (
                                        <p className="text-red-400 text-xs">{clientErrors.donorName || state.fieldErrors?.donorName}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white/80">رقم الهاتف *</label>
                                    <div className="relative">
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <Input
                                            value={donorPhone}
                                            onChange={(e) => setDonorPhone(e.target.value)}
                                            placeholder="01xxxxxxxxx"
                                            dir="ltr"
                                            className="h-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 rounded-xl text-left"
                                        />
                                    </div>
                                    {(clientErrors.donorPhone || state.fieldErrors?.donorPhone) && (
                                        <p className="text-red-400 text-xs">{clientErrors.donorPhone || state.fieldErrors?.donorPhone}</p>
                                    )}
                                </div>

                                <div className="h-px bg-white/10 my-4" />

                                {/* Zone Select */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white/80">المنطقة *</label>
                                    <Select value={zone} onValueChange={setZone}>
                                        <SelectTrigger className="h-12 bg-slate-800/80 border-white/20 text-white rounded-xl hover:border-amber-500/50 hover:bg-slate-800 transition-all focus:ring-amber-500/30 focus:border-amber-500/50 data-[placeholder]:text-white">
                                            <SelectValue placeholder="اختر منطقتك" className="text-white" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                                            {Object.entries(ZONE_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value} className="text-white hover:bg-amber-500/20 focus:bg-amber-500/20 cursor-pointer">
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {(clientErrors.zone || state.fieldErrors?.zone) && (
                                        <p className="text-red-400 text-xs">{clientErrors.zone || state.fieldErrors?.zone}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white/80">العنوان بالتفصيل *</label>
                                    <Textarea
                                        value={addressText}
                                        onChange={(e) => setAddressText(e.target.value)}
                                        placeholder="اسم الشارع، رقم العمارة، علامة مميزة..."
                                        rows={3}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 rounded-xl resize-none"
                                    />
                                    {(clientErrors.addressText || state.fieldErrors?.addressText) && (
                                        <p className="text-red-400 text-xs">{clientErrors.addressText || state.fieldErrors?.addressText}</p>
                                    )}
                                </div>
                            </div>

                            {/* Next Button */}
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!canProceedToStep2}
                                className="w-full h-12 mt-8 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-xl disabled:opacity-50"
                            >
                                التالي
                            </Button>
                        </div>

                        {/* Step 2: Food Details */}
                        <div className={step === 2 ? "block" : "hidden"}>
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm">2</span>
                                تفاصيل الطعام
                            </h2>

                            <div className="space-y-8">
                                {/* Quantity */}
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-white">كم عدد الوجبات؟</h3>
                                        <p className="text-white/60 text-sm mt-1">وجبة كاملة لإفطار صائم</p>
                                    </div>

                                    <div className="flex items-center justify-center gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-14 h-14 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 text-2xl"
                                        >
                                            −
                                        </Button>
                                        <div className="w-24 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                                            <span className="text-3xl font-bold text-amber-400">{quantity}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(Math.min(100, quantity + 1))}
                                            className="w-14 h-14 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 text-2xl"
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>

                                {state.fieldErrors?.description && (
                                    <p className="text-red-400 text-xs text-center">{state.fieldErrors.description}</p>
                                )}

                                {/* Summary */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 text-sm">
                                    <h4 className="font-bold text-white/80 border-b border-white/5 pb-2 mb-2">ملخص التبرع</h4>
                                    <div className="flex justify-between text-white/60">
                                        <span>الاسم</span>
                                        <span className="text-white">{donorName}</span>
                                    </div>
                                    <div className="flex justify-between text-white/60">
                                        <span>الهاتف</span>
                                        <span className="text-white" dir="ltr">{donorPhone}</span>
                                    </div>
                                    {needsAddress && zone && (
                                        <div className="flex justify-between text-white/60">
                                            <span>المنطقة</span>
                                            <span className="text-white">{ZONE_LABELS[zone as keyof typeof ZONE_LABELS]}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-amber-400/80 font-medium pt-2 border-t border-white/5">
                                        <span>إجمالي الوجبات</span>
                                        <span className="text-amber-400">{quantity} وجبة</span>
                                    </div>
                                </div>
                            </div>      {/* Navigation Buttons */}
                            <div className="flex gap-3 mt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    className="h-12 px-6 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
                                >
                                    السابق
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isPending || !canSubmit}
                                    className="flex-1 h-12 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold text-lg rounded-xl shadow-lg shadow-amber-500/25 disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            جاري الإرسال...
                                        </span>
                                    ) : (
                                        "إرسال التبرع"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Privacy Note */}
                    <p className="mt-6 text-center text-xs text-white/40">
                        بياناتك آمنة ولن يتم مشاركتها مع أي جهة خارجية
                    </p>
                </div>
            </div>
        </div>
    );
}

