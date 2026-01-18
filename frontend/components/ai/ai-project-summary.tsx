'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { summarizeProject } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    projectId: string;
}

export function AiProjectSummary({ projectId }: Props) {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSummarize = async () => {
        setLoading(true);
        try {
            const data = await summarizeProject(projectId);
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to generate summary.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            {summary ? (
                <motion.div
                    key="summary"
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="overflow-hidden"
                >
                    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900 mb-4">
                        <CardContent className="pt-6 relative">
                            <div className="absolute top-4 right-4">
                                <Button variant="ghost" size="sm" onClick={() => setSummary(null)} className="h-6 w-6 p-0 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                                    &times;
                                </Button>
                            </div>
                            <div className="flex gap-3">
                                <Sparkles className="w-5 h-5 text-indigo-500 mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm mb-1">AI Project Status</h4>
                                    <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                                        {summary}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSummarize}
                        disabled={loading}
                        className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 mb-4 transition-all hover:scale-105 active:scale-95"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        {loading ? 'Analyzing Project...' : 'Generate AI Summary'}
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
