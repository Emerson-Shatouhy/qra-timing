import { Badge } from "../ui/badge";
import { RaceStatus } from "@/types/race";

interface RaceStatusBadgeProps {
    status: RaceStatus | null;
}

const getBadgeColor = (status: RaceStatus | null): string => {
    switch (status) {
        case 'upcoming':
            return 'bg-blue-500';
        case 'active':
            return 'bg-green-500';
        case 'unofficial':
            return 'bg-yellow-500';
        case 'official':
            return 'bg-purple-500';
        case 'cancelled':
            return 'bg-red-500';
        case 'delayed':
            return 'bg-orange-500';
        default:
            return 'bg-gray-500';
    }
};

export default function RaceStatusBadge({ status }: RaceStatusBadgeProps) {
    return (
        <Badge className={`${getBadgeColor(status)} uppercase font-bold`}>
            {status || "Unknown"}
        </Badge>
    );
}
