'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/app/contexts/UserContext';

interface User {
  id: string;
  username: string | null;
  created_at: string;
  is_admin: boolean;
  ever_set_username: boolean;
  vote_count: number;
  comment_count: number;
}

const AllUsersPage = () => {
  const { userId, isAdmin, loading: userLoading } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isAdmin) return;
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/admin/users/list?requestingUserId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [userId, isAdmin]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  if (userLoading) {
    return <div className="p-8 text-gray-400">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="p-8 text-gray-400">You must be an admin to view this page.</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-gray-400">Loading users...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (users.length === 0) {
    return <div className="p-8 text-gray-400">No users yet</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">All Users ({users.length})</h1>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="border border-gray-700 p-3 bg-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-300">{user.username || <span className="text-gray-500 italic">No username</span>}</span>
              {user.is_admin && <span className="text-xs text-yellow-400">admin</span>}
              {!user.ever_set_username && user.username && <span className="text-xs text-gray-500">(auto)</span>}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">{user.vote_count} votes</span>
              <span className="text-gray-500">{user.comment_count} comments</span>
              <span className="text-xs text-gray-500">{formatDate(user.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllUsersPage;
