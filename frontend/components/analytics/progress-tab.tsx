import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getProjectBurndown } from '@/lib/api';
// Using Recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
    projectId: string;
}

interface BurndownData {
    chartData: { date: string; ideal: number; actual: number }[];
    blockedTasks: any[]; // define stricter type if possible, utilizing standard Task type
}

export function ProgressTab({ projectId }: Props) {
    const [data, setData] = useState<BurndownData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [projectId]);

    async function loadData() {
        setLoading(true);
        try {
            const res = await getProjectBurndown(projectId);
            setData(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    const { chartData, blockedTasks } = data;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Burndown Chart</CardTitle>
                    <CardDescription>Track project completion over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    {chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Not enough data to display chart.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="ideal" stroke="#8884d8" name="Ideal Burndown" strokeDasharray="5 5" dot={false} />
                                <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Tasks Remaining" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Blocked Tasks Summary */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center text-red-700 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Blocked Tasks ({blockedTasks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {blockedTasks.length === 0 ? (
                            <div className="text-sm text-green-600 flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                No blocked tasks!
                            </div>
                        ) : (
                            <ul className="space-y-2 mt-2">
                                {blockedTasks.map((task: any) => (
                                    <li key={task.id} className="text-sm bg-white dark:bg-black/20 p-2 rounded border border-red-100 dark:border-red-900/50">
                                        <div className="font-medium">{task.title}</div>
                                        {task.blockedReason && (
                                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                Reason: {task.blockedReason}
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Assignee: {task.assignee?.name || 'Unassigned'}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Stats or Recommendations could go here */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Project Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Tasks:</span>
                            <span className="font-medium">{chartData.length > 0 ? chartData[0].ideal : 0}</span> {/* Approx from start point */}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className="font-medium">{chartData.length > 0 ? chartData[chartData.length - 1].actual : 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Target Date:</span>
                            <span className="font-medium">{chartData.length > 0 ? chartData[chartData.length - 1].date : 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
