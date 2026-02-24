import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { User } from "@prisma/client"
import { z } from "zod"

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const phoneSchema = z.string().regex(
    /^01[0125][0-9]{8}$/,
    "يجب أن يكون رقم هاتف مصري صحيح (يبدأ بـ 01 ويتكون من 11 رقم)"
)

export const passwordSchema = z.string().min(6, "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل")

export const nameSchema = z.string().min(2, "يجب أن يتكون الاسم من حرفين على الأقل")

export const loginSchema = z.object({
    phone: phoneSchema,
    password: passwordSchema,
})

export const signUpSchema = z.object({
    name: nameSchema,
    phone: phoneSchema,
    password: passwordSchema,
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>

// ============================================
// NEXTAUTH CONFIG
// ============================================

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                phone: { label: "Phone", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = loginSchema.safeParse(credentials)

                if (parsedCredentials.success) {
                    const { phone, password } = parsedCredentials.data
                    const user = await db.user.findUnique({ where: { phone } })
                    if (!user) return null
                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) return user
                }
                return null
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/login",
    },
    trustHost: true,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as User).role
                token.id = user.id!
                token.phone = (user as User).phone
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role
                session.user.id = token.id
                session.user.phone = token.phone
            }
            return session
        },
    },
})
