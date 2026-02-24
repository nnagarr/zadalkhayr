import { Zone, VehicleType, Gender } from "@prisma/client";

// Vehicle type labels in Arabic
export const VEHICLE_TYPE_LABELS: Partial<Record<VehicleType, string>> = {
    CAR: "سيارة",
    MOTORCYCLE: "موتوسيكل",
    BICYCLE: "دراجة",
};

// Gender labels in Arabic
export const GENDER_LABELS: Record<Gender, string> = {
    MALE: "ذكر",
    FEMALE: "أنثى",
};

// Zone labels in Arabic
export const ZONE_LABELS: Record<Zone, string> = {
    // المناطق السكنية (1-36)
    RESIDENTIAL_1: "المنطقة السكنية الأولى",
    RESIDENTIAL_2: "المنطقة السكنية الثانية",
    RESIDENTIAL_3: "المنطقة السكنية الثالثة",
    RESIDENTIAL_4: "المنطقة السكنية الرابعة",
    RESIDENTIAL_5: "المنطقة السكنية الخامسة",
    RESIDENTIAL_6: "المنطقة السكنية السادسة",
    RESIDENTIAL_7: "المنطقة السكنية السابعة",
    RESIDENTIAL_8: "المنطقة السكنية الثامنة",
    RESIDENTIAL_9: "المنطقة السكنية التاسعة",
    RESIDENTIAL_10: "المنطقة السكنية العاشرة",
    RESIDENTIAL_11: "المنطقة السكنية الحادية عشرة",
    RESIDENTIAL_12: "المنطقة السكنية الثانية عشرة",
    RESIDENTIAL_13: "المنطقة السكنية الثالثة عشرة",
    RESIDENTIAL_14: "المنطقة السكنية الرابعة عشرة",
    RESIDENTIAL_15: "المنطقة السكنية الخامسة عشرة",
    RESIDENTIAL_16: "المنطقة السكنية السادسة عشرة",
    RESIDENTIAL_17: "المنطقة السكنية السابعة عشرة",
    RESIDENTIAL_18: "المنطقة السكنية الثامنة عشرة",
    RESIDENTIAL_19: "المنطقة السكنية التاسعة عشرة",
    RESIDENTIAL_20: "المنطقة السكنية العشرون",
    RESIDENTIAL_21: "المنطقة السكنية الحادية والعشرون",
    RESIDENTIAL_22: "المنطقة السكنية الثانية والعشرون",
    RESIDENTIAL_23: "المنطقة السكنية الثالثة والعشرون",
    RESIDENTIAL_24: "المنطقة السكنية الرابعة والعشرون",
    RESIDENTIAL_25: "المنطقة السكنية الخامسة والعشرون",
    RESIDENTIAL_26: "المنطقة السكنية السادسة والعشرون",
    RESIDENTIAL_27: "المنطقة السكنية السابعة والعشرون",
    RESIDENTIAL_28: "المنطقة السكنية الثامنة والعشرون",
    RESIDENTIAL_29: "المنطقة السكنية التاسعة والعشرون",
    RESIDENTIAL_30: "المنطقة السكنية الثلاثون",
    RESIDENTIAL_31: "المنطقة السكنية الحادية والثلاثون",
    RESIDENTIAL_32: "المنطقة السكنية الثانية والثلاثون",
    RESIDENTIAL_33: "المنطقة السكنية الثالثة والثلاثون",
    RESIDENTIAL_34: "المنطقة السكنية الرابعة والثلاثون",
    RESIDENTIAL_35: "المنطقة السكنية الخامسة والثلاثون",
    RESIDENTIAL_36: "المنطقة السكنية السادسة والثلاثون",

    // مناطق ابن بيتك
    IBN_BAYTIK_1: "المنطقة الأولى: ابن بيتك",
    IBN_BAYTIK_2: "المنطقة الثانية: ابن بيتك",
    IBN_BAYTIK_3: "المنطقة الثالثة: ابن بيتك",

    // المجمعات والمناطق الخاصة
    DAR_MISR: "مجمع دار مصر السكني",
    PARAMETER: "منطقة الباراميتر",
    ALFI_FADDAN: "منطقة الألفين فدان",
    QURTUBA: "مساكن قرطبة",
    AWQAF: "مساكن الأوقاف",

    // الأحياء
    HAY_ZAYTOUN: "حي الزيتون",
    HAY_NAKHIL: "حي النخيل",
    HAY_FERDOUS: "حي الفردوس",
    HAY_RAWDA: "حي الروضة",
    HAY_RAYHAN: "حي الريحان",

    // بيت الوطن
    BEIT_WATAN_3: "بيت الوطن – المنطقة الثالثة",
    BEIT_WATAN_13: "بيت الوطن – المنطقة الثالثة عشرة",
};

import { DonationStatus } from "@prisma/client";

export const STATUS_LABELS: Record<DonationStatus, string> = {
    PENDING: "قيد الانتظار",
    ASSIGNED: "تم التعيين",
    COLLECTED: "تم الاستلام",
    OUT_FOR_DELIVERY: "في الطريق",
    COMPLETED: "تم التسليم",
    CANCELLED: "ملغي"
};

export const STATUS_COLORS: Record<DonationStatus, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    ASSIGNED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    COLLECTED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    OUT_FOR_DELIVERY: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30"
};

export const DELIVERY_LABELS: Record<string, string> = {
    SELF_DELIVERY: "توصيل شخصي",
    PICKUP: "يحتاج متطوع"
};
