"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface NavbarProps {
    isLoggedIn: boolean;
    userName?: string | null;
    isAdmin?: boolean;
    signOutAction?: () => Promise<void>;
}

export function Navbar({ isLoggedIn, userName, isAdmin, signOutAction }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled || isMobileMenuOpen
                ? "bg-slate-950/95 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-black/20"
                : "bg-gradient-to-b from-black/50 to-transparent"
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="h-16 md:h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-3 group"
                    >
                        <div className="relative w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:scale-110">
                            <Image
                                src="/logo/logo.png"
                                alt="زاد الخير"
                                fill
                                className="object-contain drop-shadow-lg"
                                sizes="48px"
                                priority
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl md:text-2xl font-bold bg-gradient-to-l from-amber-300 to-amber-500 bg-clip-text text-transparent">
                                زاد الخير
                            </span>
                            <span className="text-[10px] text-white/50 hidden sm:block">
                                مبادرة خيرية رمضانية
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-2">
                        <Link href="/donate">
                            <Button
                                variant="ghost"
                                className="text-white/80 hover:text-white hover:bg-white/10 transition-all"
                            >
                                تبرع
                            </Button>
                        </Link>
                        <Link href="/volunteer">
                            <Button
                                variant="ghost"
                                className="text-white/80 hover:text-white hover:bg-white/10 transition-all"
                            >
                                تطوع
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button
                                variant="ghost"
                                className="text-white/80 hover:text-white hover:bg-white/10 transition-all"
                            >
                                تواصل معنا
                            </Button>
                        </Link>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-2 md:gap-4">
                                {/* User Avatar/Name */}
                                <Link href="/profile" className="hidden sm:flex items-center justify-center p-1 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all cursor-pointer" title={userName || "الملف الشخصي"}>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                                        <span className="text-sm font-bold text-slate-900">
                                            {userName?.charAt(0) || "م"}
                                        </span>
                                    </div>
                                </Link>

                                {isAdmin && !pathname?.startsWith("/admin") && (
                                    <Link href="/admin">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                        >
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="hidden lg:inline">لوحة التحكم</span>
                                        </Button>
                                    </Link>
                                )}

                                {signOutAction && (
                                    <form action={signOutAction} className="hidden md:block">
                                        <Button
                                            type="submit"
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                                        >
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="hidden sm:inline">خروج</span>
                                        </Button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white/80 hover:text-white hover:bg-white/10"
                                    >
                                        دخول
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button
                                        size="sm"
                                        className="bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:scale-105"
                                    >
                                        حساب جديد
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? "max-h-[500px] pb-4" : "max-h-0"
                        }`}
                >
                    <nav className="flex flex-col gap-1 pt-2 border-t border-white/10">
                        <Link
                            href="/donate"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                        >
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                            تبرع بالطعام
                        </Link>
                        <Link
                            href="/volunteer"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                        >
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            تطوع معنا
                        </Link>
                        <Link
                            href="/contact"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                        >
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            تواصل معنا
                        </Link>

                        {/* Logout Button - Only show when logged in */}
                        {isLoggedIn && (
                            <>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
                                >
                                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    ملفي الشخصي
                                </Link>
                                <div className="my-2 border-t border-white/10" />
                                {signOutAction && (
                                    <form action={signOutAction}>
                                        <button
                                            type="submit"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            تسجيل الخروج
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
