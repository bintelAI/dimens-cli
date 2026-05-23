import type { DimensWebHostProps } from '@/types/micro-module';

const KEY = 'dimens-web:runtime';

export function getLocalRuntime(): DimensWebHostProps | undefined {
  const raw = localStorage.getItem(KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as DimensWebHostProps;
  } catch {
    return undefined;
  }
}

export function saveLocalRuntime(runtime: DimensWebHostProps) {
  localStorage.setItem(KEY, JSON.stringify(runtime));
}

export function clearLocalRuntime() {
  localStorage.removeItem(KEY);
}
