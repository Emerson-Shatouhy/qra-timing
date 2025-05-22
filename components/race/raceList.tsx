import { Race } from "@/types/race";
import RaceCard from "./raceCard";
import { createClient } from "@/utils/supabase/server";
import { cookies } from 'next/headers'


export default async function RaceList() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: races, error } = await supabase
        .from('races')
        .select(`
      *,
      category: category (category_name)
      `);
    // Filter races by status
    const activeRaces = races?.filter(race => race.race_status === 'active') || [];
    const upcomingRaces = races?.filter(race =>
        race.race_status === 'upcoming' || race.race_status === 'delayed') || [];
    const completedRaces = races?.filter(race =>
        race.race_status === 'unofficial' || race.race_status === 'official') || [];

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Active Races</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activeRaces.length > 0 ? (
                        activeRaces.map(race => (
                            <RaceCard key={race.id} race={race} />
                        ))
                    ) : (
                        <p className="text-gray-500">No active races at the moment</p>
                    )}
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Upcoming Races</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingRaces.length > 0 ? (
                        upcomingRaces.map(race => (
                            <RaceCard key={race.id} race={race} />
                        ))
                    ) : (
                        <p className="text-gray-500">No upcoming races scheduled</p>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4">Completed Races</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {completedRaces.length > 0 ? (
                        completedRaces.map(race => (
                            <RaceCard key={race.id} race={race} />
                        ))
                    ) : (
                        <p className="text-gray-500">No completed races yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
