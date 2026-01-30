import { WorkspaceRole } from './workspace-role.enum';

describe('WorkspaceRole', () => {
  it('exposes OWNER and MEMBER roles', () => {
    expect(WorkspaceRole.OWNER).toBe('OWNER');
    expect(WorkspaceRole.MEMBER).toBe('MEMBER');
  });
});

