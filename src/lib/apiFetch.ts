export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = process.env.NEXT_PUBLIC_API_SECRET
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
  }
  return fetch(url, { ...options, headers })
}
