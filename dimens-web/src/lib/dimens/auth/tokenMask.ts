export function maskToken(token?: string): string | undefined {
  if (!token) return undefined;
  if (token.length <= 10) return `${token.slice(0, 2)}***${token.slice(-2)}`;
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
