import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import QueueForm from './QueueForm';
import QueueList from './QueueList';
import PaymentModal from './PaymentModal';

export default function Dashboard({ user, queue, currentlyPhotographing, pricing, onLogout, refreshQueue }) {
	const [showForm, setShowForm] = useState(false);
	const [activeTab, setActiveTab] = useState('waiting');
	const [paymentModal, setPaymentModal] = useState({ open: false, entry: null });
	const [loading, setLoading] = useState(false);

	const filteredQueue = queue.filter(entry => {
		if (activeTab === 'waiting') return entry.status === 'waiting' || entry.status === 'photographing';
		if (activeTab === 'done') return entry.status === 'done';
		if (activeTab === 'cancelled') return entry.status === 'cancelled';
		return true;
	});

	const stats = {
		waiting: queue.filter(e => e.status === 'waiting').length,
		photographing: queue.filter(e => e.status === 'photographing').length,
		done: queue.filter(e => e.status === 'done').length,
		cancelled: queue.filter(e => e.status === 'cancelled').length,
		totalRevenue: queue
			.filter(e => e.status === 'done')
			.reduce((sum, e) => sum + e.totalPrice, 0),
		qrisRevenue: queue
			.filter(e => e.status === 'done' && e.paymentMethod === 'qris')
			.reduce((sum, e) => sum + e.totalPrice, 0),
		cashRevenue: queue
			.filter(e => e.status === 'done' && e.paymentMethod === 'cash')
			.reduce((sum, e) => sum + e.totalPrice, 0),
	};

	const handleSetPhotographing = async (entry) => {
		setLoading(true);
		try {
			await api.setPhotographing(entry.id);
		} catch (error) {
			alert('Gagal: ' + error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleDone = (entry) => {
		setPaymentModal({ open: true, entry });
	};

	const handlePaymentConfirm = async (paymentMethod) => {
		setLoading(true);
		try {
			await api.markDone(paymentModal.entry.id, paymentMethod);
			setPaymentModal({ open: false, entry: null });
		} catch (error) {
			alert('Gagal: ' + error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = async (entry) => {
		if (!confirm(`Yakin cancel antrian ${entry.nama}?`)) return;
		setLoading(true);
		try {
			await api.cancelQueue(entry.id);
		} catch (error) {
			alert('Gagal: ' + error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleQueueCreated = () => {
		setShowForm(false);
		refreshQueue();
	};

	const formatPrice = (price) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
		}).format(price);
	};

	return (
		<div className="dashboard">
			{/* Navbar */}
			<nav className="navbar">
				<div className="navbar-brand">
					<span className="navbar-logo">📸 Photobooth</span>
					<span className="navbar-subtitle">HUMED SINLUI 1</span>
				</div>
				<div className="navbar-user">
					{user.roles.superAdmin && (
						<Link to="/admin" className="btn btn-ghost btn-sm">
							⚙️ Admin
						</Link>
					)}
					<img src={user.picture} alt={user.name} className="user-avatar" />
					<div className="user-info">
						<div className="user-name">{user.name}</div>
						<div className="user-role">
							{user.roles.superAdmin ? 'Super Admin' : 'Admin'}
						</div>
					</div>
					<button onClick={onLogout} className="btn btn-ghost btn-sm">
						Keluar
					</button>
				</div>
			</nav>

			<div className="dashboard-content">
				{/* Stats */}
				<div className="stats-grid mb-lg">
					<div className="stat-card">
						<div className="stat-value">{stats.waiting}</div>
						<div className="stat-label">Menunggu</div>
					</div>
					<div className="stat-card">
						<div className="stat-value">{stats.done}</div>
						<div className="stat-label">Selesai</div>
					</div>
					<div className="stat-card">
						<div className="stat-value">{formatPrice(stats.totalRevenue)}</div>
						<div className="stat-label">Total Pendapatan</div>
					</div>
					<div className="stat-card">
						<div className="stat-value stat-value-sm">
							💳 {formatPrice(stats.qrisRevenue)} | 💵 {formatPrice(stats.cashRevenue)}
						</div>
						<div className="stat-label">QRIS | Cash</div>
					</div>
				</div>

				{/* Currently Photographing */}
				{currentlyPhotographing && (
					<div className="current-banner">
						<div>
							<div className="current-label">📷 Sedang Foto</div>
							<div className="current-name">
								{currentlyPhotographing.nama}
								{currentlyPhotographing.kelas && ` (${currentlyPhotographing.kelas})`}
							</div>
							<div className="text-sm" style={{ opacity: 0.9 }}>
								{currentlyPhotographing.jumlahFoto} foto • {formatPrice(currentlyPhotographing.totalPrice)}
							</div>
						</div>
						<div className="current-actions">
							<button
								onClick={() => handleDone(currentlyPhotographing)}
								className="btn btn-success"
								disabled={loading}
							>
								✓ Selesai
							</button>
							<button
								onClick={() => handleCancel(currentlyPhotographing)}
								className="btn btn-danger"
								disabled={loading}
							>
								✕ Cancel
							</button>
						</div>
					</div>
				)}

				{/* Header */}
				<div className="dashboard-header">
					<h2 className="dashboard-title">Antrian</h2>
					<div className="dashboard-actions">
						<button onClick={refreshQueue} className="btn btn-ghost btn-sm">
							🔄 Refresh
						</button>
						<button onClick={() => setShowForm(true)} className="btn btn-primary">
							+ Tambah Antrian
						</button>
					</div>
				</div>

				{/* Tabs */}
				<div className="tabs">
					<button
						className={`tab ${activeTab === 'waiting' ? 'active' : ''}`}
						onClick={() => setActiveTab('waiting')}
					>
						Menunggu ({stats.waiting + stats.photographing})
					</button>
					<button
						className={`tab ${activeTab === 'done' ? 'active' : ''}`}
						onClick={() => setActiveTab('done')}
					>
						Selesai ({stats.done})
					</button>
					<button
						className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
						onClick={() => setActiveTab('cancelled')}
					>
						Dibatalkan ({stats.cancelled})
					</button>
				</div>

				{/* Queue List */}
				<QueueList
					queue={filteredQueue}
					currentlyPhotographing={currentlyPhotographing}
					onSetPhotographing={handleSetPhotographing}
					onDone={handleDone}
					onCancel={handleCancel}
					loading={loading}
					formatPrice={formatPrice}
					activeTab={activeTab}
				/>
			</div>

			{/* Create Queue Modal */}
			{showForm && (
				<QueueForm
					pricing={pricing}
					onClose={() => setShowForm(false)}
					onCreated={handleQueueCreated}
					formatPrice={formatPrice}
				/>
			)}

			{/* Payment Modal */}
			{paymentModal.open && (
				<PaymentModal
					entry={paymentModal.entry}
					onClose={() => setPaymentModal({ open: false, entry: null })}
					onConfirm={handlePaymentConfirm}
					loading={loading}
					formatPrice={formatPrice}
				/>
			)}

			{/* Floating Action Button for Mobile */}
			<button
				className="fab"
				onClick={() => setShowForm(true)}
				aria-label="Tambah Antrian"
			>
				+
			</button>
		</div>
	);
}
