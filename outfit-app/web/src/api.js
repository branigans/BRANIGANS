const BASE = 'https://branigans-production.up.railway.app/api';

function getToken() {
  return localStorage.getItem('outfit_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('outfit_token', token);
  else localStorage.removeItem('outfit_token');
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const err = new Error((data && data.error) || `Error ${res.status}`);
    err.status = res.status;
    err.code = data && data.code;
    throw err;
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  feed: (cursor) => request(`/posts${cursor ? `?cursor=${cursor}` : ''}`),
  createPost: (formData) => request('/posts', { method: 'POST', body: formData, isForm: true }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  likePost: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
  unlikePost: (id) => request(`/posts/${id}/like`, { method: 'DELETE' }),

  profile: (username) => request(`/users/${username}`),
  updateMe: (payload) => request('/users/me', { method: 'PATCH', body: payload }),
  uploadAvatar: (formData) => request('/users/me/avatar', { method: 'POST', body: formData, isForm: true }),
  follow: (username) => request(`/users/${username}/follow`, { method: 'POST' }),
  unfollow: (username) => request(`/users/${username}/follow`, { method: 'DELETE' }),
  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),

  createCheckoutSession: () => request('/stripe/create-checkout-session', { method: 'POST' }),
  billingPortal: () => request('/stripe/portal')
};
