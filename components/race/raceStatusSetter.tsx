"use client"

import { MoreVertical } from "lucide-react";
import { Race, RaceStatus } from "@/types/race";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { setRaceStatus } from "@/lib/raceActions/raceActions";

interface RaceStatusSetterProps {
    race: Race;
}

export default function RaceStatusSetter({ race }: RaceStatusSetterProps) {
    const router = useRouter();

    const handleStatusChange = async (status: RaceStatus) => {
        try {
            await setRaceStatus(race.id, status);
            router.refresh();
        } catch (error) {
            console.error("Failed to update race status:", error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.preventDefault()}>
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                {/* Upcoming races can be activated, delayed, or cancelled */}
                {race.race_status === 'upcoming' && (
                    <>
                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('delayed');
                        }}>
                            Delay
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('cancelled');
                        }}>
                            Cancel
                        </DropdownMenuItem>
                    </>
                )}

                {/* Active races can be marked as unofficial or cancelled */}
                {race.race_status === 'active' && (
                    <>
                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('unofficial');
                        }}>
                            Mark as Unofficial
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('cancelled');
                        }}>
                            Cancel
                        </DropdownMenuItem>
                    </>
                )}

                {/* Unofficial results can be made official */}
                {race.race_status === 'unofficial' && (
                    <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        handleStatusChange('official');
                    }}>
                        Mark as Official
                    </DropdownMenuItem>
                )}

                {/* Delayed races can be activated or cancelled */}
                {race.race_status === 'delayed' && (
                    <>
                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('active');
                        }}>
                            Activate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('upcoming');
                        }}>
                            Reset to Upcoming
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('cancelled');
                        }}>
                            Cancel
                        </DropdownMenuItem>
                    </>
                )}

                {/* Cancelled races can be reset to upcoming */}
                {race.race_status === 'cancelled' && (
                    <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        handleStatusChange('upcoming');
                    }}>
                        Reset to Upcoming
                    </DropdownMenuItem>
                )}

                {/* Official races can be reverted to unofficial if needed */}
                {race.race_status === 'official' && (
                    <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        handleStatusChange('unofficial');
                    }}>
                        Revert to Unofficial
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
