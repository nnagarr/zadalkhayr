'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

const profileSchema = z.object({
    name: z.string().min(2, "يجب أن يتكون الاسم من حرفين على الأقل"),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمة المرور غير متطابقة",
    path: ["confirmPassword"],
})

const volunteerSchema = z.object({
    vehicleType: z.enum(["CAR", "MOTORCYCLE", "BICYCLE"]),
    zone: z.string().min(1, "المنطقة مطلوبة"),
    addressText: z.string().min(5, "العنوان التفصيلي مطلوب"),
})

export type ProfileFormState = {
    error?: string | {
        name?: string[];
        currentPassword?: string[];
        newPassword?: string[];
        confirmPassword?: string[];
        vehicleType?: string[];
        zone?: string[];
        addressText?: string[];
    };
    success?: string;
}

export async function updateProfile(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
    const session = await auth()
    if (!session?.user?.id) return { error: "غير مصرح لك" }

    const validatedFields = profileSchema.safeParse({
        name: formData.get("name"),
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors }
    }

    try {
        await db.user.update({
            where: { id: session.user.id },
            data: { name: validatedFields.data.name }
        })
        revalidatePath("/profile")
        return { success: "تم تحديث الملف الشخصي بنجاح" }
    } catch (error) {
        return { error: "حدث خطأ أثناء التحديث" }
    }
}

export async function changePassword(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
    const session = await auth()
    if (!session?.user?.id) return { error: "غير مصرح لك" }

    // Rate limiting
    const rateLimitResult = checkRateLimit(session.user.id, "passwordChange", RATE_LIMITS.passwordChange);
    if (!rateLimitResult.success) {
        return { error: `تم تجاوز الحد المسموح. يرجى المحاولة بعد ${Math.ceil(rateLimitResult.resetInSeconds / 60)} دقيقة` }
    }

    const validatedFields = passwordSchema.safeParse(Object.fromEntries(formData))

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors }
    }

    const { currentPassword, newPassword } = validatedFields.data

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || !user.password) {
            return {
                error: "المستخدم غير موجود"
            }
        }

        const isValid = await bcrypt.compare(currentPassword, user.password)
        if (!isValid) {
            return { error: { currentPassword: ["كلمة المرور الحالية غير صحيحة"] } }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await db.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        })

        revalidatePath("/profile")
        return { success: "تم تغيير كلمة المرور بنجاح" }
    } catch (error) {
        return { error: "حدث خطأ أثناء تغيير كلمة المرور" }
    }
}

export async function updateVolunteerProfile(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
    const session = await auth()
    if (!session?.user?.id) return { error: "غير مصرح لك" }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    // Verify user exists but don't restrict by role
    if (!user) {
        return { error: "المستخدم غير موجود" }
    }

    const validatedFields = volunteerSchema.safeParse({
        vehicleType: formData.get("vehicleType"),
        zone: formData.get("zone"),
        addressText: formData.get("addressText"),
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors }
    }

    try {
        await db.user.update({
            where: { id: session.user.id },
            data: {
                vehicleType: validatedFields.data.vehicleType as any,
                zone: validatedFields.data.zone as any,
                addressText: validatedFields.data.addressText
            }
        })
        revalidatePath("/profile")
        return { success: "تم تحديث البيانات بنجاح" }
    } catch (error) {
        return { error: "حدث خطأ أثناء تحديث بيانات التطوع" }
    }
}
