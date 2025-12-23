import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

// Helper to extract nomor induk from email
function emailToNomorInduk(email) {
	if (!email) return null;
	const match = email.match(/^u(\d+)@s\.smakstlouis1sby\.sch\.id$/i);
	return match ? match[1] : email; // Return original if doesn't match pattern
}

export default function SuperAdminPanel({ user, onLogout, pricing, setPricing }) {
	const [admins, setAdmins] = useState([]);
	const [superAdmins, setSuperAdmins] = useState([]);
	const [spreadsheetConfig, setSpreadsheetConfig] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);

	// Form states - now using nomor induk instead of full email
	const [newAdmin, setNewAdmin] = useState('');
	const [newSuperAdmin, setNewSuperAdmin] = useState('');
	const [bundle2Price, setBundle2Price] = useState(pricing.bundle2);
	const [bundle4Price, setBundle4Price] = useState(pricing.bundle4);
	const [sheetName, setSheetName] = useState('');
	const [spreadsheetId, setSpreadsheetId] = useState('');

	useEffect(() => {
		loadData();
	}, []);

	const showError = (message) => {
		setError(message);
		setSuccess(null);
		setTimeout(() => setError(null), 5000);
	};

	const showSuccess = (message) => {
		setSuccess(message);
		setError(null);
		setTimeout(() => setSuccess(null), 3000);
	};

	const loadData = async () => {
		try {
			const [adminsData, superAdminsData, spreadsheetData] = await Promise.all([
				api.getAdmins(),
				api.getSuperAdmins(),
				api.getSpreadsheetConfig(),
			]);
			setAdmins(adminsData.admins);
			setSuperAdmins(superAdminsData.superAdmins);
			setSpreadsheetConfig(spreadsheetData.spreadsheet);
			setSheetName(spreadsheetData.spreadsheet?.sheetName || 'Sheet1');
			setSpreadsheetId(spreadsheetData.spreadsheet?.spreadsheetId || '');
		} catch (err) {
			showError('Gagal memuat data: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleAddAdmin = async () => {
		const nomorInduk = newAdmin.trim();
		if (!nomorInduk || !/^\d+$/.test(nomorInduk)) {
			showError('Nomor induk harus berupa angka');
			return;
		}
		setSaving(true);
		try {
			const updated = [...admins, nomorInduk];
			await api.updateAdmins(updated);
			setAdmins(updated);
			setNewAdmin('');
			showSuccess('Admin berhasil ditambahkan');
		} catch (err) {
			showError('Gagal menambah admin: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveAdmin = async (nomorInduk) => {
		if (!confirm(`Hapus ${nomorInduk} dari admin?`)) return;
		setSaving(true);
		try {
			const updated = admins.filter(e => e !== nomorInduk);
			await api.updateAdmins(updated);
			setAdmins(updated);
			showSuccess('Admin berhasil dihapus');
		} catch (err) {
			showError('Gagal menghapus admin: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleAddSuperAdmin = async () => {
		const nomorInduk = newSuperAdmin.trim();
		if (!nomorInduk || !/^\d+$/.test(nomorInduk)) {
			showError('Nomor induk harus berupa angka');
			return;
		}
		setSaving(true);
		try {
			const updated = [...superAdmins, nomorInduk];
			await api.updateSuperAdmins(updated);
			setSuperAdmins(updated);
			setNewSuperAdmin('');
			showSuccess('Super admin berhasil ditambahkan');
		} catch (err) {
			showError('Gagal menambah super admin: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveSuperAdmin = async (nomorInduk) => {
		const currentUserNomorInduk = emailToNomorInduk(user.email);
		if (nomorInduk === currentUserNomorInduk) {
			showError('Tidak bisa menghapus diri sendiri dari super admin');
			return;
		}
		if (!confirm(`Hapus ${nomorInduk} dari super admin?`)) return;
		setSaving(true);
		try {
			const updated = superAdmins.filter(e => e !== nomorInduk);
			await api.updateSuperAdmins(updated);
			setSuperAdmins(updated);
			showSuccess('Super admin berhasil dihapus');
		} catch (err) {
			showError('Gagal menghapus super admin: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleUpdatePricing = async () => {
		if (bundle2Price <= 0 || bundle4Price <= 0) {
			showError('Harga harus lebih dari 0');
			return;
		}
		setSaving(true);
		try {
			await api.updatePricing({ bundle2: bundle2Price, bundle4: bundle4Price });
			setPricing({ bundle2: bundle2Price, bundle4: bundle4Price });
			showSuccess('Harga berhasil diupdate!');
		} catch (err) {
			showError('Gagal update harga: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleUpdateSpreadsheetConfig = async () => {
		if (!spreadsheetConfig) return;
		if (!sheetName.trim()) {
			showError('Nama sheet tidak boleh kosong');
			return;
		}
		setSaving(true);
		try {
			const updatedConfig = {
				...spreadsheetConfig,
				spreadsheetId: spreadsheetId.trim(),
				sheetName: sheetName.trim()
			};
			await api.updateSpreadsheetConfig(updatedConfig);
			setSpreadsheetConfig(updatedConfig);
			showSuccess('Konfigurasi spreadsheet berhasil diupdate!');
		} catch (err) {
			showError('Gagal update spreadsheet config: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleTestConnection = async () => {
		setSaving(true);
		try {
			const result = await api.testConnection();
			if (result.success) {
				showSuccess('Koneksi spreadsheet berhasil!');
			} else {
				showError('Koneksi gagal: ' + result.message);
			}
		} catch (err) {
			showError('Gagal test koneksi: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleResetQueue = async () => {
		if (!confirm('Yakin reset semua antrian? Data akan hilang dari memori (spreadsheet tetap aman).')) return;
		setSaving(true);
		try {
			await api.resetQueue();
			showSuccess('Antrian berhasil direset!');
		} catch (err) {
			showError('Gagal reset antrian: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	const formatPrice = (price) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
		}).format(price);
	};

	// Get current user's nomor induk for comparison
	const currentUserNomorInduk = emailToNomorInduk(user.email);

	if (loading) {
		return (
			<div className="login-container">
				<div className="spinner"></div>
			</div>
		);
	}

	return (
		<div className="dashboard">
			<nav className="navbar">
				<div className="navbar-brand">
					<span className="navbar-logo">⚙️ Super Admin</span>
					<span className="navbar-subtitle">Photobooth - HUMED SINLUI 1</span>
				</div>
				<div className="navbar-user">
					<Link to="/dashboard" className="btn btn-ghost btn-sm">
						← Dashboard
					</Link>
					<img src={user.picture} alt={user.name} className="user-avatar" />
					<div className="user-info">
						<div className="user-name">{user.name}</div>
						<div className="user-role">Super Admin</div>
					</div>
					<button onClick={onLogout} className="btn btn-ghost btn-sm">
						Keluar
					</button>
				</div>
			</nav>

			<div className="dashboard-content">
				{/* Error/Success Messages */}
				{error && (
					<div className="card mb-lg" style={{ borderColor: 'var(--danger-500)', background: 'rgba(239, 68, 68, 0.1)' }}>
						<div style={{ color: 'var(--danger-500)', fontWeight: 600 }}>
							❌ {error}
						</div>
					</div>
				)}
				{success && (
					<div className="card mb-lg" style={{ borderColor: 'var(--success-500)', background: 'rgba(34, 197, 94, 0.1)' }}>
						<div style={{ color: 'var(--success-500)', fontWeight: 600 }}>
							✅ {success}
						</div>
					</div>
				)}

				<h2 className="dashboard-title mb-lg">Pengaturan Super Admin</h2>

				<div className="admin-grid">
					{/* Pricing Card */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">💰 Harga Bundle</h3>
						</div>
						<div className="input-group mb-md">
							<label className="input-label">Bundle 2 Foto</label>
							<input
								type="number"
								className="input"
								value={bundle2Price}
								onChange={(e) => setBundle2Price(parseInt(e.target.value) || 0)}
							/>
						</div>
						<div className="input-group mb-md">
							<label className="input-label">Bundle 4 Foto</label>
							<input
								type="number"
								className="input"
								value={bundle4Price}
								onChange={(e) => setBundle4Price(parseInt(e.target.value) || 0)}
							/>
						</div>
						<button
							onClick={handleUpdatePricing}
							className="btn btn-primary w-full"
							disabled={saving}
						>
							{saving ? <span className="spinner"></span> : 'Simpan Harga'}
						</button>
					</div>

					{/* Spreadsheet Config Card */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">📊 Konfigurasi Spreadsheet</h3>
						</div>
						<div className="input-group mb-md">
							<label className="input-label">Spreadsheet ID</label>
							<input
								type="text"
								className="input"
								value={spreadsheetId}
								onChange={(e) => setSpreadsheetId(e.target.value)}
								placeholder="1gP39Pc4AECHjey4dA-dp4mayr7Sl8sSWsjhYBikpL5k"
							/>
						</div>
						<div className="input-group mb-md">
							<label className="input-label">Nama Sheet</label>
							<input
								type="text"
								className="input"
								value={sheetName}
								onChange={(e) => setSheetName(e.target.value)}
								placeholder="Contoh: Day 1, 2/12"
							/>
						</div>
						<div className="flex gap-sm">
							<button
								onClick={handleUpdateSpreadsheetConfig}
								className="btn btn-primary"
								disabled={saving}
								style={{ flex: 1 }}
							>
								{saving ? <span className="spinner"></span> : 'Simpan'}
							</button>
							<button
								onClick={handleTestConnection}
								className="btn btn-secondary"
								disabled={saving}
							>
								Test Koneksi
							</button>
						</div>
					</div>

					{/* Admins Card */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">👤 Admin</h3>
							<p className="text-sm text-muted">Berlaku untuk Photobooth & Puyer</p>
						</div>
						<div className="email-list mb-md">
							{admins.length === 0 ? (
								<p className="text-sm text-muted">Belum ada admin</p>
							) : (
								admins.map(nomorInduk => (
									<div key={nomorInduk} className="email-item">
										<span className="email-text">{nomorInduk}</span>
										<button
											onClick={() => handleRemoveAdmin(nomorInduk)}
											className="btn btn-ghost btn-sm"
											disabled={saving}
										>
											✕
										</button>
									</div>
								))
							)}
						</div>
						<div className="flex gap-sm">
							<input
								type="text"
								className="input"
								value={newAdmin}
								onChange={(e) => setNewAdmin(e.target.value)}
								placeholder="Nomor Induk (cth: 31037)"
							/>
							<button
								onClick={handleAddAdmin}
								className="btn btn-primary"
								disabled={saving}
							>
								+
							</button>
						</div>
					</div>

					{/* Super Admins Card */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">👑 Super Admin</h3>
						</div>
						<div className="email-list mb-md">
							{superAdmins.map(nomorInduk => (
								<div key={nomorInduk} className="email-item">
									<span className="email-text">
										{nomorInduk} {nomorInduk === currentUserNomorInduk && '(Kamu)'}
									</span>
									<button
										onClick={() => handleRemoveSuperAdmin(nomorInduk)}
										className="btn btn-ghost btn-sm"
										disabled={saving || nomorInduk === currentUserNomorInduk}
									>
										✕
									</button>
								</div>
							))}
						</div>
						<div className="flex gap-sm">
							<input
								type="text"
								className="input"
								value={newSuperAdmin}
								onChange={(e) => setNewSuperAdmin(e.target.value)}
								placeholder="Nomor Induk (cth: 31037)"
							/>
							<button
								onClick={handleAddSuperAdmin}
								className="btn btn-primary"
								disabled={saving}
							>
								+
							</button>
						</div>
					</div>

					{/* Column Config Card */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">📊 Konfigurasi Kolom</h3>
						</div>
						{spreadsheetConfig && (
							<>
								<div className="input-group mb-md">
									<label className="input-label">Start Row</label>
									<input
										type="number"
										className="input"
										value={spreadsheetConfig.startRow}
										onChange={(e) => setSpreadsheetConfig({
											...spreadsheetConfig,
											startRow: parseInt(e.target.value) || 2
										})}
									/>
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
									<div className="input-group">
										<label className="input-label">📝 Nama</label>
										<input
											type="text"
											className="input"
											value={spreadsheetConfig.columns.nama}
											onChange={(e) => setSpreadsheetConfig({
												...spreadsheetConfig,
												columns: { ...spreadsheetConfig.columns, nama: e.target.value.toUpperCase() }
											})}
											maxLength={2}
											placeholder="B"
										/>
									</div>
									<div className="input-group">
										<label className="input-label">🏫 Kelas</label>
										<input
											type="text"
											className="input"
											value={spreadsheetConfig.columns.kelas}
											onChange={(e) => setSpreadsheetConfig({
												...spreadsheetConfig,
												columns: { ...spreadsheetConfig.columns, kelas: e.target.value.toUpperCase() }
											})}
											maxLength={2}
											placeholder="C"
										/>
									</div>
									<div className="input-group">
										<label className="input-label">📷 Jumlah Foto</label>
										<input
											type="text"
											className="input"
											value={spreadsheetConfig.columns.jumlahFoto}
											onChange={(e) => setSpreadsheetConfig({
												...spreadsheetConfig,
												columns: { ...spreadsheetConfig.columns, jumlahFoto: e.target.value.toUpperCase() }
											})}
											maxLength={2}
											placeholder="D"
										/>
									</div>
									<div className="input-group">
										<label className="input-label">✅ Done</label>
										<input
											type="text"
											className="input"
											value={spreadsheetConfig.columns.done}
											onChange={(e) => setSpreadsheetConfig({
												...spreadsheetConfig,
												columns: { ...spreadsheetConfig.columns, done: e.target.value.toUpperCase() }
											})}
											maxLength={2}
											placeholder="H"
										/>
									</div>
									<div className="input-group">
										<label className="input-label">💳 QRIS</label>
										<input
											type="text"
											className="input"
											value={spreadsheetConfig.columns.qris}
											onChange={(e) => setSpreadsheetConfig({
												...spreadsheetConfig,
												columns: { ...spreadsheetConfig.columns, qris: e.target.value.toUpperCase() }
											})}
											maxLength={2}
											placeholder="J"
										/>
									</div>
									<div className="input-group">
										<label className="input-label">💵 Cash</label>
										<input
											type="text"
											className="input"
											value={spreadsheetConfig.columns.cash}
											onChange={(e) => setSpreadsheetConfig({
												...spreadsheetConfig,
												columns: { ...spreadsheetConfig.columns, cash: e.target.value.toUpperCase() }
											})}
											maxLength={2}
											placeholder="K"
										/>
									</div>
								</div>
								<button
									onClick={handleUpdateSpreadsheetConfig}
									className="btn btn-primary w-full mt-md"
									disabled={saving}
								>
									{saving ? <span className="spinner"></span> : 'Simpan Konfigurasi Kolom'}
								</button>
							</>
						)}
					</div>

					{/* Danger Zone */}
					<div className="card" style={{ borderColor: 'var(--danger-500)' }}>
						<div className="card-header">
							<h3 className="card-title" style={{ color: 'var(--danger-500)' }}>⚠️ Danger Zone</h3>
						</div>
						<p className="text-sm text-muted mb-md">
							Reset antrian akan menghapus semua data antrian dari memori server.
							Data yang sudah masuk ke spreadsheet tidak akan terhapus.
						</p>
						<button
							onClick={handleResetQueue}
							className="btn btn-danger w-full"
							disabled={saving}
						>
							{saving ? <span className="spinner"></span> : 'Reset Semua Antrian'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
