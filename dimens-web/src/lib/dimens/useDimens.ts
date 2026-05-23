import { useEffect, useState } from 'react';
import { useRuntimeStore } from '@/store/runtimeStore';
import { createRetryableDimensAppSdk, type RetryableDimensAppSdk } from './appSdk';
import type { DimensAuthState } from './auth/types';

export function useDimens() {
  const context = useRuntimeStore(state => state.context);
  const auth = useRuntimeStore(state => state.auth);
  const [sdk, setSdk] = useState<RetryableDimensAppSdk>(() => createRetryableDimensAppSdk(context, ensureAuth(auth)));

  useEffect(() => {
    setSdk(createRetryableDimensAppSdk(context, ensureAuth(auth)));
  }, [auth, context]);

  return sdk;
}

function ensureAuth(auth?: DimensAuthState): DimensAuthState {
  return auth || { source: 'none' };
}
