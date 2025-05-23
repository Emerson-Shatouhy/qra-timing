// app/lib/raceActions.ts
"use server"
import { RaceStatus } from "@/types/race"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function setRaceStatus(raceId: number, status: RaceStatus) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
        .from("races")
        .update({ race_status: status })
        .eq("id", raceId)

    if (error) {
        throw new Error("Failed to update race status")
    }
}
