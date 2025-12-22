import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { api } from './utils/api';
import { useSocket } from './hooks/useSocket';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import SuperAdminPanel from './components/SuperAdminPanel';

function AuthCallback() {
	const navigate = useNavigate();

	useEffect(() => {
		// After Google OAuth callback, redirect to dashboard
		navigate('/dashboard', { replace: true });
	}, [navigate]);

	return <div className="login-container"><div className="spinner"></div></div>;
}

function ProtectedRoute({ children, user, requiredRole }) {
	if (!user) {
		return <Navigate to="/" replace />;
	}

	if (requiredRole === 'admin' && !user.roles.photoboothAdmin && !user.roles.superAdmin) {
		return <Navigate to="/" replace />;
	}

	if (requiredRole === 'superAdmin' && !user.roles.superAdmin) {
		return <Navigate to="/dashboard" replace />;
	}

	return children;
}

function App() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [queue, setQueue] = useState([]);
	const [currentlyPhotographing, setCurrentlyPhotographing] = useState(null);
	const [pricing, setPricing] = useState({ bundle2: 0, bundle4: 0 });

	const handleQueueUpdate = useCallback((data) => {
		setQueue(data.queue);
		setCurrentlyPhotographing(data.currentlyPhotographing);
	}, []);

	const handleConfigUpdate = useCallback((data) => {
		if (data.pricing) {
			setPricing(data.pricing);
		}
	}, []);

	const { connect, disconnect } = useSocket(handleQueueUpdate, handleConfigUpdate);

	useEffect(() => {
		async function checkAuth() {
			try {
				const { user } = await api.getMe();
				setUser(user);

				// Check if user has admin access
				if (user.roles.photoboothAdmin || user.roles.superAdmin) {
					connect();
					const data = await api.getQueue();
					setQueue(data.queue);
					setCurrentlyPhotographing(data.currentlyPhotographing);
					setPricing(data.pricing);
				}
			} catch (error) {
				console.log('Not authenticated');
			} finally {
				setLoading(false);
			}
		}

		checkAuth();

		return () => disconnect();
	}, [connect, disconnect]);

	const handleLogout = async () => {
		try {
			await api.logout();
			disconnect();
			setUser(null);
			setQueue([]);
			setCurrentlyPhotographing(null);
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	const refreshQueue = async () => {
		try {
			const data = await api.getQueue();
			setQueue(data.queue);
			setCurrentlyPhotographing(data.currentlyPhotographing);
			setPricing(data.pricing);
		} catch (error) {
			console.error('Failed to refresh queue:', error);
		}
	};

	if (loading) {
		return (
			<div className="login-container">
				<div className="spinner"></div>
			</div>
		);
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path="/"
					element={
						user?.roles?.photoboothAdmin || user?.roles?.superAdmin
							? <Navigate to="/dashboard" replace />
							: <LoginPage user={user} />
					}
				/>
				<Route path="/auth/callback" element={<AuthCallback />} />
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute user={user} requiredRole="admin">
							<Dashboard
								user={user}
								queue={queue}
								currentlyPhotographing={currentlyPhotographing}
								pricing={pricing}
								onLogout={handleLogout}
								refreshQueue={refreshQueue}
							/>
						</ProtectedRoute>
					}
				/>
				<Route
					path="/admin"
					element={
						<ProtectedRoute user={user} requiredRole="superAdmin">
							<SuperAdminPanel
								user={user}
								onLogout={handleLogout}
								pricing={pricing}
								setPricing={setPricing}
							/>
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
