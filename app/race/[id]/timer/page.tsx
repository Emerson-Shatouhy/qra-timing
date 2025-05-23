'use client'
import { Button } from "@/components/ui/button"
import { Race } from "@/types/race";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, Clock } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import RaceStatusBadge from "@/components/badges/raceStatusBadge";
import LiveRaceTimer from "@/components/timing/liveRaceTimer";
import TimingControl from "@/components/timing/timingControl";

export default function RaceTimerPage() {
    const params = useParams()
    const raceId = params.id as string
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [race, setRace] = useState<Race | null>(null)

    useEffect(() => {
        const fetchRace = async () => {
            setLoading(true)
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
            setLoading(false)
        }

        fetchRace()
    }, [raceId])

    if (loading || !race) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href={`/race/${raceId}`}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Race Details
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6">
                <div>
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
                                    <h3 className="text-lg font-medium">Race Timer</h3>
                                </div>
                                <div className="bg-muted p-6 rounded-lg flex justify-center items-center">
                                    <LiveRaceTimer
                                        startTime={race.race_actual_start_time}
                                        endTime={race.race_actual_end_time}
                                        className="text-5xl"
                                        raceId={raceId}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <TimingControl raceId={raceId} />
            </div>
        </div>
    )
}
