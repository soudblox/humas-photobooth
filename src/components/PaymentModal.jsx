import { useState } from 'react';

export default function PaymentModal({ entry, onClose, onConfirm, loading, formatPrice }) {
	const [selected, setSelected] = useState(null);

	const handleConfirm = () => {
		if (!selected) return;
		onConfirm(selected);
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal" onClick={e => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="modal-title">Pilih Metode Pembayaran</h3>
					<button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
				</div>

				<div className="modal-body">
					<div className="text-center mb-lg">
						<p className="text-muted">Antrian selesai untuk</p>
						<p className="font-bold" style={{ fontSize: '1.25rem' }}>{entry.nama}</p>
						<p className="price price-large">{formatPrice(entry.totalPrice)}</p>
					</div>

					<div className="payment-options">
						<button
							className={`payment-option ${selected === 'qris' ? 'selected' : ''}`}
							onClick={() => setSelected('qris')}
						>
							<div className="payment-icon">💳</div>
							<div className="payment-label">QRIS</div>
						</button>
						<button
							className={`payment-option ${selected === 'cash' ? 'selected' : ''}`}
							onClick={() => setSelected('cash')}
						>
							<div className="payment-icon">💵</div>
							<div className="payment-label">Cash</div>
						</button>
					</div>
				</div>

				<div className="modal-footer">
					<button onClick={onClose} className="btn btn-secondary">
						Batal
					</button>
					<button
						onClick={handleConfirm}
						className="btn btn-success"
						disabled={!selected || loading}
					>
						{loading ? <span className="spinner"></span> : 'Konfirmasi Selesai'}
					</button>
				</div>
			</div>
		</div>
	);
}
