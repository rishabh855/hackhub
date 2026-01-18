import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTask } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type Task = {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    status: string;
    dueDate?: string | null;
    labels?: string[];
    assigneeId?: string | null;
};

interface TaskDetailViewProps {
    task: Task;
    onUpdate: () => void;
}

export function TaskDetailView({ task, onUpdate }: TaskDetailViewProps) {
    const { toast } = useToast();
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined);
    const [labels, setLabels] = useState(task.labels?.join(', ') || '');
    const [loading, setLoading] = useState(false);

    // Sync state when task prop changes (e.g. selection changes)
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
        setLabels(task.labels?.join(', ') || '');
    }, [task]);

    async function handleSave() {
        setLoading(true);
        try {
            await updateTask(task.id, {
                title,
                description,
                priority,
                dueDate: dueDate || null,
                labels: labels.split(',').map(l => l.trim()).filter(Boolean)
            });
            toast({ title: "Task updated", description: "Changes saved successfully." });
            onUpdate();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 py-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="p-2 border rounded-md bg-muted/50 text-sm font-mono uppercase">{task.status}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-medium">Due Date</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={setDueDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                    className="min-h-[150px]"
                    placeholder="Add more details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Labels (comma separated)</label>
                <Input
                    placeholder="frontend, bug, v1"
                    value={labels}
                    onChange={(e) => setLabels(e.target.value)}
                />
            </div>

            <div className="pt-4">
                <Button onClick={handleSave} disabled={loading} className="w-full">
                    {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
            </div>
        </div>
    );
}
