"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { DonationStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

// Max lengths for text fields (security)
const MAX_REASON_LENGTH = 300;
const MAX_LOCATION_LENGTH = 200;

// Verify volunteer helper
async function verifyVolunteer() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, name: true, phone: true, zone: true }
    })

    if (!dbUser || (dbUser.role !== "VOLUNTEER" && dbUser.role !== "ADMIN")) {
        throw new Error("Unauthorized")
    }

    // Check if blocked
    if (dbUser.phone) {
        const blocked = await db.blockedPhone.findUnique({
            where: { phone: dbUser.phone.replace(/\s/g, "") }
        })
        if (blocked) {
            throw new Error("Account is blocked")
        }
    }

    return { session, user: dbUser }
}

// Assign donation to self
export async function assignDonationToSelf(donationId: string) {
    const { user } = await verifyVolunteer()

    // Check current active assignments count
    const activeCount = await db.donation.count({
        where: {
            volunteerId: user.id,
            status: {
                in: ["ASSIGNED", "COLLECTED", "OUT_FOR_DELIVERY"]
            }
        }
    })

    if (activeCount >= 5) {
        return { success: false, error: "لا يمكنك استلام أكثر من 5 طلبات نشطة في نفس الوقت" }
    }

    // Check if donation is available for claiming
    const donation = await db.donation.findUnique({
        where: { id: donationId }
    })

    if (!donation) {
        return { success: false, error: "الطلب غير موجود" }
    }

    // Only PENDING can be claimed
    // Also verify no one else has claimed it (race condition prevention)
    if (donation.volunteerId && donation.volunteerId !== user.id) {
        return { success: false, error: "عذراً، هذا الطلب مع متطوع آخر" }
    }

    if (donation.status !== "PENDING") {
        return { success: false, error: "هذا الطلب غير متاح للاستلام حالياً" }
    }

    // Volunteer claims for pickup from donor
    await db.donation.update({
        where: {
            id: donationId,
            volunteerId: null  // Double-check at DB level for race condition
        },
        data: {
            volunteerId: user.id,
            status: "ASSIGNED"
        }
    })

    revalidatePath("/volunteer/dashboard")
    revalidatePath("/admin")
    return { success: true }
}

// Release donation - volunteer can't complete (car broke down, etc.)
export async function releaseDonation(donationId: string) {
    const { user } = await verifyVolunteer()

    const donation = await db.donation.findUnique({
        where: { id: donationId }
    })

    if (!donation) {
        return { success: false, error: "الطلب غير موجود" }
    }

    // Verify ownership
    if (donation.volunteerId !== user.id && user.role !== "ADMIN") {
        return { success: false, error: "ليست لديك صلاحية تعديل هذا الطلب" }
    }

    // Reset to PENDING so another volunteer can pick it up
    const resetStatus = "PENDING"

    // Release the donation
    await db.donation.update({
        where: { id: donationId },
        data: {
            volunteerId: null,
            status: resetStatus
        }
    })

    revalidatePath("/volunteer/dashboard")
    revalidatePath("/admin")
    return { success: true }
}

// Helper to assign a beneficiary to a donation
async function assignBeneficiary(donationId: string, volunteerZone: string | null) {
    // 1. Check if already assigned
    const donation = await db.donation.findUnique({
        where: { id: donationId },
        select: { beneficiaryId: true }
    })

    if (donation?.beneficiaryId) return // Already assigned

    // 2. Get today's start and end to check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 3. Find available beneficiaries
    // Criteria:
    // - Active
    // - Not received donation today
    // - Prefer same zone, but fallback to any

    // Get all active beneficiaries who haven't received donation today
    // Since Prisma doesn't support complex NOT EXISTS subqueries easily in findMany with includes,
    // we'll fetch candidates and filter. For scale, we'd use raw query or better schema.
    // Given the "4 poor" comment, it's small scale now.

    // Find IDs of beneficiaries who got donation today
    const busyBeneficiaries = await db.donation.findMany({
        where: {
            scheduledDate: {
                gte: today
            },
            beneficiaryId: { not: null }
        },
        select: { beneficiaryId: true }
    })

    const busyIds = busyBeneficiaries.map(d => d.beneficiaryId).filter(id => id !== null) as string[]

    // Find candidates
    let candidates = await db.beneficiary.findMany({
        where: {
            isActive: true,
            id: { notIn: busyIds }
        }
    })

    if (candidates.length === 0) {
        // No one available today (everyone took one).
        // Since user said "next day he can take again", and we filtered by today,
        // this means we legitimately have no one.
        // Option: Allow second donation? User said "one donation per beneficiary per day".
        // So we strictly return null/cannot assign.
        return
    }

    // 4. Filter by zone if possible
    let zoneCandidates = candidates
    if (volunteerZone) {
        const sameZone = candidates.filter(b => b.zone === volunteerZone)
        if (sameZone.length > 0) {
            zoneCandidates = sameZone
        }
        // If no same zone, we stick with all candidates (fallback)
    }

    // 5. Pick Randomly
    const randomIndex = Math.floor(Math.random() * zoneCandidates.length)
    const selectedBeneficiary = zoneCandidates[randomIndex]

    // 6. Assign
    await db.donation.update({
        where: { id: donationId },
        data: { beneficiaryId: selectedBeneficiary.id }
    })
}

