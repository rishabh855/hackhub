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
    const [error, setError] = useState(false);

    const handleExplain = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await explainSnippet(code, language);
            setExplanation(data.explanation);
        } catch (err) {
            console.error(err);
            setError(true);
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
                        <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 flex flex-col items-start gap-2">
                            <p>{explanation}</p>
                            <Button variant="outline" size="sm" onClick={handleExplain}>Retry</Button>
                        </div>
                    ) : (
                        explanation
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
