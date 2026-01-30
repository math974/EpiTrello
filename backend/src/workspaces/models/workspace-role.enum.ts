import { registerEnumType } from '@nestjs/graphql';
import { WorkspaceRole } from '@prisma/client';

registerEnumType(WorkspaceRole, { name: 'WorkspaceRole' });

export { WorkspaceRole };

