// Single place that knows where the backend lives.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://thinkcheck.onrender.com').replace(/\/+$/, '');

// POSTs JSON to the backend and returns the parsed response, throwing an Error
// with the server's message when the request fails.
export async function postJSON(path, body) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the ThinkCheck server. If it was idle it may take up to a minute to wake up, so please try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (HTTP ${res.status}).`);
  }
  return data;
}
