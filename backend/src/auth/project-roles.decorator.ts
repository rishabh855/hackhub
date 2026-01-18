import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '../projects/project-role.enum';

export const ROLES_KEY = 'project_roles';
export const ProjectRoles = (...roles: ProjectRole[]) => SetMetadata(ROLES_KEY, roles);
