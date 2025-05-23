'use client'
import { Button } from "@/components/ui/button"
import { Race } from "@/types/race";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, Clock, Users } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import Link from "next/link"
import RaceStatusBadge from "@/components/badges/raceStatusBadge";
import LiveRaceTimer from "@/components/timing/liveRaceTimer";

export default function RaceDetail() {
    const params = useParams()
    const raceId = params.id as string
    const supabase = createClient()
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [race, setRace] = useState<Race | null>(null)

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('results')
                .select(`
                    *,
                    team:teams (
                        id,
                        team_name,
                        team_short_name
                )
                    
                    `)
                .eq('race_id', raceId);
            if (error) {
                console.error('Error fetching results:', error)
            } else {
                console.log('Results:', data)
                setResults(data || [])
            }
            setLoading(false)
        }

        const fetchRace = async () => {
            const { data: races, error } = await supabase
                .from('races')
                .select(`
          *,
          category: category (category_name)
          `)
                .eq('id', raceId)
                .single()
            if (error) {
                console.error('Error fetching race:', error)
            } else {
                setRace(races)
            }
        }
        fetchRace()
        fetchResults()
    }, [raceId])

    if (loading || !race) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href="/">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
                <Link href={`/race/${raceId}/timer`}>
                    <Button variant="outline" size="sm" className="ml-2">
                        <Clock className="mr-2 h-4 w-4" /> Timer View
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl">{race?.category?.category_name}</CardTitle>
                            <CardDescription>{race?.race_name}</CardDescription>
                        </div>
                        <RaceStatusBadge status={race?.race_status} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Race Time</h3>
                            <div className="flex items-center">
                                <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                                <span>{results.length} teams</span>
                            </div>
                        </div>
                        <div className="bg-muted p-6 rounded-lg flex justify-center items-center">
                            <LiveRaceTimer
                                startTime={race.race_actual_start_time}
                                endTime={race.race_actual_end_time}
                                className="text-4xl"
                                raceId={raceId}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-4">Team Standings</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Lane</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Gap to Leader</TableHead>
                                    <TableHead>Gap Ahead</TableHead>
                                    <TableHead className="hidden md:table-cell">Start Time</TableHead>
                                    <TableHead className="hidden md:table-cell">End Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results
                                    .sort((a, b) => {
                                        // If both have end times, sort by end time
                                        if (a.finish_time && b.finish_time) {
                                            return new Date(a.finish_time).getTime() - new Date(b.finish_time).getTime();
                                        }
                                        // If only one has end time, that one comes first
                                        return a.finish_time ? -1 : (b.finish_time ? 1 : 0);
                                    })
                                    .map((result, index, sortedResults) => {
                                        const finishTime = result.start_time && result.finish_time ?
                                            new Date(new Date(result.finish_time).getTime() - new Date(result.start_time).getTime()) : null;

                                        const formattedFinishTime = finishTime ?
                                            `${finishTime.getUTCMinutes().toString().padStart(2, '0')}:${finishTime.getUTCSeconds().toString().padStart(2, '0')}.${Math.floor(finishTime.getUTCMilliseconds() / 10).toString().padStart(2, '0')}` :
                                            '--:--.--';

                                        // Calculate gap to leader
                                        let gapToLeader = null;
                                        const leaderFinishTime = sortedResults[0]?.start_time && sortedResults[0]?.finish_time ?
                                            new Date(new Date(sortedResults[0].finish_time).getTime() - new Date(sortedResults[0].start_time).getTime()).getTime() : null;

                                        if (leaderFinishTime && finishTime && index > 0) {
                                            const gap = new Date(finishTime.getTime() - leaderFinishTime);
                                            gapToLeader = `+${gap.getUTCMinutes().toString().padStart(2, '0')}:${gap.getUTCSeconds().toString().padStart(2, '0')}.${Math.floor(gap.getUTCMilliseconds() / 10).toString().padStart(2, '0')}`;
                                        }

                                        // Calculate gap to boat ahead
                                        let gapAhead = null;
                                        if (index > 0 && finishTime) {
                                            const aheadFinishTime = sortedResults[index - 1]?.start_time && sortedResults[index - 1]?.finish_time ?
                                                new Date(new Date(sortedResults[index - 1].finish_time).getTime() - new Date(sortedResults[index - 1].start_time).getTime()).getTime() : null;

                                            if (aheadFinishTime) {
                                                const gap = new Date(finishTime.getTime() - aheadFinishTime);
                                                gapAhead = `+${gap.getUTCMinutes().toString().padStart(2, '0')}:${gap.getUTCSeconds().toString().padStart(2, '0')}.${Math.floor(gap.getUTCMilliseconds() / 10).toString().padStart(2, '0')}`;
                                            }
                                        }

                                        return (
                                            <TableRow key={result.id} className={index === 0 && result.finish_time ? "bg-green-50" : ""}>
                                                <TableCell className="font-medium">{result.lane_number}</TableCell>
                                                <TableCell className={index === 0 && result.finish_time ? "font-semibold" : ""}>
                                                    {result.team?.team_short_name || result.team?.team_name}</TableCell>
                                                <TableCell className="font-mono tabular-nums">{formattedFinishTime}</TableCell>
                                                <TableCell className="font-mono tabular-nums text-gray-600">
                                                    {index === 0 ? "--:--.--" : (gapToLeader || '--:--.--')}
                                                </TableCell>
                                                <TableCell className="font-mono tabular-nums text-gray-600">
                                                    {index === 0 ? "--:--.--" : (gapAhead || '--:--.--')}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell font-mono tabular-nums">
                                                    {result.start_time ? new Date(result.start_time).toLocaleTimeString() : '--:--.--'}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell font-mono tabular-nums">
                                                    {result.finish_time ? new Date(result.finish_time).toLocaleTimeString() : '--:--.--'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
