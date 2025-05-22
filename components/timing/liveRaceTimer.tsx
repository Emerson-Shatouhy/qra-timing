import { createClient } from "@/utils/supabase/client";
import { Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface LiveRaceTimerProps {
    startTime: string | null;
    endTime?: string | null;
    showIcon?: boolean;
    className?: string;
}

export default function LiveRaceTimer({
    startTime,
    endTime = null,
    showIcon = true,
    className = "",
}: LiveRaceTimerProps) {
    const [elapsedTime, setElapsedTime] = useState<string>("--:--.--");
    const [isActive, setIsActive] = useState<boolean>(false);
    const isPaused = useRef(false);
    const supabase = createClient();

    const channel = supabase
        .channel('changes')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'races',
            },
            (payload) => {
                const { new: newRace } = payload;
                // Check if the updated race has an end time
                if (newRace.race_actual_end_time) {
                    console.log("RACE ENDED")
                    // Just pause the clock instead of updating with end time
                    isPaused.current = true;
                    setIsActive(false);
                } else {
                    console.log("RACE STARTED")
                    isPaused.current = false;
                    setIsActive(true);
                }
            }
        )
        .subscribe()

    useEffect(() => {
        // Cleanup function to unsubscribe from the channel
        return () => {
            supabase.channel('changes').unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!startTime) {
            setElapsedTime("--:--.--");
            setIsActive(false);
            return;
        }

        // Parse the start time
        const startTimeMs = new Date(startTime).getTime();

        // Only consider initial endTime for initialization
        const isRaceActive = !!startTime && !endTime && !isPaused.current;
        setIsActive(isRaceActive);

        // Function to format elapsed time
        const formatTime = (elapsed: number) => {
            const date = new Date(elapsed);
            const minutes = date.getUTCMinutes().toString().padStart(2, '0');
            const seconds = date.getUTCSeconds().toString().padStart(2, '0');
            const centiseconds = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
            return `${minutes}:${seconds}.${centiseconds}`;
        };

        // If race is initially finished, just calculate and set the final time
        if (endTime) {
            const endTimeMs = new Date(endTime).getTime();
            const elapsed = endTimeMs - startTimeMs;
            setElapsedTime(formatTime(elapsed));
            isPaused.current = true;
            return;
        }

        // If race is active, start a timer to update the elapsed time
        if (isRaceActive) {
            const updateTimer = () => {
                // Only update if not paused
                if (!isPaused.current) {
                    const now = Date.now();
                    const elapsed = now - startTimeMs;
                    setElapsedTime(formatTime(elapsed));
                }
            };

            // Update immediately and then set interval
            updateTimer();
            const interval = setInterval(updateTimer, 100); // Update every 100ms for smoother centiseconds

            return () => clearInterval(interval);
        }
    }, [startTime, endTime]);

    return (
        <div className={`flex items-center ${className}`}>
            {showIcon && (
                <Clock
                    className={`mr-3 h-5 w-5 ${isActive ? "text-red-600" : "text-green-600"}`}
                />
            )}
            <span
                className={`font-mono tabular-nums ${isActive ? "text-red-600" : "text-green-600"}`}
            >
                {elapsedTime}
            </span>
        </div>
    );
}
