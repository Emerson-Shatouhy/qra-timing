import { createClient } from "@/utils/supabase/client";
import { Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface LiveRaceTimerProps {
    startTime: string | null;
    endTime?: string | null;
    showIcon?: boolean;
    className?: string;
    raceId?: string | null;
}

export default function LiveRaceTimer({
    startTime,
    endTime = null,
    showIcon = true,
    className = "",
    raceId = null,
}: LiveRaceTimerProps) {
    const [currentStartTime, setCurrentStartTime] = useState(startTime);
    const [currentEndTime, setCurrentEndTime] = useState(endTime);
    const [elapsedTime, setElapsedTime] = useState("--:--.--");
    const [isActive, setIsActive] = useState(false);
    const isPaused = useRef(false);
    const supabase = createClient();

    // Handle subscription to race changes
    useEffect(() => {
        if (!raceId) return;

        const channel = supabase
            .channel('race_timer_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'races',
                    filter: `id=eq.${raceId}`,
                },
                (payload) => {
                    const newRace = payload.new;
                    if (newRace.race_actual_end_time) {
                        console.log("RACE ENDED");
                        setCurrentEndTime(newRace.race_actual_end_time);
                        isPaused.current = true;
                        setIsActive(false);
                    } else if (newRace.race_actual_start_time) {
                        console.log("RACE STARTED");
                        setCurrentStartTime(newRace.race_actual_start_time);
                        setCurrentEndTime(null);
                        isPaused.current = false;
                        setIsActive(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [raceId]);

    // Handle elapsed time update
    useEffect(() => {
        if (!currentStartTime) {
            setElapsedTime("--:--.--");
            setIsActive(false);
            return;
        }

        const startTimeMs = new Date(currentStartTime).getTime();

        const formatTime = (elapsed: number) => {
            const date = new Date(elapsed);
            const minutes = date.getUTCMinutes().toString().padStart(2, '0');
            const seconds = date.getUTCSeconds().toString().padStart(2, '0');
            const centiseconds = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
            return `${minutes}:${seconds}.${centiseconds}`;
        };

        if (currentEndTime) {
            const endTimeMs = new Date(currentEndTime).getTime();
            const elapsed = endTimeMs - startTimeMs;
            setElapsedTime(formatTime(elapsed));
            isPaused.current = true;
            return;
        }

        if (!isPaused.current) {
            const updateTimer = () => {
                const now = Date.now();
                const elapsed = now - startTimeMs;
                setElapsedTime(formatTime(elapsed));
            };

            updateTimer();
            const interval = setInterval(updateTimer, 100);

            return () => clearInterval(interval);
        }
    }, [currentStartTime, currentEndTime]);

    return (
        <div className={`flex items-center ${className}`}>
            {showIcon && (
                <Clock
                    className={`mr-3 h-5 w-5 ${isActive
                        ? "text-red-600 animate-pulse"
                        : "text-green-600"
                        }`}
                    strokeWidth={isActive ? 2.5 : 2}
                />
            )}
            <span
                className={`font-mono tabular-nums ${isActive
                    ? "text-red-600 animate-[blink_1.5s_ease-in-out_infinite]"
                    : "text-green-600"
                    }`}
            >
                {elapsedTime}
            </span>
        </div>
    );
}
