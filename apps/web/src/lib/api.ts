const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function fetchWithAuth<T = unknown>(
  path: string,
  token?: string | null,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const errorObj = data?.error as Record<string, unknown> | undefined;
    const errorMessage = errorObj?.message || data?.message || 'Request failed';
    throw new Error(typeof errorMessage === 'string' ? errorMessage : 'Request failed');
  }

  return data as unknown as ApiResponse<T>;
}
