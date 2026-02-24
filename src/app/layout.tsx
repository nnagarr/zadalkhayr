import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { PWARegister } from "@/components/pwa-register";
import { auth, signOut } from "@/auth";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://zadalkhayr.org"),
  title: "زاد الخير | مبادرة خيرية رمضانية في مدينة السادات",
  description: "منصة لوجستية محلية لإدارة جمع الطعام من سكان مدينة السادات وتوزيعه على المحتاجين.",
  keywords: ["رمضان", "تبرع", "طعام", "مدينة السادات", "إفطار", "صدقة", "زاد الخير"],
  authors: [{ name: "زاد الخير" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "زاد الخير",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "زاد الخير | مبادرة خيرية رمضانية في مدينة السادات",
    description: "مساهمتك هي إفطارهم - منصة لجمع وتوزيع الطعام في رمضان",
    locale: "ar_EG",
    type: "website",
  },
  icons: {
    icon: "/logo/logoapp.png",
    apple: "/logo/logoapp.png",
  },
  verification: {
    google: "google-site-verification-code", // TODO: Replace with your actual verification code
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isLoggedIn = !!(session?.user?.id && session?.user?.name);
  const isAdmin = session?.user?.role === "ADMIN";

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "زاد الخير",
    url: "https://zadalkhayr.org",
    logo: "https://zadalkhayr.org/logo/logo.png",
    description: "منصة لوجستية محلية لإدارة جمع الطعام من سكان مدينة السادات وتوزيعه على المحتاجين.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sadat City",
      addressCountry: "EG",
    },
  };

  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <Providers>
          <Navbar
            isLoggedIn={isLoggedIn}
            userName={session?.user?.name}
            isAdmin={isAdmin}
            signOutAction={handleSignOut}
          />
          <main className="flex-1 pt-16 md:pt-20">
            {children}
          </main>
          <Footer />
        </Providers>
        <SpeedInsights />
        <Analytics />
        <PWARegister />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
