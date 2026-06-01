"use client";

import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Bell, Check, Users, Eye, X, Award, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/hooks/use-user';
import { getUserNotifications, markNotificationAsRead } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string; // TASK_ASSIGNED, REVIEW_REQUESTED, TASK_APPROVED, TASK_REJECTED, MEMBER_PROMOTED
    isRead: boolean;
    createdAt: string;
}

export function NotificationBell() {
    const { session } = useUser();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const { data: notifications = [], mutate } = useSWR<Notification[]>(
        session?.access_token ? '/notifications' : null,
        getUserNotifications,
        {
            refreshInterval: 10000,
            revalidateOnFocus: true,
        }
    );

    // Listen to real-time notification socket events
    useEffect(() => {
        if (!session?.access_token || !session?.user?.id) return;

        const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
        const socket = io(SOCKET_URL, {
            auth: { token: session.access_token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('[NotificationBell] Connected to Socket for user:', session.user.id);
        });

        socket.on('notification', (newNotif: Notification) => {
            console.log('[NotificationBell] Real-time notification received:', newNotif);
            mutate();
            toast({
                title: newNotif.title,
                description: newNotif.message,
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [session?.access_token, session?.user?.id, mutate, toast]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Avoid closing dropdown
        try {
            await markNotificationAsRead(id);
            mutate(
                notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
                false
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        if (unread.length === 0) return;

        try {
            await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
            mutate(
                notifications.map(n => ({ ...n, isRead: true })),
                false
            );
            toast({ description: "All notifications marked as read." });
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TASK_ASSIGNED':
                return <Users className="w-4 h-4 text-blue-500" />;
            case 'REVIEW_REQUESTED':
                return <Eye className="w-4 h-4 text-amber-500" />;
            case 'TASK_APPROVED':
                return <Check className="w-4 h-4 text-emerald-500" />;
            case 'TASK_REJECTED':
                return <X className="w-4 h-4 text-red-500" />;
            case 'MEMBER_PROMOTED':
                return <Award className="w-4 h-4 text-violet-500" />;
            default:
                return <Bell className="w-4 h-4 text-slate-500" />;
        }
    };

    if (!session?.user) return null;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full bg-slate-100/50 hover:bg-slate-200/50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-sm transition-all duration-200">
                    <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900 animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl p-0 overflow-hidden" align="end" forceMount>
                <DropdownMenuLabel className="p-4 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-medium px-2 rounded-md" onClick={handleMarkAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <ScrollArea className="h-[320px]">
                    <div className="flex flex-col">
                        {notifications.map((notif) => {
                            const timeAgo = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true });
                            return (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-3 p-4 border-b border-slate-100 dark:border-zinc-800/50 transition-colors duration-150 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 cursor-pointer ${!notif.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/5' : ''}`}
                                    onClick={(e) => !notif.isRead && handleMarkAsRead(notif.id, e as any)}
                                >
                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-slate-200/50 dark:border-zinc-700/50">
                                        {getNotificationIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-xs leading-normal ${!notif.isRead ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {notif.title}
                                            </p>
                                            {!notif.isRead && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0"
                                                    title="Mark as read"
                                                >
                                                    Mark read
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                            {notif.message}
                                        </p>
                                        <span className="text-[10px] text-slate-400 block pt-0.5">
                                            {timeAgo}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {notifications.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200/50 dark:border-zinc-700/50">
                                    <BellOff className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">All caught up!</p>
                                    <p className="text-[10px] text-slate-400 max-w-[200px]">You'll see updates here when things change.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
