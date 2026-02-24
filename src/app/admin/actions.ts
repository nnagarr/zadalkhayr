"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { DonationStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

// Verify admin helper
async function verifyAdmin() {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, name: true }
    })

    if (!dbUser || dbUser.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    return { session, adminName: dbUser.name }
}

// Update donation with proper validation
interface UpdateDonationData {
    status: DonationStatus
    volunteerId: string | null
    adminNotes: string | null
}

export async function updateDonation(id: string, data: UpdateDonationData) {
    await verifyAdmin()

    // Get current donation to check delivery method and volunteer
    const donation = await db.donation.findUnique({
        where: { id },
        select: {
            deliveryMethod: true,
            status: true,
            volunteerId: true,
            volunteer: {
                select: { name: true }
            }
        }
    })

    if (!donation) {
        throw new Error("Donation not found")
    }

    let finalStatus = data.status
    let finalVolunteerId = data.volunteerId
    let deliveredByName: string | null = null

    // Statuses that REQUIRE a volunteer to be connected
    const statusesRequiringVolunteer: DonationStatus[] = ["ASSIGNED", "COLLECTED", "OUT_FOR_DELIVERY"]

    // Statuses where volunteer should be DISCONNECTED
    const statusesWithoutVolunteer: DonationStatus[] = ["PENDING", "COMPLETED", "CANCELLED"]

    // If completing an order, save who delivered it
    if (data.status === "COMPLETED") {
        // Save the volunteer's name who delivered the order
        if (donation.volunteer?.name) {
            deliveredByName = donation.volunteer.name
        } else if (data.volunteerId) {
            // If there's a new volunteer assigned, get their name
            const volunteer = await db.user.findUnique({
                where: { id: data.volunteerId },
                select: { name: true }
            })
            if (volunteer?.name) {
                deliveredByName = volunteer.name
            }
        }
    }

    // For statuses that don't need a volunteer, always disconnect
    if (statusesWithoutVolunteer.includes(data.status)) {
        finalVolunteerId = null
    }

    // If setting a status that requires volunteer but no volunteer provided
    if (statusesRequiringVolunteer.includes(data.status) && !data.volunteerId) {
        // Revert to PENDING if no volunteer is available
        finalStatus = "PENDING"
        // Make sure volunteer is null for these reverted statuses too
        finalVolunteerId = null
    }

    await db.donation.update({
        where: { id },
        data: {
            status: finalStatus,
            volunteerId: finalVolunteerId,
            adminNotes: data.adminNotes,
            ...(deliveredByName && { deliveredByName })
        }
    })

    revalidatePath("/admin")
    revalidatePath("/volunteer/dashboard")
}

// Block a phone number
export async function blockPhone(phone: string, reason?: string) {
    const { session, adminName } = await verifyAdmin()

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s/g, "")

    // Get admin's phone number to prevent self-blocking
    const adminUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { phone: true }
    })

    if (adminUser?.phone?.replace(/\s/g, "") === normalizedPhone) {
        return { success: false, error: "لا يمكنك حظر رقمك الخاص" }
    }

    // Check if already blocked
    const existing = await db.blockedPhone.findUnique({
        where: { phone: normalizedPhone }
    })

    if (existing) {
        return { success: false, error: "هذا الرقم محظور بالفعل" }
    }

    await db.blockedPhone.create({
        data: {
            phone: normalizedPhone,
            reason: reason || null,
            blockedBy: adminName
        }
    })

    revalidatePath("/admin")
    return { success: true }
}

// Unblock a phone number
export async function unblockPhone(phone: string) {
    await verifyAdmin()

    const normalizedPhone = phone.replace(/\s/g, "")

    await db.blockedPhone.delete({
        where: { phone: normalizedPhone }
    })

    revalidatePath("/admin")
    return { success: true }
}

// Check if phone is blocked (used in donate action)
export async function isPhoneBlocked(phone: string): Promise<boolean> {
    const normalizedPhone = phone.replace(/\s/g, "")

    const blocked = await db.blockedPhone.findUnique({
        where: { phone: normalizedPhone }
    })

    return !!blocked
}

// Approve a volunteer request
export async function approveVolunteer(userId: string) {
    await verifyAdmin()

    await db.user.update({
        where: { id: userId },
        data: { role: "VOLUNTEER" }
    })

    revalidatePath("/admin")
    return { success: true }
}

