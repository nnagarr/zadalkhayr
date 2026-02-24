'use server'

import { signIn, loginSchema, signUpSchema } from "@/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { headers } from "next/headers"
import { checkRateLimit, RATE_LIMITS, trackLoginAttempt, isAccountLocked } from "@/lib/rate-limit"

// Helper to get IP address for rate limiting
async function getClientIP(): Promise<string> {
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIP = headersList.get("x-real-ip")
    return forwardedFor?.split(",")[0]?.trim() || realIP || "unknown"
}

export async function signUp(prevState: any, formData: FormData) {
    // Rate limiting
    const ip = await getClientIP()
    const rateLimitResult = checkRateLimit(ip, "signup", RATE_LIMITS.signup)
    if (!rateLimitResult.success) {
        return { error: `تم تجاوز الحد المسموح. يرجى المحاولة بعد ${Math.ceil(rateLimitResult.resetInSeconds / 60)} دقيقة` }
    }

    const validatedFields = signUpSchema.safeParse(Object.fromEntries(formData))

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors }
    }

    const { name, phone, password } = validatedFields.data

    // Input length validation
    if (name.length > 100) {
        return { error: { name: ["الاسم طويل جداً (الحد الأقصى 100 حرف)"] } }
    }

    try {
        const existingUser = await db.user.findUnique({
            where: { phone },
        })

        if (existingUser) {
            return { error: { phone: ["Phone number already in use"] } }
        }

        const hashedPassword = await bcrypt.hash(password, 12) // Increased from 10 to 12 rounds

        await db.user.create({
            data: {
                name: name.trim(),
                phone,
                password: hashedPassword,
            },
        })
    } catch (error) {
        return { error: "Something went wrong during signup." }
    }

    // Login after signup
    try {
        await signIn("credentials", {
            phone,
            password,
            redirectTo: "/",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials." }
                default:
                    return { error: "Something went wrong." }
            }
        }
        throw error // Important to rethrow redirect errors
    }
}

export async function login(prevState: any, formData: FormData) {
    const validatedFields = loginSchema.safeParse(Object.fromEntries(formData))

    if (!validatedFields.success) {
        return { error: "يرجى إدخال رقم هاتف وكلمة مرور صحيحين" }
    }

    const { phone, password } = validatedFields.data

    // Check if account is locked
    const lockStatus = isAccountLocked(phone)
    if (lockStatus.isLocked) {
        return { error: `تم تجميد الحساب مؤقتاً. يرجى المحاولة بعد ${lockStatus.lockoutMinutes} دقيقة` }
    }

    // Rate limiting by IP
    const ip = await getClientIP()
    const rateLimitResult = checkRateLimit(ip, "login", RATE_LIMITS.login)
    if (!rateLimitResult.success) {
        return { error: `تم تجاوز الحد المسموح. يرجى المحاولة بعد ${Math.ceil(rateLimitResult.resetInSeconds / 60)} دقيقة` }
    }

    try {
        await signIn("credentials", {
            phone,
            password,
            redirectTo: "/",
        })
        // If we reach here, login was successful
        trackLoginAttempt(phone, true)
    } catch (error) {
        if (error instanceof AuthError) {
            // Track failed attempt
            const lockResult = trackLoginAttempt(phone, false)

            if (lockResult.isLocked) {
                return { error: `تم تجميد الحساب مؤقتاً بسبب محاولات خاطئة متعددة. يرجى المحاولة بعد ${lockResult.lockoutMinutes} دقيقة` }
            }

            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "رقم الهاتف أو كلمة المرور غير صحيحة" }
                default:
                    return { error: "حدث خطأ ما. يرجى المحاولة مرة أخرى" }
            }
        }
        throw error
    }
}
