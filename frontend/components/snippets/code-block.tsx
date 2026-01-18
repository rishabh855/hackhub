'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
    code: string;
    language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative rounded-md overflow-hidden my-2">
            <div className="absolute top-2 right-2 z-10">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={handleCopy}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
            </div>
            <SyntaxHighlighter
                language={language.toLowerCase()}
                style={vscDarkPlus}
                customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.875rem' }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}
