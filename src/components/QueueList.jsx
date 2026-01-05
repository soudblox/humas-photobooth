export default function QueueList({
	queue,
	currentlyPhotographing,
	onSetPhotographing,
	onDone,
	onCancel,
	onPrinted,
	loading,
	formatPrice,
	activeTab
}) {
	if (queue.length === 0) {
		const emptyMessages = {
			waiting: 'menunggu',
			print: 'menunggu print',
			done: 'selesai',
			cancelled: 'dibatalkan'
		};
		return (
			<div className="queue-empty">
				<div className="queue-empty-icon">📭</div>
				<p>Tidak ada antrian {emptyMessages[activeTab] || ''}</p>
			</div>
		);
	}

	const getStatusBadge = (entry) => {
		switch (entry.status) {
			case 'waiting':
				return <span className="badge badge-waiting">Menunggu</span>;
			case 'photographing':
				return <span className="badge badge-photographing">📷 Sedang Foto</span>;
			case 'done':
				return (
					<span className="badge badge-done">
						✓ Selesai {entry.paymentMethod === 'qris' ? '(QRIS)' : '(Cash)'}
					</span>
				);
			case 'cancelled':
				return <span className="badge badge-cancelled">Dibatalkan</span>;
			default:
				return null;
		}
	};

	return (
		<div className="queue-list">
			{queue.map((entry, index) => (
				<div
					key={entry.id}
					className={`queue-item ${entry.status === 'photographing' ? 'active' : ''}`}
				>
					<div className="queue-number">{index + 1}</div>

					<div className="queue-info">
						<div className="queue-name">
							{entry.nama}
							{entry.kelas && <span className="text-muted"> ({entry.kelas})</span>}
						</div>
						<div className="queue-details">
							<span>📷 {entry.jumlahFoto} foto</span>
							<span className="queue-price">{formatPrice(entry.totalPrice)}</span>
							{getStatusBadge(entry)}
						</div>
					</div>

					<div className="queue-actions">
						{entry.status === 'waiting' && (
							<>
								<button
									onClick={() => onSetPhotographing(entry)}
									className="btn btn-primary btn-sm"
									disabled={loading}
								>
									📷 Foto
								</button>
								<button
									onClick={() => onCancel(entry)}
									className="btn btn-ghost btn-sm"
									disabled={loading}
								>
									✕
								</button>
							</>
						)}
						{entry.status === 'photographing' && (
							<>
								<button
									onClick={() => onDone(entry)}
									className="btn btn-success btn-sm"
									disabled={loading}
								>
									✓ Selesai
								</button>
								<button
									onClick={() => onCancel(entry)}
									className="btn btn-danger btn-sm"
									disabled={loading}
								>
									✕
								</button>
							</>
						)}
						{activeTab === 'print' && entry.status === 'done' && !entry.printed && (
							<button
								onClick={() => onPrinted(entry)}
								className="btn btn-success btn-sm"
								disabled={loading}
							>
								🖨️ Printed
							</button>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
