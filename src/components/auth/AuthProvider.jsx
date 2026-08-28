import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../hooks/useAuth';
import {
  getStoredUser,
  onAuthStateChange,
  signOut as authSignOut,
} from '../../services/authService';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Restores an existing session before the first paint decides what to show.
    (async () => {
      const current = await getStoredUser();
      if (cancelled) return;
      setUser(current);
      setIsLoading(false);
    })();

    const subscription = onAuthStateChange((event, nextUser) => {
      if (cancelled) return;
      const resolved = event === 'SIGNED_OUT' ? null : nextUser;
      // Every auth event delivers a fresh object for the same person. Keeping
      // the previous reference stops downstream effects re-running on each
      // token refresh.
      setUser((prev) => (prev?.id && prev.id === resolved?.id ? prev : resolved));
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  // State is not cleared here; the SIGNED_OUT listener above owns that.
  const signOut = useCallback(() => authSignOut(), []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), signOut }),
    [user, isLoading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
