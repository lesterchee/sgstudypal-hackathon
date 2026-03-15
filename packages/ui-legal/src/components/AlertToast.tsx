import * as React from 'react';

// Purpose: Defines the properties for the AlertToast component.
export interface AlertToastProps {
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    onClose?: () => void;
}

// Purpose: A toast notification component for displaying ephemeral messages to the user.
export const AlertToast: React.FC<AlertToastProps> = ({ type, message, onClose }) => {
    // Basic styling for a simple toast. A real component library might use Tailwind, Material UI, etc.
    // Purpose: Returns inline styles for the toast based on its severity type.
    const getStyles = () => {
        switch (type) {
            case 'CRITICAL':
                return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }; // Red
            case 'WARNING':
                return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' }; // Yellow
            case 'INFO':
            default:
                return { backgroundColor: '#e0f2fe', color: '#075985', border: '1px solid #38bdf8' }; // Blue
        }
    };

    const styles = getStyles();

    return (
        <div style={{
            ...styles,
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>
                    {type === 'CRITICAL' ? '⚠️' : type === 'WARNING' ? '⚠️' : 'ℹ️'}
                </span>
                <span>{message}</span>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '12px', opacity: 0.6 }}
                    aria-label="Close alert"
                >
                    ✕
                </button>
            )}
        </div>
    );
};