// Update donation status
export async function updateDonationStatus(donationId: string, newStatus: DonationStatus) {
    const { user } = await verifyVolunteer()

    const donation = await db.donation.findUnique({
        where: { id: donationId }
    })

    if (!donation) {
        return { success: false, error: "الطلب غير موجود" }
    }

    // Verify ownership (unless Admin)
    if (donation.volunteerId !== user.id && user.role !== "ADMIN") {
        return { success: false, error: "ليست لديك صلاحية تعديل هذا الطلب" }
    }

    // Special handling: When completing order, save who delivered it and free the volunteer
    if (newStatus === "COMPLETED") {
        await db.donation.update({
            where: { id: donationId },
            data: {
                status: newStatus,
                deliveredByName: user.name,  // Save who delivered it
                volunteerId: null  // Free the volunteer!
            }
        })
    }
    else {
        // Normal status update
        await db.donation.update({
            where: { id: donationId },
            data: {
                status: newStatus
            }
        })

        // Auto-assign beneficiary if collected and not assigned
        if (newStatus === "COLLECTED" || newStatus === "OUT_FOR_DELIVERY") {
            await assignBeneficiary(donationId, user.zone || null)
        }
    }

    revalidatePath("/volunteer/dashboard")
    revalidatePath("/admin")
    return { success: true }
}

import { z } from "zod"
import { VehicleType, Gender, Zone } from "@prisma/client"

// Schema for registration - nationalId is optional, but will be validated server-side based on age
const registrationSchema = z.object({
    nationalId: z.string().optional(),
    vehicleType: z.enum(["CAR", "MOTORCYCLE", "BICYCLE"]),
    addressText: z.string().min(5, "العنوان يجب أن يكون مفصلاً"),
    zone: z.enum(Object.keys(Zone) as [string, ...string[]]), // This might need clearer typing or just string if easier, but let's try strict enum
    gender: z.enum(["MALE", "FEMALE"]),
    dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "تاريخ ميلاد غير صحيح",
    }),
})

// Helper to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--
    }
    return age
}

// Register as volunteer
export async function registerAsVolunteer(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "غير مصرح" }
    }

    try {
        // Verify the user still exists in the database
        const existingUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
        })

        if (!existingUser) {
            return { error: "الحساب غير موجود. يرجى تسجيل الخروج وإنشاء حساب جديد." }
        }

        const rawData = {
            nationalId: formData.get("nationalId") || undefined,
            vehicleType: formData.get("vehicleType"),
            addressText: formData.get("addressText"),
            zone: formData.get("zone"),
            gender: formData.get("gender"),
            dateOfBirth: formData.get("dateOfBirth"),
        }

        const validatedData = registrationSchema.parse(rawData)

        // Calculate age to determine if nationalId is required
        const birthDate = new Date(validatedData.dateOfBirth)
        const age = calculateAge(birthDate)

        // If user is 18 or older, nationalId is required
        if (age >= 18) {
            if (!validatedData.nationalId || validatedData.nationalId.length !== 14) {
                return { error: { nationalId: ["الرقم القومي يجب أن يكون 14 رقم للبالغين (18 سنة فأكبر)"] } }
            }
        }

        // Update user
        await db.user.update({
            where: { id: session.user.id },
            data: {
                nationalId: age >= 18 ? validatedData.nationalId : null,
                vehicleType: validatedData.vehicleType as VehicleType,
                addressText: validatedData.addressText,
                zone: validatedData.zone as Zone,
                gender: validatedData.gender as Gender,
                dateOfBirth: birthDate,
                role: "PENDING_VOLUNTEER"
            }
        })

        revalidatePath("/volunteer")
        return { error: undefined }

    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return { error: e.issues[0].message }
        }
        // Handle Prisma unique constraint violation (e.g. duplicate nationalId)
        if (e?.code === "P2002") {
            return { error: "الرقم القومي مسجل بالفعل لمستخدم آخر" }
        }
        return { error: "حدث خطأ غير متوقع" }
    }
}

