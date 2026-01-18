'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { explainSnippet } from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface SnippetExplainerProps {
    code: string;
    language: string;
}

export function SnippetExplainer({ code, language }: SnippetExplainerProps) {
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExplain = async () => {
        setLoading(true);
        try {
            const data = await explainSnippet(code, language);
            setExplanation(data.explanation);
        } catch (err) {
            console.error(err);
            setExplanation("Failed to get explanation from AI.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 text-indigo-600" onClick={handleExplain}>
                    <Bot className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>AI Code Explanation</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Bot className="animate-bounce w-4 h-4" /> Analyzing code...
                        </div>
                    ) : (
                        explanation
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
