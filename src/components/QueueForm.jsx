import { useState } from 'react';
import { api } from '../utils/api';

export default function QueueForm({ pricing, onClose, onCreated, formatPrice }) {
	const [nama, setNama] = useState('');
	const [kelas, setKelas] = useState('');
	const [jumlahFoto, setJumlahFoto] = useState(2);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const calculatePrice = (count) => {
		const bundle4Count = Math.floor(count / 4);
		const remaining = count - bundle4Count * 4;
		const bundle2Count = remaining / 2;
		return (bundle4Count * pricing.bundle4) + (bundle2Count * pricing.bundle2);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (!nama.trim()) {
			setError('Nama harus diisi');
			return;
		}

		if (jumlahFoto < 2 || jumlahFoto % 2 !== 0) {
			setError('Jumlah foto harus kelipatan 2');
			return;
		}

		setLoading(true);
		try {
			await api.createQueue({
				nama: nama.trim(),
				kelas: kelas.trim(),
				jumlahFoto,
			});
			onCreated();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal" onClick={e => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="modal-title">Tambah Antrian</h3>
					<button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="modal-body">
						<div className="input-group mb-md">
							<label className="input-label">Nama *</label>
							<input
								type="text"
								className={`input ${error && !nama ? 'input-error' : ''}`}
								value={nama}
								onChange={(e) => setNama(e.target.value)}
								placeholder="Masukkan nama"
								autoFocus
							/>
						</div>

						<div className="input-group mb-md">
							<label className="input-label">Kelas (opsional)</label>
							<input
								type="text"
								className="input"
								value={kelas}
								onChange={(e) => setKelas(e.target.value)}
								placeholder="Contoh: XII-IPA-1"
							/>
						</div>

						<div className="input-group mb-md">
							<label className="input-label">Jumlah Foto (kelipatan 2)</label>
							<div className="flex gap-sm items-center">
								<button
									type="button"
									onClick={() => setJumlahFoto(Math.max(2, jumlahFoto - 2))}
									className="btn btn-secondary btn-icon"
								>
									−
								</button>
								<input
									type="number"
									className="input"
									value={jumlahFoto}
									onChange={(e) => {
										const val = parseInt(e.target.value) || 2;
										setJumlahFoto(Math.max(2, Math.ceil(val / 2) * 2));
									}}
									min="2"
									step="2"
									style={{ width: '80px', textAlign: 'center' }}
								/>
								<button
									type="button"
									onClick={() => setJumlahFoto(jumlahFoto + 2)}
									className="btn btn-secondary btn-icon"
								>
									+
								</button>
							</div>
						</div>

						<div className="card" style={{ background: 'var(--bg-tertiary)' }}>
							<div className="flex justify-between items-center">
								<span className="text-muted">Total Harga</span>
								<span className="price price-large">{formatPrice(calculatePrice(jumlahFoto))}</span>
							</div>
							<div className="text-sm text-muted mt-md">
								Harga: Bundle 2 foto = {formatPrice(pricing.bundle2)}<br></br>Bundle 4 foto = {formatPrice(pricing.bundle4)}
							</div>
						</div>

						{error && <p className="error-message mt-md">{error}</p>}
					</div>

					<div className="modal-footer">
						<button type="button" onClick={onClose} className="btn btn-secondary">
							Batal
						</button>
						<button type="submit" className="btn btn-primary" disabled={loading}>
							{loading ? <span className="spinner"></span> : 'Tambah Antrian'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
