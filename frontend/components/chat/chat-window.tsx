'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, MoreVertical, Pin, Bot } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { askAI, getProjectMembership } from '@/lib/api';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateTaskDialog } from '../dashboard/create-task-dialog';

interface Props {
    teamId: string;
    projectId?: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: { name: string; image?: string };
    createdAt: string;
    isPinned?: boolean;
}

let socket: Socket;

export function ChatWindow({ teamId, projectId }: Props) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [taskDialogDefaultTitle, setTaskDialogDefaultTitle] = useState('');

    useEffect(() => {
        if (session?.user && projectId) {
            // @ts-ignore
            getProjectMembership(projectId, session.user.id).then(m => {
                if (m) setRole(m.role);
            });
        }
    }, [session, projectId]);

    useEffect(() => {
        // Initialize Socket
        socket = io('http://localhost:4000');

        socket.on('connect', () => {
            console.log('Connected to chat server');
            setIsConnected(true);
            if (projectId) {
                socket.emit('joinProject', projectId);
            } else {
                socket.emit('joinTeam', teamId);
            }
        });

        socket.on('receiveMessage', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on('messagePinned', (updatedMessage: Message) => {
            setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
        });

        // Fetch history
        // If projectId is present, we ask for project history, otherwise team history
        const historyPayload = projectId ? { teamId, projectId } : teamId;
        socket.emit('getHistory', historyPayload, (history: Message[]) => {
            if (Array.isArray(history)) setMessages(history);
        });

        return () => {
            socket.disconnect();
        };
    }, [teamId, projectId]);

    // ...

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !session?.user) return;
        if (role === 'VIEWER') {
            alert("Viewers cannot send messages.");
            return;
        }

        // Check for AI Command
        if (newMessage.startsWith('/ask')) {
            // ... existing AI logic (keep as is)
            const query = newMessage.replace('/ask', '').trim();
            if (!query) return;

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: query,
                senderId: (session.user as any).id,
                sender: { name: session.user?.name || 'User' },
                createdAt: new Date().toISOString()
            }]);

            setNewMessage('');
            setIsAiLoading(true);

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
                setMessages(prev => [...prev, {
                    id: Date.now().toString() + '-error',
                    content: 'Failed to get response from AI. Please try again.',
                    senderId: 'system',
                    sender: { name: 'System' },
                    createdAt: new Date().toISOString()
                }]);
            } finally {
                setIsAiLoading(false);
            }
            return;
        }

        const payload = {
            teamId,
            senderId: (session.user as any).id,
            content: newMessage,
            projectId, // Pass projectId if exists
        };

        socket.emit('sendMessage', payload);
        setNewMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handlePinMessage = (messageId: string, isPinned: boolean) => {
        if (role === 'VIEWER') return;
        socket.emit('pinMessage', { teamId, messageId, isPinned });
    };

    const handleCreateTaskFromMessage = (content: string) => {
        if (role === 'VIEWER') return;
        setTaskDialogDefaultTitle(content);
        setTaskDialogOpen(true);
    };

    const pinnedMessages = messages.filter(m => m.isPinned);

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-2 border-b">
                <CardTitle className="flex items-center text-lg justify-between">
                    <div className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        {projectId ? 'Project Chat' : 'Team Chat'}
                        {isConnected && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full" title="Connected"></span>}
                    </div>
                </CardTitle>
                {pinnedMessages.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2">
                        <p className="font-semibold mb-1 flex items-center gap-1">
                            <Pin className="w-3 h-3" /> Pinned ({pinnedMessages.length})
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                            {pinnedMessages.map(msg => (
                                <div key={msg.id} className="bg-background border rounded px-2 py-1 min-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis">
                                    <span className="font-bold">{msg.sender.name}:</span> {msg.content}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, index) => {
                            const isMe = msg.senderId === (session?.user as any)?.id;
                            return (
                                <div
                                    key={index}
                                    className={`group flex ${isMe ? 'justify-end' : 'justify-start'} items-start gap-2`}
                                >
                                    {!isMe && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                <DropdownMenuItem onClick={() => handlePinMessage(msg.id, !msg.isPinned)}>
                                                    {msg.isPinned ? 'Unpin' : 'Pin'} Message
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleCreateTaskFromMessage(msg.content)}>
                                                    Convert to Task
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}

                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 relative ${isMe
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        {msg.isPinned && <Pin className="w-3 h-3 absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full p-0.5" />}
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

                                    {isMe && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handlePinMessage(msg.id, !msg.isPinned)}>
                                                    {msg.isPinned ? 'Unpin' : 'Pin'} Message
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleCreateTaskFromMessage(msg.content)}>
                                                    Convert to Task
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                        {isAiLoading && (
                            <div className="flex justify-start items-center gap-2 text-muted-foreground text-sm italic">
                                <Bot className="w-4 h-4 animate-bounce" /> AI is thinking...
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                    <Input
                        placeholder={role === 'VIEWER' ? "Viewers cannot send messages" : "Type a message..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1"
                        disabled={role === 'VIEWER'}
                    />
                    <Button onClick={handleSendMessage} size="icon" disabled={role === 'VIEWER'}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>

                <CreateTaskDialog
                    teamId={teamId}
                    open={taskDialogOpen}
                    onOpenChange={setTaskDialogOpen}
                    defaultTitle={taskDialogDefaultTitle}
                />
            </CardContent>
        </Card>
    );
}
