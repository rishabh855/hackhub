import { TeamList } from "@/components/dashboard/team-list";

export default function Dashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <TeamList />
        </div>
    );
}