// Reject a volunteer request (reset to USER)
export async function rejectVolunteer(userId: string) {
    await verifyAdmin()

    await db.user.update({
        where: { id: userId },
        data: {
            role: "USER",
            nationalId: null,
            vehicleType: null,
            addressText: null,
            zone: null,
            gender: null,
            dateOfBirth: null
        }
    })

    revalidatePath("/admin")
    return { success: true }
}

// Change user role
export async function changeUserRole(userId: string, newRole: string) {
    const { session } = await verifyAdmin()

    // Prevent changing own role
    if (userId === session.user.id) {
        return { success: false, error: "لا يمكنك تغيير دورك الخاص" }
    }

    // Validate role
    const validRoles = ["USER", "PENDING_VOLUNTEER", "VOLUNTEER", "ADMIN"]
    if (!validRoles.includes(newRole)) {
        return { success: false, error: "دور غير صالح" }
    }

    // If demoting from volunteer, clear volunteer fields
    const clearVolunteerFields = newRole === "USER" ? {
        nationalId: null,
        vehicleType: null,
        addressText: null,
        zone: null,
        gender: null,
        dateOfBirth: null
    } : {}

    await db.user.update({
        where: { id: userId },
        data: {
            role: newRole,
            ...clearVolunteerFields
        }
    })

    revalidatePath("/admin")
    return { success: true }
}

// Delete user (only for admins)
export async function deleteUser(userId: string) {
    const { session } = await verifyAdmin()

    // Prevent deleting own account
    if (userId === session.user.id) {
        return { success: false, error: "لا يمكنك حذف حسابك الخاص" }
    }

    await db.user.delete({
        where: { id: userId }
    })

    revalidatePath("/admin")
    return { success: true }
}

// Get system settings
export async function getSystemSettings() {
    // Get or create settings
    let settings = await db.systemSettings.findUnique({
        where: { id: "main" }
    })

    if (!settings) {
        settings = await db.systemSettings.create({
            data: { id: "main" }
        })
    }

    return settings
}

// Toggle volunteer dashboard open/closed
export async function toggleVolunteerDashboard(open: boolean) {
    const { adminName } = await verifyAdmin()

    await db.systemSettings.upsert({
        where: { id: "main" },
        create: {
            id: "main",
            volunteerDashOpen: open,
            updatedBy: adminName
        },
        update: {
            volunteerDashOpen: open,
            updatedBy: adminName
        }
    })

    revalidatePath("/admin")
    revalidatePath("/volunteer/dashboard")
    return { success: true }
}

// Import beneficiaries from JSON
export async function importBeneficiaries(jsonData: string) {
    await verifyAdmin()

    try {
        const beneficiaries = JSON.parse(jsonData)

        if (!Array.isArray(beneficiaries)) {
            return { success: false, error: "صيغة JSON غير صحيحة: يجب أن تكون مصفوفة" }
        }

        let count = 0
        let skipped = 0

        for (const b of beneficiaries) {
            // Validate required fields
            if (!b.name || !b.phoneNumber || !b.zone || !b.address) {
                skipped++
                continue
            }

            // Normalize phone
            const phone = String(b.phoneNumber).replace(/\s/g, "")

            try {
                // Check if beneficiary exists by phone
                const existing = await db.beneficiary.findFirst({
                    where: { phone: phone }
                })

                if (existing) {
                    // Update existing beneficiary
                    await db.beneficiary.update({
                        where: { id: existing.id },
                        data: {
                            name: b.name,
                            zone: b.zone,
                            address: b.address,
                            familyMembers: Number(b.familyMembers) || 1,
                            isActive: true
                        }
                    })
                } else {
                    // Create new beneficiary
                    await db.beneficiary.create({
                        data: {
                            name: b.name,
                            phone: phone,
                            zone: b.zone,
                            address: b.address,
                            familyMembers: Number(b.familyMembers) || 1,
                            isActive: true
                        }
                    })
                }
                count++
            } catch (err) {
                console.error(`Failed to import beneficiary ${b.name}:`, err)
                skipped++
            }
        }

        revalidatePath("/admin")
        return { success: true, count, skipped }
    } catch (error) {
        console.error("Import error:", error)
        return { success: false, error: "فشل في تحليل أو استيراد البيانات" }
    }
}
