'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { askAI } from '@/lib/api';

interface Props {
    teamId: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: { name: string; image?: string };
    createdAt: string;
}

let socket: Socket;

export function ChatWindow({ teamId }: Props) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Initialize Socket
        socket = io('http://localhost:4000');

        socket.on('connect', () => {
            console.log('Connected to chat server');
            setIsConnected(true);
            socket.emit('joinTeam', teamId);
        });

        socket.on('receiveMessage', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Fetch history (using socket for now, could be API)
        socket.emit('getHistory', teamId, (history: Message[]) => {
            if (Array.isArray(history)) setMessages(history);
        });

        return () => {
            socket.disconnect();
        };
    }, [teamId]);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !session?.user) return;

        // Check for AI Command
        if (newMessage.startsWith('/ask')) {
            const query = newMessage.replace('/ask', '').trim();
            if (!query) return;

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: query,
                senderId: (session.user as any).id,
                sender: { name: session.user.name || 'User' },
                createdAt: new Date().toISOString()
            }]);

            setNewMessage('');

            try {
                const response = await askAI(query);
                setMessages(prev => [...prev, {
                    id: Date.now().toString() + '-ai',
                    content: response.reply,
                    senderId: 'ai-bot',
                    sender: { name: 'AI Assistant', image: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai' },
                    createdAt: new Date().toISOString()
                }]);
            } catch (err) {
                console.error(err);
            }
            return;
        }

        const payload = {
            teamId,
            senderId: (session.user as any).id,
            content: newMessage,
        };

        socket.emit('sendMessage', payload);
        setNewMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-2 border-b">
                <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Team Chat
                    {isConnected && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full" title="Connected"></span>}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, index) => {
                            const isMe = msg.senderId === (session?.user as any)?.id;
                            return (
                                <div
                                    key={index}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${isMe
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        {!isMe && (
                                            <p className="text-xs font-semibold mb-1 text-muted-foreground">
                                                {msg.sender.name}
                                            </p>
                                        )}
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1"
                    />
                    <Button onClick={handleSendMessage} size="icon">
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
