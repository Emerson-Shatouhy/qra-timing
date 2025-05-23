"use client"
import { Clock, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Race, RaceStatus } from "@/types/race";
import Link from "next/link";
import RaceStatusBadge from "../badges/raceStatusBadge";
import { useRouter } from "next/navigation";
import RaceStatusSetter from "./raceStatusSetter";

interface RaceCardProps {
    race: Race;
    teamCount: number;
}

// Helper functions to determine colors based on race status
const getBorderColor = (status: RaceStatus | null): string => {
    switch (status) {
        case 'upcoming':
            return 'border-l-blue-500';
        case 'active':
            return 'border-l-green-500';
        case 'unofficial':
            return 'border-l-yellow-500';
        case 'official':
            return 'border-l-purple-500';
        case 'cancelled':
            return 'border-l-red-500';
        case 'delayed':
            return 'border-l-orange-500';
        default:
            return 'border-l-gray-500';
    }
};

const getTimerColor = (status: RaceStatus | null): string => {
    switch (status) {
        case 'upcoming':
            return 'text-blue-600';
        case 'active':
            return 'text-green-600';
        case 'unofficial':
            return 'text-yellow-600';
        case 'official':
            return 'text-purple-600';
        case 'cancelled':
            return 'text-red-600';
        case 'delayed':
            return 'text-orange-600';
        default:
            return 'text-gray-600';
    }
};

export default function RaceCard({ race, teamCount }: RaceCardProps) {
    const router = useRouter();

    // Format race time or use placeholder
    const raceTime = race.race_actual_end_time ?
        new Date(race.race_actual_end_time).toISOString().substr(14, 5) :
        "00:00.00";

    // Format race start time
    const startTime = race.race_scheduled_start ?
        new Date(race.race_scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
        "TBD";

    return (
        <Link href={`/race/${race.id}`} className="no-underline" onClick={(e) => e.stopPropagation()}>
            <Card className={`border-l-4 ${getBorderColor(race.race_status)}`}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle>{race.category.category_name}</CardTitle>
                        <div className="flex flex-row items-center space-x-2">
                            <RaceStatusBadge status={race.race_status} />
                            <RaceStatusSetter race={race} />
                        </div>
                    </div>
                    <CardDescription>{race.race_name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        {race.race_status === 'active' ? (
                            <div className={`flex items-center ${getTimerColor(race.race_status)} font-mono text-xl`}>
                                <Clock className="mr-2 h-5 w-5" />
                                <span className="tabular-nums">{raceTime}</span>
                            </div>
                        ) : (
                            <div className={`flex items-center ${getTimerColor(race.race_status)}`}>
                                <Clock className="mr-2 h-5 w-5" />
                                <span>Scheduled Start: {startTime}</span>
                            </div>
                        )}
                        <div className="flex items-center text-muted-foreground">
                            <Users className="mr-1 h-4 w-4" />
                            <span>{teamCount} entries</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}