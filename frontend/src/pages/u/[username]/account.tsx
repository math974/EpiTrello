import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/ui/card';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';
import { useAuth } from '@/components/auth/AuthProvider';
import DeleteAccountConfirmModal from '@/components/auth/DeleteAccountConfirmModal';
import { updateUser, deleteAccount } from '@/lib/authClient';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, checkAuth } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  useEffect(() => {
    const updateActive = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'profile' || hash === 'activity' || hash === 'settings' || hash === 'accessibility') {
        setActiveSection(hash);
        return;
      }
      setActiveSection('profile');
    };
    updateActive();
    window.addEventListener('hashchange', updateActive);
    return () => window.removeEventListener('hashchange', updateActive);
  }, []);

  useEffect(() => {
    if (!authLoading && !user && typeof window !== 'undefined') {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const handleSaveProfile = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await updateUser({ username: username.trim() || undefined, email: email.trim() || undefined });
      await checkAuth();
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err: any) {
      console.error(err);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const containerTextSize = textSize === 'sm' ? 'text-sm' : textSize === 'lg' ? 'text-lg' : 'text-base';

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-trello-bg-light flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-trello-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`min-h-full bg-trello-bg-light ${containerTextSize}`}>
      <div className="mx-auto max-w-6xl gap-6 px-6 py-6">
        <div className="mb-6">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm font-medium text-trello-blue hover:text-trello-blue-dark hover:underline"
          >
            ← Back to boards
          </Link>
        </div>
      <main className="grid gap-6 md:grid-cols-[240px,1fr]">
        <aside className="space-y-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-trello-gray/70 whitespace-nowrap">
              Personal settings
            </p>
            <nav className="mt-4 space-y-2 text-sm">
              <a
                className={`block rounded-lg px-3 py-2 font-medium ${
                  activeSection === 'profile' ? 'bg-trello-bg-gray text-trello-navy' : 'text-trello-gray hover:bg-trello-bg-gray'
                }`}
                href="#profile"
              >
                Profile and visibility
              </a>
              <a
                className={`block rounded-lg px-3 py-2 ${
                  activeSection === 'activity' ? 'bg-trello-bg-gray text-trello-navy font-medium' : 'text-trello-gray hover:bg-trello-bg-gray'
                }`}
                href="#activity"
              >
                Activity
              </a>
              <a
                className={`block rounded-lg px-3 py-2 ${
                  activeSection === 'settings' ? 'bg-trello-bg-gray text-trello-navy font-medium' : 'text-trello-gray hover:bg-trello-bg-gray'
                }`}
                href="#settings"
              >
                Settings
              </a>
              <a
                className={`block rounded-lg px-3 py-2 ${
                  activeSection === 'accessibility' ? 'bg-trello-bg-gray text-trello-navy font-medium' : 'text-trello-gray hover:bg-trello-bg-gray'
                }`}
                href="#accessibility"
              >
                Accessibility
              </a>
            </nav>
          </div>
          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-trello-gray">
            Your public profile and account preferences are managed here.
          </div>
        </aside>

        <section className="space-y-6">
          {activeSection === 'profile' && (
            <Card id="profile">
              <CardHeader>
                <CardTitle>Profile and visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-trello-navy">Username</label>
                    <Input
                      className="mt-2"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-trello-navy">Email</label>
                    <Input
                      className="mt-2"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                {saveError && (
                  <p className="text-sm text-red-600">{saveError}</p>
                )}
                <div className="flex justify-end">
                  <Button
                    className="bg-trello-blue hover:bg-trello-blue-dark"
                    onClick={handleSaveProfile}
                    disabled={saving || (username === (user?.username ?? '') && email === (user?.email ?? ''))}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'activity' && (
            <Card id="activity">
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-trello-gray">
                <p className="text-gray-500">Activity is available from the Activity button in the header.</p>
              </CardContent>
            </Card>
          )}

          {activeSection === 'settings' && (
            <Card id="settings">
              <CardHeader>
                <CardTitle>Account settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">Danger zone</p>
                      <p className="text-xs text-red-700">
                        Deleting your account will permanently remove all your data. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'accessibility' && (
            <Card id="accessibility">
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-trello-navy">Text size</label>
                  <select
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue"
                    value={textSize}
                    onChange={(e) => setTextSize(e.target.value as 'sm' | 'md' | 'lg')}
                  >
                    <option value="sm">Small</option>
                    <option value="md">Standard</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-trello-navy">Language</label>
                  <select
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue"
                    defaultValue="en"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      </div>

      <DeleteAccountConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        isLoading={deleting}
      />
    </div>
  );
}
