export async function requestJson<T>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as { message?: string };

  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }

  return payload as T;
}