// ================== HELP REQUEST ACTIONS ==================

// Create a help request
export async function createHelpRequest(reason: string, location: string, donationId?: string) {
    const { user } = await verifyVolunteer()

    // Rate limiting
    const rateLimitResult = checkRateLimit(user.id, "helpRequest", RATE_LIMITS.helpRequest);
    if (!rateLimitResult.success) {
        return { success: false, error: `تم تجاوز الحد المسموح. يرجى المحاولة بعد ${Math.ceil(rateLimitResult.resetInSeconds / 60)} دقيقة` }
    }

    // Input validation
    if (!reason || reason.trim().length < 5) {
        return { success: false, error: "يرجى إدخال سبب طلب المساعدة (على الأقل 5 أحرف)" }
    }
    if (reason.length > MAX_REASON_LENGTH) {
        return { success: false, error: `سبب طلب المساعدة طويل جداً (الحد الأقصى ${MAX_REASON_LENGTH} حرف)` }
    }
    if (!location || location.trim().length < 5) {
        return { success: false, error: "يرجى إدخال الموقع (على الأقل 5 أحرف)" }
    }
    if (location.length > MAX_LOCATION_LENGTH) {
        return { success: false, error: `الموقع طويل جداً (الحد الأقصى ${MAX_LOCATION_LENGTH} حرف)` }
    }

    // Check if user already has a pending help request
    const existingRequest = await db.helpRequest.findFirst({
        where: {
            requesterId: user.id,
            status: "PENDING"
        }
    })

    if (existingRequest) {
        return { success: false, error: "لديك طلب مساعدة نشط بالفعل" }
    }

    // Create new help request
    await db.helpRequest.create({
        data: {
            requesterId: user.id,
            reason: reason.trim(),
            location: location.trim(),
            donationId: donationId || null
        }
    })

    revalidatePath("/volunteer/dashboard")
    return { success: true }
}

// Get all pending help requests (for other volunteers to see)
export async function getActiveHelpRequests() {
    const { user } = await verifyVolunteer()

    const requests = await db.helpRequest.findMany({
        where: {
            status: {
                in: ["PENDING", "ACCEPTED"]
            }
        },
        include: {
            requester: {
                select: { id: true, name: true, phone: true }
            },
            helper: {
                select: { id: true, name: true, phone: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return requests
}

// Accept a help request
export async function acceptHelpRequest(requestId: string) {
    const { user } = await verifyVolunteer()

    const request = await db.helpRequest.findUnique({
        where: { id: requestId }
    })

    if (!request) {
        return { success: false, error: "طلب المساعدة غير موجود" }
    }

    if (request.status !== "PENDING") {
        return { success: false, error: "تم قبول هذا الطلب بالفعل" }
    }

    if (request.requesterId === user.id) {
        return { success: false, error: "لا يمكنك قبول طلبك الخاص" }
    }

    await db.helpRequest.update({
        where: { id: requestId },
        data: {
            status: "ACCEPTED",
            helperId: user.id
        }
    })

    revalidatePath("/volunteer/dashboard")
    return { success: true }
}

// Resolve a help request (mark as completed)
export async function resolveHelpRequest(requestId: string) {
    const { user } = await verifyVolunteer()

    const request = await db.helpRequest.findUnique({
        where: { id: requestId }
    })

    if (!request) {
        return { success: false, error: "طلب المساعدة غير موجود" }
    }

    // Only the requester can resolve (not the helper)
    if (request.requesterId !== user.id && user.role !== "ADMIN") {
        return { success: false, error: "فقط صاحب الطلب يمكنه إغلاقه" }
    }

    await db.helpRequest.update({
        where: { id: requestId },
        data: { status: "RESOLVED" }
    })

    revalidatePath("/volunteer/dashboard")
    return { success: true }
}

// Cancel a help request
export async function cancelHelpRequest(requestId: string) {
    const { user } = await verifyVolunteer()

    const request = await db.helpRequest.findUnique({
        where: { id: requestId }
    })

    if (!request) {
        return { success: false, error: "طلب المساعدة غير موجود" }
    }

    // Only requester can cancel
    if (request.requesterId !== user.id && user.role !== "ADMIN") {
        return { success: false, error: "فقط صاحب الطلب يمكنه إلغاءه" }
    }

    await db.helpRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" }
    })

    revalidatePath("/volunteer/dashboard")
    return { success: true }
}
