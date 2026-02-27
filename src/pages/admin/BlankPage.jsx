import React from 'react';

const BlankPage = () => {
    return (
        <div className="blank-page-container" style={{ 
            height: 'calc(100vh - 200px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#64748b'
        }}>
            <div style={{ 
                padding: '40px', 
                borderRadius: '24px', 
                background: 'rgba(255, 255, 255, 0.5)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                textAlign: 'center'
            }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px', opacity: 0.5 }}>
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Halaman Kosong</h2>
                <p style={{ fontSize: '14px' }}>Halaman ini belum memiliki konten.</p>
            </div>
        </div>
    );
};

export default BlankPage;
