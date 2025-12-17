import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import Navbar from '../components/Navbar';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';
import { CREATE_BOARD, CREATE_USER, GET_BOARDS, GET_USERS } from '../lib/queries';

type User = {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  createdAt: string;
};

type Board = {
  id: string;
  title: string;
  description?: string | null;
  background: string;
  owner: User;
  createdAt: string;
  updatedAt: string;
};

type CreateBoardInput = {
  title: string;
  background: string;
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const {
    data: boardsData,
    loading: boardsLoading,
    refetch: refetchBoards,
  } = useQuery<{ boards: Board[] }>(GET_BOARDS);

  const {
    data: usersData,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery<{ users: User[] }>(GET_USERS);

  const [createBoard] = useMutation<{ createBoard: Board }, CreateBoardInput & { ownerId: string }>(CREATE_BOARD);
  const [createUser] = useMutation<{ createUser: User }, { username: string; email: string; avatar?: string | null }>(
    CREATE_USER
  );

  useEffect(() => {
    const initUser = async () => {
      if (!usersLoading && usersData) {
        if (usersData.users.length === 0) {
          try {
            const { data } = await createUser({
              variables: {
                username: 'Utilisateur',
                email: 'user@epitrello.com',
              },
            });
            if (data?.createUser) {
              setCurrentUser(data.createUser);
            }
            refetchUsers();
          } catch (error) {
            console.error('Error creating user:', error);
          }
        } else {
          setCurrentUser(usersData.users[0]);
        }
      }
    };
    void initUser();
  }, [usersLoading, usersData, createUser, refetchUsers]);

  const handleCreateBoard = async ({ title, background }: CreateBoardInput) => {
    if (!currentUser) return;
    try {
      await createBoard({
        variables: {
          title,
          background,
          ownerId: currentUser.id,
        },
      });
      refetchBoards();
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const boards = boardsData?.boards ?? [];
  const isLoading = boardsLoading || usersLoading;

  return (
    <div className="min-h-screen bg-trello-bg-light">
      <Navbar />

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-trello-navy mb-2">Bienvenue sur EpiTrello ! 👋</h1>
          <p className="text-trello-gray">Gérez vos projets et collaborez avec votre équipe efficacement.</p>
        </div>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-trello-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-lg font-semibold text-trello-navy">Vos tableaux</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {boards.map((board) => (
                <BoardCard key={board.id} board={board} onClick={() => console.log('Navigate to board:', board.id)} />
              ))}
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-24 bg-trello-bg-gray hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <span className="text-trello-gray font-medium">+ Créer un tableau</span>
              </button>
            </div>
          )}
        </section>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Tableaux"
            value={boards.length}
            icon={
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="18" rx="1.5" />
                <rect x="14" y="3" width="7" height="11" rx="1.5" />
              </svg>
            }
            color="bg-trello-blue"
          />
          <StatCard
            title="Membres"
            value={usersData?.users?.length || 0}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            }
            color="bg-green-500"
          />
          <StatCard
            title="Statut API"
            value="Connecté"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="bg-purple-500"
          />
        </section>
      </main>

      <CreateBoardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateBoard} />
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4">
      <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      <div>
        <p className="text-sm text-trello-gray">{title}</p>
        <p className="text-2xl font-bold text-trello-navy">{value}</p>
      </div>
    </div>
  );
}

