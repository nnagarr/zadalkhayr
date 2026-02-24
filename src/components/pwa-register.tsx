'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWARegister() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [showUpdateBanner, setShowUpdateBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        // Track page visits for better install timing
        const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0') + 1;
        localStorage.setItem('pwa-visit-count', visitCount.toString());

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered with scope:', registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New content available - show update banner
                                    setWaitingWorker(newWorker);
                                    setShowUpdateBanner(true);
                                }
                            });
                        }
                    });

                    // Check if there's already a waiting worker
                    if (registration.waiting) {
                        setWaitingWorker(registration.waiting);
                        setShowUpdateBanner(true);
                    }
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });

            // Listen for controller change to reload page
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Only show banner after 2+ page visits (better timing)
            const visits = parseInt(localStorage.getItem('pwa-visit-count') || '0');
            if (visits >= 2) {
                setShowInstallBanner(true);
            }
        };

        // Listen for successful installation
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowInstallBanner(false);
            setDeferredPrompt(null);
            console.log('PWA installed successfully');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            // Ensure the service worker is active before prompting — improves reliability
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.ready;
            }

            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
        } catch (err) {
            console.error('Error during PWA install prompt', err);
        } finally {
            setDeferredPrompt(null);
            setShowInstallBanner(false);
        }
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        // Store dismissal in localStorage to not show again for a while
        localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    };

    const handleUpdate = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        setShowUpdateBanner(false);
    };

    const handleDismissUpdate = () => {
        setShowUpdateBanner(false);
    };

    // Check if should show install banner
    const shouldShowInstall = () => {
        if (isInstalled || !showInstallBanner) return false;

        // Check if dismissed within last 3 days
        const dismissedAt = localStorage.getItem('pwa-banner-dismissed');
        if (dismissedAt && Date.now() - parseInt(dismissedAt) < 3 * 24 * 60 * 60 * 1000) {
            return false;
        }

        return true;
    };

    return (
        <>
            {/* Update Available Banner */}
            {showUpdateBanner && (
                <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-top-5 duration-300">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg mb-1">تحديث متاح</h3>
                            <p className="text-sm text-white/90 mb-3">
                                يتوفر إصدار جديد من التطبيق. قم بالتحديث للحصول على أحدث الميزات.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdate}
                                    className="px-4 py-2 bg-white text-blue-700 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
                                >
                                    تحديث الآن
                                </button>
                                <button
                                    onClick={handleDismissUpdate}
                                    className="px-4 py-2 bg-white/20 rounded-lg font-medium text-sm hover:bg-white/30 transition-colors"
                                >
                                    لاحقاً
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleDismissUpdate}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="إغلاق"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Install Banner */}
            {shouldShowInstall() && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg mb-1">تثبيت التطبيق</h3>
                            <p className="text-sm text-white/90 mb-3">
                                أضف زاد الخير إلى شاشتك الرئيسية للوصول السريع!
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleInstallClick}
                                    className="px-4 py-2 bg-white text-emerald-700 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
                                >
                                    تثبيت الآن
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="px-4 py-2 bg-white/20 rounded-lg font-medium text-sm hover:bg-white/30 transition-colors"
                                >
                                    لاحقاً
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="إغلاق"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
