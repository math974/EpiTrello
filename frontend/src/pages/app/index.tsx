import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';
import { myWorkspaces } from '@/lib/workspacesClient';

// Disable static generation for this page (requires authentication)
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default function AppIndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Redirect to first workspace or show empty state
  useEffect(() => {
    if (!loading && user) {
      const fetchAndRedirect = async () => {
        try {
          const workspaces = await myWorkspaces();
          if (workspaces.length > 0) {
            router.replace(`/app/workspaces/${workspaces[0].id}`);
          }
          // If no workspaces, the sidebar will show empty state
        } catch (error) {
          console.error('Error fetching workspaces:', error);
          // Sidebar will handle error state
        }
      };
      fetchAndRedirect();
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-trello-bg-light">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-trello-blue border-t-transparent mx-auto" />
          <p className="text-sm text-trello-gray">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show empty state if no workspaces (sidebar will handle this, but show a message here too)
  return (
    <div className="flex min-h-screen items-center justify-center bg-trello-bg-light p-6">
      <div className="text-center">
        <p className="text-trello-gray">Select a workspace from the sidebar or create a new one.</p>
      </div>
    </div>
  );
}
