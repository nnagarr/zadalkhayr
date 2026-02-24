import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DonateForm } from "./donate-form";

// Time boundaries (Egypt time)
const OPEN_TODAY_START_HOUR = 5;    // 5:05 AM
const OPEN_TODAY_START_MINUTE = 5;
const CUTOFF_START_HOUR = 15;       // 3:00 PM
const CUTOFF_START_MINUTE = 0;
const CUTOFF_END_HOUR = 18;         // 6:10 PM
const CUTOFF_END_MINUTE = 10;

export default async function DonatePage() {
    // Get session on the server
    const session = await auth();

    let userName = "";
    let userPhone = "";

    // If user is logged in, get their data from the database
    if (session?.user?.id) {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, phone: true }
        });

        if (user) {
            userName = user.name;
            userPhone = user.phone;
        }
    }

    // Check current Egypt time
    const now = new Date();
    const egyptTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
    const currentHour = egyptTime.getHours();
    const currentMinute = egyptTime.getMinutes();

    // Convert to minutes for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const openTodayStartInMinutes = OPEN_TODAY_START_HOUR * 60 + OPEN_TODAY_START_MINUTE; // 5:05 AM = 305
    const cutoffStartInMinutes = CUTOFF_START_HOUR * 60 + CUTOFF_START_MINUTE; // 3:00 PM = 900
    const cutoffEndInMinutes = CUTOFF_END_HOUR * 60 + CUTOFF_END_MINUTE; // 6:10 PM = 1090

    // Determine donation status
    // 5:05 AM - 3:00 PM: Open for today
    // 3:00 PM - 6:10 PM: Closed (donations go to tomorrow)
    // 6:10 PM - 5:05 AM: Open for tomorrow

    const isOpenForToday = currentTimeInMinutes >= openTodayStartInMinutes && currentTimeInMinutes < cutoffStartInMinutes;
    const isClosed = currentTimeInMinutes >= cutoffStartInMinutes && currentTimeInMinutes < cutoffEndInMinutes;
    // isAfterIftar is true when: after 6:10 PM OR before 5:05 AM
    const isAfterIftar = currentTimeInMinutes >= cutoffEndInMinutes || currentTimeInMinutes < openTodayStartInMinutes;

    // Pass the data to the client component
    return (
        <DonateForm
            initialName={userName}
            initialPhone={userPhone}
            isClosed={isClosed}
            isAfterIftar={isAfterIftar}
        />
    );
}
