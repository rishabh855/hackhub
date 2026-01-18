import { TeamList } from "@/components/dashboard/team-list";

export default function Dashboard() {
    return (
        <div className="p-8">
            <h1 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dashboard</h1>
            <TeamList />
        </div>
    );
}
