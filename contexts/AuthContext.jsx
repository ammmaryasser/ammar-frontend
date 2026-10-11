"use client";
import {createContext, useCallback, useContext, useEffect, useRef, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {me, login, logout} from "@/lib/auth";
import {resetReferenceCache, safeReturnPath} from "@/lib/api";
import ResourceState from "@/components/ui/ResourceState";
const AuthContext = createContext(null);
export function AuthProvider({children}) {
  const [state, setState] = useState({user: null, loading: true, error: null});
  const sequence = useRef(0);
  const invalidate = useCallback(() => {sequence.current++;}, []);
  const check = useCallback(() => {
    const id = ++sequence.current;
    return me().then(user => {
      if (id === sequence.current) setState({user, loading: false, error: null});
    }, error => {
      if (id === sequence.current) {
        if (error.status === 401) resetReferenceCache();
        setState({user: null, loading: false, error: error.status === 401 ? null : error});
      }
    });
  }, []);
  useEffect(() => {
    check();
    const expired = () => {invalidate(); resetReferenceCache(); setState({user: null, loading: false, error: null});};
    window.addEventListener("ay-session-expired", expired);
    return () => {invalidate(); window.removeEventListener("ay-session-expired", expired);};
  }, [check, invalidate]);
  async function signIn(username, password) {
    const id = ++sequence.current;
    try {
      await login(username, password); const user = await me();
      if (id === sequence.current) setState({user, loading: false, error: null});
    } catch (error) {
      if (id === sequence.current) setState(previous => ({...previous, loading: false,
        error: error.status === 0 || error.status >= 500 ? error : null}));
      throw error;
    }
  }
  async function signOut() {
    const id = ++sequence.current; await logout();
    if (id === sequence.current) setState({user: null, loading: false, error: null});
  }
  return <AuthContext.Provider value={{...state, check, signIn, signOut}}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
export function AuthGate({children}) {
  const {user, loading, error, check} = useAuth();
  const router = useRouter(); const pathname = usePathname();
  useEffect(() => {
    if (!loading && !error && !user) {
      const next = safeReturnPath(window.location.pathname + window.location.search);
      router.replace("/login?next=" + encodeURIComponent(next));
    }
  }, [loading, error, user, pathname, router]);
  if (loading || error) return <ResourceState loading={loading} error={error} retry={check}/>;
  if (!user) return null;
  return children;
}
