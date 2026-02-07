'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { acceptInvite } from '@/lib/invitations';
import { Loader2, QrCode, Keyboard, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

interface Props {
    children: React.ReactNode;
    onJoinSuccess?: () => void;
}

export function JoinTeamDialog({ children, onJoinSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const handleJoin = async (value: string) => {
        setLoading(true);
        try {
            const res = await acceptInvite(value);
            toast.success(res.message);
            setOpen(false);
            if (res.projectId) {
                // In a real app we need teamId too, but maybe API returns it?
                // If not, we might need to refresh or redirect to home to find it.
                // For now, let's just refresh or call callback
                if (onJoinSuccess) onJoinSuccess();
                router.refresh();
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initialize/Cleanup Scanner when tab changes or dialog closes
    useEffect(() => {
        if (!open) {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        }
    }, [open]);

    const startScanner = () => {
        // give browser a moment to render the div
        setTimeout(() => {
            if (scannerRef.current) return; // already started

            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render((decodedText) => {
                // Success
                console.log('Scanned:', decodedText);
                scanner.clear();
                scannerRef.current = null;

                // Parse URL to extract token/code if it's a full URL
                let valueToJoin = decodedText;
                try {
                    const url = new URL(decodedText);
                    const token = url.searchParams.get('token');
                    const codeParam = url.searchParams.get('code');
                    if (token) valueToJoin = token;
                    else if (codeParam) valueToJoin = codeParam;
                } catch (e) {
                    // Not a URL, treat as code
                }

                handleJoin(valueToJoin);
            }, (error) => {
                // Ignore errors
            });

            scannerRef.current = scanner;
        }, 100);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Join Team</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="code" className="w-full" onValueChange={(val) => {
                    if (val === 'scan') startScanner();
                    else if (scannerRef.current) {
                        scannerRef.current.clear().catch(console.error);
                        scannerRef.current = null;
                    }
                }}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="code"><Keyboard className="w-4 h-4 mr-2" /> Enter Code</TabsTrigger>
                        <TabsTrigger value="scan"><Camera className="w-4 h-4 mr-2" /> Scan QR</TabsTrigger>
                    </TabsList>

                    <TabsContent value="code" className="space-y-4 pt-4">
                        <Input
                            placeholder="Enter Team Code (e.g. JOB-1A2B)"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <Button className="w-full" onClick={() => handleJoin(code)} disabled={loading || !code}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Join Team
                        </Button>
                    </TabsContent>

                    <TabsContent value="scan" className="space-y-4 pt-4">
                        <div id="reader" className="w-full h-[300px] bg-muted rounded overflow-hidden"></div>
                        <p className="text-xs text-center text-muted-foreground">
                            Point your camera at a Team QR Code.
                        </p>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
