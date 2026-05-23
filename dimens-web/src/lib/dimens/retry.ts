import type { ResolvedRuntimeContext } from '@/types/micro-module';
import { DimensAuthError } from './errors';
import { refreshToken } from './auth/authService';
import type { DimensAuthState } from './auth/types';

export async function withDimensRetry<T>(
  context: ResolvedRuntimeContext,
  auth: DimensAuthState,
  runner: (auth: DimensAuthState) => Promise<T>
): Promise<T> {
  try {
    return await runner(auth);
  } catch (error) {
    if (!(error instanceof DimensAuthError)) throw error;
    const refreshed = await refreshToken(context, auth);
    if (!refreshed.token || refreshed.token === auth.token) throw error;
    return runner(refreshed);
  }
}
