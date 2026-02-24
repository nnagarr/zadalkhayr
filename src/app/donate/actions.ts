"use server";

import { db } from "@/lib/db";
import { Zone, DeliveryMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ZONE_LABELS } from "@/lib/constants";

// Max lengths for text fields (security)
const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 500;

// Time boundaries (Egypt time)
const OPEN_TODAY_START_HOUR = 5;    // 5:05 AM
const OPEN_TODAY_START_MINUTE = 5;
const CUTOFF_START_HOUR = 15;       // 3:00 PM
const CUTOFF_START_MINUTE = 0;

export type DonationFormState = {
    success: boolean;
    error?: string;
    fieldErrors?: {
        donorName?: string;
        donorPhone?: string;
        zone?: string;
        addressText?: string;
        description?: string;
        quantity?: string;
        deliveryMethod?: string;
    };
};

// Validate Egyptian phone number
function validateEgyptianPhone(phone: string): boolean {
    // Egyptian mobile numbers: 010, 011, 012, 015 followed by 8 digits
    const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
    return egyptianPhoneRegex.test(phone.replace(/\s/g, ""));
}

// Calculate the scheduled date based on current time
// 5:05 AM - 3:00 PM: Today
// 3:00 PM - 5:05 AM (next day): Tomorrow
function getScheduledDate(): { date: Date; isForTomorrow: boolean } {
    const now = new Date();
    // Get Egypt time (UTC+2)
    const egyptTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
    const currentHour = egyptTime.getHours();
    const currentMinute = egyptTime.getMinutes();

    // Convert to minutes for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const openTodayStartInMinutes = OPEN_TODAY_START_HOUR * 60 + OPEN_TODAY_START_MINUTE; // 5:05 AM = 305
    const cutoffStartInMinutes = CUTOFF_START_HOUR * 60 + CUTOFF_START_MINUTE; // 3:00 PM = 900

    // Open for today only between 5:05 AM and 3:00 PM
    const isOpenForToday = currentTimeInMinutes >= openTodayStartInMinutes && currentTimeInMinutes < cutoffStartInMinutes;
    const isForTomorrow = !isOpenForToday;

    // Create the scheduled date (start of day in Egypt timezone)
    const scheduledDate = new Date(egyptTime);
    scheduledDate.setHours(0, 0, 0, 0);

    if (isForTomorrow) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return { date: scheduledDate, isForTomorrow };
}

export async function submitDonation(
    prevState: DonationFormState,
    formData: FormData
): Promise<DonationFormState> {
    // Extract form data
    const donorName = formData.get("donorName") as string;
    const donorPhone = formData.get("donorPhone") as string;
    const zone = formData.get("zone") as Zone;
    const addressText = formData.get("addressText") as string;
    const description = formData.get("description") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 1;
    const deliveryMethod = formData.get("deliveryMethod") as DeliveryMethod;

    // Validation
    const fieldErrors: DonationFormState["fieldErrors"] = {};

    if (!donorName || donorName.trim().length < 2) {
        fieldErrors.donorName = "يرجى إدخال اسمك (على الأقل حرفين)";
    } else if (donorName.length > MAX_NAME_LENGTH) {
        fieldErrors.donorName = `الاسم طويل جداً (الحد الأقصى ${MAX_NAME_LENGTH} حرف)`;
    }

    if (!donorPhone) {
        fieldErrors.donorPhone = "يرجى إدخال رقم الهاتف";
    } else if (!validateEgyptianPhone(donorPhone)) {
        fieldErrors.donorPhone = "يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)";
    } else {
        // Check if phone is blocked
        const normalizedPhone = donorPhone.replace(/\s/g, "");
        const blockedPhone = await db.blockedPhone.findUnique({
            where: { phone: normalizedPhone }
        });
        if (blockedPhone) {
            return {
                success: false,
                error: "عذراً، هذا الرقم محظور من استخدام النظام.",
                fieldErrors: {
                    donorPhone: "تم حظر هذا الرقم من التبرع. يرجى التواصل مع الإدارة للمراجعة."
                }
            };
        }
    }

    // Zone and Address are only required for PICKUP
    if (deliveryMethod === "PICKUP") {
        if (!zone || !Object.keys(ZONE_LABELS).includes(zone)) {
            fieldErrors.zone = "يرجى اختيار المنطقة";
        }

        if (!addressText || addressText.trim().length < 10) {
            fieldErrors.addressText = "يرجى إدخال العنوان بالتفصيل (على الأقل 10 أحرف)";
        } else if (addressText.length > MAX_ADDRESS_LENGTH) {
            fieldErrors.addressText = `العنوان طويل جداً (الحد الأقصى ${MAX_ADDRESS_LENGTH} حرف)`;
        }
    }

    if (!description || description.trim().length < 5) {
        fieldErrors.description = "يرجى وصف الطعام (على الأقل 5 أحرف)";
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
        fieldErrors.description = `الوصف طويل جداً (الحد الأقصى ${MAX_DESCRIPTION_LENGTH} حرف)`;
    }

    if (quantity < 1 || quantity > 100) {
        fieldErrors.quantity = "الكمية يجب أن تكون بين 1 و 100";
    }

    if (!deliveryMethod || !['SELF_DELIVERY', 'PICKUP'].includes(deliveryMethod)) {
        fieldErrors.deliveryMethod = "يرجى اختيار طريقة التوصيل";
    }

    // Return errors if any
    if (Object.keys(fieldErrors).length > 0) {
        return {
            success: false,
            fieldErrors,
        };
    }

    // Calculate scheduled date
    const { date: scheduledDate, isForTomorrow } = getScheduledDate();

    try {
        // Create donation in database
        await db.donation.create({
            data: {
                donorName: donorName.trim(),
                donorPhone: donorPhone.replace(/\s/g, ""),
                zone: deliveryMethod === "PICKUP" ? zone : null,
                addressText: deliveryMethod === "PICKUP" ? addressText?.trim() : null,
                description: description.trim(),
                quantity,
                deliveryMethod,
                scheduledDate,
            },
        });

        // Revalidate admin dashboard
        revalidatePath("/admin");

    } catch (error) {
        console.error("Error creating donation:", error);
        return {
            success: false,
            error: "حدث خطأ أثناء إرسال التبرع. يرجى المحاولة مرة أخرى.",
        };
    }

    // Redirect to success page with delivery method and tomorrow flag
    redirect(`/success?method=${deliveryMethod}&tomorrow=${isForTomorrow}`);
}
