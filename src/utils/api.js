const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchWithCredentials(url, options = {}) {
	const response = await fetch(`${API_URL}${url}`, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Request failed' }));
		throw new Error(error.error || 'Request failed');
	}

	return response.json();
}

export const api = {
	// Auth
	getMe: () => fetchWithCredentials('/auth/me'),
	logout: () => fetchWithCredentials('/auth/logout', { method: 'POST' }),
	getLoginUrl: () => `${API_URL}/auth/google?origin=${encodeURIComponent(window.location.origin)}`,

	// Queue
	getQueue: () => fetchWithCredentials('/api/photobooth/queue'),
	createQueue: (data) => fetchWithCredentials('/api/photobooth/queue', {
		method: 'POST',
		body: JSON.stringify(data),
	}),
	setPhotographing: (id) => fetchWithCredentials(`/api/photobooth/queue/${id}/photograph`, {
		method: 'POST',
	}),
	markDone: (id, paymentMethod) => fetchWithCredentials(`/api/photobooth/queue/${id}/done`, {
		method: 'POST',
		body: JSON.stringify({ paymentMethod }),
	}),
	cancelQueue: (id) => fetchWithCredentials(`/api/photobooth/queue/${id}/cancel`, {
		method: 'POST',
	}),
	forceAction: (id, action, paymentMethod) => fetchWithCredentials(`/api/photobooth/queue/${id}/force`, {
		method: 'POST',
		body: JSON.stringify({ action, paymentMethod }),
	}),
	resetQueue: () => fetchWithCredentials('/api/photobooth/reset', { method: 'POST' }),

	// Pricing
	getPricing: () => fetchWithCredentials('/api/photobooth/pricing'),
	updatePricing: (pricing) => fetchWithCredentials('/api/photobooth/pricing', {
		method: 'PUT',
		body: JSON.stringify(pricing),
	}),

	// Admins
	getAdmins: () => fetchWithCredentials('/api/photobooth/admins'),
	updateAdmins: (admins) => fetchWithCredentials('/api/photobooth/admins', {
		method: 'PUT',
		body: JSON.stringify({ admins }),
	}),

	// Spreadsheet config
	getSpreadsheetConfig: () => fetchWithCredentials('/api/photobooth/spreadsheet-config'),
	updateSpreadsheetConfig: (config) => fetchWithCredentials('/api/photobooth/spreadsheet-config', {
		method: 'PUT',
		body: JSON.stringify(config),
	}),
	testConnection: () => fetchWithCredentials('/api/photobooth/test-connection'),

	// Super admin
	getSuperAdmins: () => fetchWithCredentials('/api/admin/super-admins'),
	updateSuperAdmins: (superAdmins) => fetchWithCredentials('/api/admin/super-admins', {
		method: 'PUT',
		body: JSON.stringify({ superAdmins }),
	}),
};

export { API_URL };
