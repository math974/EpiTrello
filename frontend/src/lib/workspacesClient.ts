import { apolloClient } from './apollo';
import {
  MyWorkspacesDocument,
  CreateWorkspaceDocument,
  UpdateWorkspaceDocument,
  DeleteWorkspaceDocument,
  WorkspaceDocument,
  AddWorkspaceMemberDocument,
  RemoveWorkspaceMemberDocument,
  LeaveWorkspaceDocument,
  MyWorkspacesQuery,
  CreateWorkspaceMutation,
  UpdateWorkspaceMutation,
  DeleteWorkspaceMutation,
  WorkspaceQuery,
  AddWorkspaceMemberMutation,
  RemoveWorkspaceMemberMutation,
  LeaveWorkspaceMutation,
  WorkspaceModel,
  WorkspaceMemberModel,
} from '../generated/graphql';

/**
 * Fetch all workspaces for the current user
 * @returns Array of workspaces
 * @throws Error if query fails
 */
export async function myWorkspaces(): Promise<WorkspaceModel[]> {
  try {
    const { data } = await apolloClient.query<MyWorkspacesQuery>({
      query: MyWorkspacesDocument,
      fetchPolicy: 'network-only',
    });

    return data?.myWorkspaces ?? [];
  } catch (error: any) {
    throw error;
  }
}

/**
 * Create a new workspace
 * @param name Workspace name
 * @returns Created workspace
 * @throws Error if creation fails
 */
export async function createWorkspace(name: string): Promise<WorkspaceModel> {
  try {
    const { data } = await apolloClient.mutate<CreateWorkspaceMutation>({
      mutation: CreateWorkspaceDocument,
      variables: {
        input: { name },
      },
      refetchQueries: [{ query: MyWorkspacesDocument }],
    });

    if (!data?.createWorkspace) {
      throw new Error('Workspace creation failed: No data returned');
    }

    return data.createWorkspace;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Update a workspace
 * @param id Workspace ID
 * @param name New workspace name
 * @returns Updated workspace
 * @throws Error if update fails
 */
export async function updateWorkspace(id: string, name: string): Promise<WorkspaceModel> {
  try {
    const { data } = await apolloClient.mutate<UpdateWorkspaceMutation>({
      mutation: UpdateWorkspaceDocument,
      variables: {
        input: { id, name },
      },
      refetchQueries: [{ query: MyWorkspacesDocument }],
    });

    if (!data?.updateWorkspace) {
      throw new Error('Workspace update failed: No data returned');
    }

    return data.updateWorkspace;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Delete a workspace
 * @param id Workspace ID
 * @returns True if deletion succeeded
 * @throws Error if deletion fails
 */
export async function deleteWorkspace(id: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<DeleteWorkspaceMutation>({
      mutation: DeleteWorkspaceDocument,
      variables: { id },
      refetchQueries: [{ query: MyWorkspacesDocument }],
    });

    return data?.deleteWorkspace ?? false;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get a workspace by ID with its members
 * @param id Workspace ID
 * @returns Workspace with members or null if not found
 * @throws Error if query fails
 */
export async function getWorkspace(id: string): Promise<WorkspaceModel | null> {
  try {
    const { data } = await apolloClient.query<WorkspaceQuery>({
      query: WorkspaceDocument,
      variables: { id },
      fetchPolicy: 'network-only',
    });

    return data?.workspace ?? null;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Add a member to a workspace by email
 * @param workspaceId Workspace ID
 * @param email Email of the user to add
 * @returns Created workspace member
 * @throws Error if addition fails
 */
export async function addWorkspaceMember(workspaceId: string, email: string): Promise<WorkspaceMemberModel> {
  try {
    const { data } = await apolloClient.mutate<AddWorkspaceMemberMutation>({
      mutation: AddWorkspaceMemberDocument,
      variables: {
        input: { workspaceId, email },
      },
      refetchQueries: [{ query: WorkspaceDocument, variables: { id: workspaceId } }],
    });

    if (!data?.addWorkspaceMember) {
      throw new Error('Failed to add workspace member: No data returned');
    }

    return data.addWorkspaceMember;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Remove a member from a workspace
 * @param workspaceId Workspace ID
 * @param userId User ID to remove
 * @returns True if removal succeeded
 * @throws Error if removal fails
 */
export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<RemoveWorkspaceMemberMutation>({
      mutation: RemoveWorkspaceMemberDocument,
      variables: {
        input: { workspaceId, userId },
      },
      refetchQueries: [{ query: WorkspaceDocument, variables: { id: workspaceId } }],
    });

    return data?.removeWorkspaceMember ?? false;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Leave a workspace (remove yourself as a member)
 * @param workspaceId Workspace ID
 * @returns True if leaving succeeded
 * @throws Error if leaving fails (e.g., last owner cannot leave)
 */
export async function leaveWorkspace(workspaceId: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<LeaveWorkspaceMutation>({
      mutation: LeaveWorkspaceDocument,
      variables: {
        input: { workspaceId },
      },
      refetchQueries: [{ query: MyWorkspacesDocument }],
    });

    return data?.leaveWorkspace ?? false;
  } catch (error: any) {
    throw error;
  }
}

// Re-export types for convenience
export type { WorkspaceModel, WorkspaceMemberModel } from '../generated/graphql';
