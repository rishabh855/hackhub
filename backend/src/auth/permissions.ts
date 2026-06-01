import { ProjectRole } from '../projects/project-role.enum';

export const MEMBER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['REVIEW'],
    REVIEW: [],
    DONE: [],
};

export const LEADER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    TODO: ['IN_PROGRESS', 'REVIEW', 'DONE'],
    IN_PROGRESS: ['TODO', 'REVIEW', 'DONE'],
    REVIEW: ['IN_PROGRESS', 'DONE'],
    DONE: ['REVIEW'],
};

export const OWNER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    TODO: ['IN_PROGRESS', 'REVIEW', 'DONE'],
    IN_PROGRESS: ['TODO', 'REVIEW', 'DONE'],
    REVIEW: ['IN_PROGRESS', 'DONE'],
    DONE: ['REVIEW'],
};

export function canMoveTask(role: string, currentStatus: string, nextStatus: string): boolean {
    if (currentStatus === nextStatus) return true;
    
    let allowed: string[] = [];
    if (role === 'OWNER') {
        allowed = OWNER_ALLOWED_TRANSITIONS[currentStatus] || [];
    } else if (role === 'LEADER') {
        allowed = LEADER_ALLOWED_TRANSITIONS[currentStatus] || [];
    } else {
        allowed = MEMBER_ALLOWED_TRANSITIONS[currentStatus] || [];
    }
    return allowed.includes(nextStatus);
}

export function canAssignTask(role: string): boolean {
    return role === 'OWNER' || role === 'LEADER';
}

export function canApproveTask(role: string): boolean {
    return role === 'OWNER' || role === 'LEADER';
}

export function canManageTeam(role: string): boolean {
    return role === 'OWNER';
}

export function canViewTask(role: string, taskAssigneeIds: string[], userId: string): boolean {
    if (role === 'OWNER' || role === 'LEADER') return true;
    // Members can only view tasks assigned to them
    return taskAssigneeIds.includes(userId);
}

export function canEditTask(role: string, taskAssigneeIds: string[], userId: string): boolean {
    if (role === 'OWNER' || role === 'LEADER') return true;
    return taskAssigneeIds.includes(userId);
}
