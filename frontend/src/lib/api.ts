export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/logout')) {
      // Handle unauthorized across the app
      window.location.href = '/login';
    }
    throw new Error(data?.error || data?.message || 'Something went wrong');
  }

  return data;
}
