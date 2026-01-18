import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '../projects/project-role.enum';

export const Roles = (...roles: ProjectRole[]) => SetMetadata('roles', roles);
