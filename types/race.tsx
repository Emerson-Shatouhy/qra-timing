export type RaceStatus = 'upcoming' | 'active' | 'unofficial' | 'official' | 'cancelled' | 'delayed';

export interface Race {
    id: number;
    created_at: string; // ISO timestamp string (e.g., from PostgreSQL TIMESTAMP WITH TIME ZONE)
    race_scheduled_start: string | null;
    race_actual_end_time: string | null;
    race_name: string | null;
    race_status: RaceStatus | null;
    race_actual_start_time: string | null;
    category: Category;
    entries: number | null; // Foreign key to the entries table
}

export interface Category {
    id: number;
    category_name: string | null;
}

export interface results {
    id: number;
    team: Team;
    start_time: string | null;
    end_time: string | null;
    lane_number: number | null;
}

export interface Team {
    id: number;
    team_name: string | null;
    team_short_name: string | null;
}