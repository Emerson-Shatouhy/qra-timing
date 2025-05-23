import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, Play, StopCircle, X, Clock, Trash2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Race, results, Team } from "@/types/race";

interface TimingControlProps {
    className?: string;
    raceId?: string;
}

interface ResultWithTeam extends results {
    team: Team;
}

export default function TimingControl({ raceId }: TimingControlProps) {
    const supabase = createClient();
    const [raceStarted, setRaceStarted] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [laneNumberInput, setLaneNumberInput] = useState("");
    const [raceResults, setRaceResults] = useState<ResultWithTeam[]>([]);
    const [raceData, setRaceData] = useState<Race | null>(null);
    const [loading, setLoading] = useState(false);
    const [finishTimes, setFinishTimes] = useState<{ time: string; assigned: boolean }[]>([]);

    useEffect(() => {
        const fetchRaceData = async () => {
            if (!raceId) return;

            try {
                const { data: race, error: raceError } = await supabase
                    .from('races')
                    .select(`
                        *,
                        category:category (category_name)
                    `)
                    .eq('id', raceId)
                    .single();

                if (raceError) throw raceError;
                setRaceData(race);

                setRaceStarted(!!race.race_actual_start_time);
                setIsRunning(!!race.race_actual_start_time && !race.race_actual_end_time);

                const { data: resultsData, error: resultsError } = await supabase
                    .from('results')
                    .select(`
                        id,
                        team:team (*),
                        start_time,
                        finish_time,
                        lane_number
                    `)
                    .eq('race_id', raceId)
                    .order('lane_number');

                if (resultsError) throw resultsError;
                // @ts-ignore
                setRaceResults(resultsData as ResultWithTeam[]);
            } catch (error) {
                console.error('Error fetching race data:', error);
                toast.error('Failed to load race data');
            }
        };

        fetchRaceData();
    }, [raceId]);

    useEffect(() => {
        if (!raceId) return;

        const raceChannel = supabase
            .channel(`race-${raceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'races',
                    filter: `id=eq.${raceId}`
                },
                (payload) => {
                    if (payload.new) {
                        setRaceData(payload.new as Race);
                        // @ts-ignore
                        setRaceStarted(!!payload.new.race_actual_start_time);
                        // @ts-ignore
                        setIsRunning(!!payload.new.race_actual_start_time && !payload.new.race_actual_end_time);
                    }
                }
            )
            .subscribe();

        const resultsChannel = supabase
            .channel(`race-results-${raceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'results',
                    filter: `race_id=eq.${raceId}`
                },
                async (payload) => {
                    const { data, error } = await supabase
                        .from('results')
                        .select(`
                            id,
                            team:team_id (*),
                            start_time,
                            finish_time,
                            lane_number
                        `)
                        .eq('race_id', raceId)
                        .order('lane_number');

                    if (!error && data) {
                        // @ts-ignore
                        setRaceResults(data as ResultWithTeam[]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.channel(`race-${raceId}`).unsubscribe();
            supabase.channel(`race-results-${raceId}`).unsubscribe();
        };
    }, [raceId]);

    const handleStartRace = async () => {
        if (!raceId) return;

        setLoading(true);
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('races')
                .update({
                    race_actual_start_time: now,
                    race_status: 'active'
                })
                .eq('id', raceId);

            if (error) throw error;

            const { data: resultsWithoutStartTime, error: fetchError } = await supabase
                .from('results')
                .select('id')
                .eq('race_id', raceId)
                .is('start_time', null);

            if (fetchError) throw fetchError;

            if (resultsWithoutStartTime && resultsWithoutStartTime.length > 0) {
                const resultIds = resultsWithoutStartTime.map(r => r.id);

                const { error: resultsError } = await supabase
                    .from('results')
                    .update({
                        start_time: now
                    })
                    .in('id', resultIds);

                if (resultsError) throw resultsError;
            }

            toast.success('Race started successfully');
        } catch (error) {
            console.error('Error starting race:', error);
            toast.error('Failed to start race');
        } finally {
            setLoading(false);
        }
    };

    const handleStopRace = async () => {
        if (!raceId) return;

        setLoading(true);
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('races')
                .update({
                    race_actual_end_time: now,
                    race_status: 'unofficial'
                })
                .eq('id', raceId);

            if (error) throw error;
            toast.success('Race stopped successfully');
        } catch (error) {
            console.error('Error stopping race:', error);
            toast.error('Failed to stop race');
        } finally {
            setLoading(false);
        }
    };

    const handleResumeRace = async () => {
        if (!raceId) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('races')
                .update({
                    race_actual_end_time: null,
                    race_status: 'active'
                })
                .eq('id', raceId);

            if (error) throw error;
            toast.success('Race resumed');
        } catch (error) {
            console.error('Error resuming race:', error);
            toast.error('Failed to resume race');
        } finally {
            setLoading(false);
        }
    };

    const handleResetRace = async () => {
        if (!raceId) return;

        if (!confirm("Are you sure you want to reset this race? This will clear all start and finish times.")) {
            return;
        }

        setLoading(true);
        try {
            // Reset the race in the races table
            const { error: raceError } = await supabase
                .from('races')
                .update({
                    race_actual_start_time: null,
                    race_actual_end_time: null,
                    race_status: 'upcoming'
                })
                .eq('id', raceId);

            if (raceError) throw raceError;

            // Reset all results for this race
            const { error: resultsError } = await supabase
                .from('results')
                .update({
                    start_time: null,
                    finish_time: null
                })
                .eq('race_id', raceId);

            if (resultsError) throw resultsError;

            // Clear local finish times
            setFinishTimes([]);
            setRaceStarted(false);
            setIsRunning(false);
            // Reload the page
            window.location.reload();

            toast.success('Race has been reset successfully');
        } catch (error) {
            console.error('Error resetting race:', error);
            toast.error('Failed to reset race');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkFinishWithLane = async () => {
        if (!raceId || !laneNumberInput || !isRunning) return;

        setLoading(true);
        try {
            const lane = parseInt(laneNumberInput);
            const result = raceResults.find(r => r.lane_number === lane);

            if (!result) {
                toast.error(`No team found in lane ${lane}`);
                return;
            }

            const now = new Date().toISOString();
            const { error } = await supabase
                .from('results')
                .update({
                    finish_time: now
                })
                .eq('id', result.id);

            if (error) throw error;

            const teamName = result.team?.team_name || 'Unknown Team';
            toast.success(`Marked finish for ${teamName} in lane ${lane}`);
            setLaneNumberInput("");
        } catch (error) {
            console.error('Error marking finish:', error);
            toast.error('Failed to mark finish');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickMark = () => {
        if (!isRunning) return;

        const now = new Date().toISOString();
        setFinishTimes(prev => [...prev, { time: now, assigned: false }]);
        toast.success("Finish time recorded");
    };

    const assignTimeToLane = async (timeIndex: number, lane: number) => {
        if (!raceId) return;

        setLoading(true);
        try {
            const result = raceResults.find(r => r.lane_number === lane);

            if (!result) {
                toast.error(`No team found in lane ${lane}`);
                return;
            }

            const { error } = await supabase
                .from('results')
                .update({
                    finish_time: finishTimes[timeIndex].time
                })
                .eq('id', result.id);

            if (error) throw error;

            setFinishTimes(prev =>
                prev.map((item, index) =>
                    index === timeIndex ? { ...item, assigned: true } : item
                )
            );

            const teamName = result.team?.team_name || 'Unknown Team';
            toast.success(`Assigned finish time to ${teamName} in lane ${lane}`);
        } catch (error) {
            console.error('Error assigning time:', error);
            toast.error('Failed to assign time');
        } finally {
            setLoading(false);
        }
    };

    const removeFinishTime = (timeIndex: number) => {
        setFinishTimes(prev => prev.filter((_, index) => index !== timeIndex));
        toast.success("Finish time removed");
    };

    const removeResultFinish = async (resultId: number) => {
        if (!raceId) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('results')
                .update({
                    finish_time: null
                })
                .eq('id', resultId);

            if (error) throw error;
            toast.success("Finish time cleared");
        } catch (error) {
            console.error('Error removing finish time:', error);
            toast.error('Failed to clear finish time');
        } finally {
            setLoading(false);
        }
    };

    const formatTimeString = (timeString: string) => {
        const date = new Date(timeString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const milliseconds = Math.floor(date.getMilliseconds() / 10).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    };

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Timer Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="flex gap-3 w-full">
                            {!raceStarted && (
                                <>
                                    <Button
                                        size="lg"
                                        className="bg-green-600 hover:bg-green-700 w-full"
                                        onClick={handleStartRace}
                                        disabled={loading}
                                    >
                                        <Play className="mr-2 h-5 w-5" />
                                        Start Race
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handleResetRace}
                                        disabled={loading}
                                        className="w-1/4"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                </>
                            )}

                            {raceStarted && isRunning && (
                                <Button
                                    size="lg"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleStopRace}
                                    disabled={loading}
                                >
                                    <StopCircle className="mr-2 h-5 w-5" />
                                    Stop Timer
                                </Button>
                            )}

                            {raceStarted && !isRunning && (
                                <>
                                    <Button
                                        size="lg"
                                        className="bg-green-600 hover:bg-green-700 w-full"
                                        onClick={handleResumeRace}
                                        disabled={loading}
                                    >
                                        <Play className="mr-2 h-5 w-5" />
                                        Resume Timer
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handleResetRace}
                                        disabled={loading}
                                        className="w-1/4"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {raceStarted && (
                        <>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium">Mark Finish</h3>
                                    {isRunning && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleQuickMark}
                                            className="bg-teal-600 hover:bg-teal-700 text-white"
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            Quick Mark
                                        </Button>
                                    )}
                                </div>

                                <div className="flex w-full gap-2">
                                    <input
                                        type="number"
                                        placeholder="Enter Lane Number"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={laneNumberInput}
                                        onChange={(e) => setLaneNumberInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleMarkFinishWithLane();
                                            }
                                        }}
                                        disabled={!isRunning || loading}
                                    />
                                    <Button
                                        onClick={handleMarkFinishWithLane}
                                        className="bg-teal-600 hover:bg-teal-700"
                                        disabled={!isRunning || !laneNumberInput || loading}
                                    >
                                        <Flag className="mr-2 h-4 w-4" />
                                        Mark
                                    </Button>
                                </div>
                            </div>

                            {finishTimes.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-medium">Unassigned Finish Times</h3>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {finishTimes.map((finishTime, index) => (
                                            <div key={index} className={`flex items-center justify-between p-2 rounded border ${finishTime.assigned ? 'bg-gray-100 opacity-60' : 'bg-yellow-50'}`}>
                                                <div className="flex items-center">
                                                    <span className="font-mono text-sm">
                                                        {formatTimeString(finishTime.time)}
                                                    </span>
                                                    {finishTime.assigned && (
                                                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                            Assigned
                                                        </span>
                                                    )}
                                                </div>
                                                {!finishTime.assigned && (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Lane"
                                                            className="w-16 h-8 text-sm border rounded px-2"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    const lane = parseInt((e.target as HTMLInputElement).value);
                                                                    if (lane) {
                                                                        assignTimeToLane(index, lane);
                                                                        (e.target as HTMLInputElement).value = '';
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeFinishTime(index)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="space-y-3">
                        <h3 className="font-medium">Lane Assignments</h3>
                        <div className="text-sm space-y-1 max-h-[200px] overflow-y-auto">
                            {raceResults.length > 0 ? (
                                raceResults.map((result) => (
                                    <div key={result.id} className="flex justify-between items-center p-1 rounded hover:bg-muted">
                                        <span>
                                            Lane {result.lane_number}: {result.team?.team_name || 'Unknown Team'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {result.finish_time ? (
                                                <>
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                        Finished
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => removeResultFinish(result.id)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-500" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-xs px-2 py-0.5">
                                                    Not finished
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground">No teams found</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-medium">Quick Tips</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Use &quoQuick Mark&quo to record a finish time without assigning a lane</li>
                            <li>Enter lane number later for recorded times</li>
                            <li>Press Enter after typing a lane number to quickly mark finish</li>
                            <li>Use the remove button to clear finish times if needed</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
