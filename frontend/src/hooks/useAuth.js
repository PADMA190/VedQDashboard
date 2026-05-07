import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  authStart,
  authSuccess,
  authFailure,
  tokenRefreshed,
  logout as logoutAction,
  selectAuth,
} from '@/store/authSlice';
import {
  authApi,
  setAccessToken,
  configureAuthHooks,
  unwrapApiError,
} from '@/api';
import { pushToast } from '@/store/uiSlice';

let initOnce = false;

export function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  // Sync Redux access token → axios in-memory holder
  useEffect(() => {
    setAccessToken(auth.accessToken);
  }, [auth.accessToken]);

  // Wire axios refresh + 401 hooks once for the lifetime of the app
  useEffect(() => {
    configureAuthHooks({
      refresh: async () => {
        try {
          const { accessToken, user } = await authApi.refresh();
          dispatch(tokenRefreshed({ accessToken, user }));
          return accessToken;
        } catch (err) {
          dispatch(logoutAction());
          throw err;
        }
      },
      onUnauthorized: () => {
        dispatch(logoutAction());
      },
    });
  }, [dispatch]);

  // On first mount, attempt a silent refresh to restore the session.
  useEffect(() => {
    if (initOnce) return;
    initOnce = true;
    if (auth.status !== 'idle') return;
    dispatch(authStart());
    authApi
      .refresh()
      .then(({ accessToken, user }) => {
        dispatch(authSuccess({ accessToken, user }));
      })
      .catch(() => {
        dispatch(authFailure(null));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (credentials) => {
      dispatch(authStart());
      try {
        const { accessToken, user } = await authApi.login(credentials);
        dispatch(authSuccess({ accessToken, user }));
        return user;
      } catch (err) {
        const e = unwrapApiError(err);
        dispatch(authFailure(e));
        throw e;
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (payload) => {
      dispatch(authStart());
      try {
        const { accessToken, user } = await authApi.register(payload);
        dispatch(authSuccess({ accessToken, user }));
        return user;
      } catch (err) {
        const e = unwrapApiError(err);
        dispatch(authFailure(e));
        throw e;
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — server-side cleanup is best-effort
    }
    dispatch(logoutAction());
    dispatch(pushToast({ kind: 'info', message: 'Signed out.' }));
  }, [dispatch]);

  return {
    user: auth.user,
    accessToken: auth.accessToken,
    status: auth.status,
    error: auth.error,
    isAuthenticated: auth.status === 'authenticated',
    isAuthLoading: auth.status === 'loading' || auth.status === 'idle',
    login,
    register,
    logout,
  };
}
