import React, { useState, useEffect } from 'react';

function Toast({ message, type = 'info', duration = 5000, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    if (!isVisible) return null;

    const getTypeClass = () => {
        switch (type) {
            case 'success':
                return 'bg-success';
            case 'error':
                return 'bg-danger';
            case 'warning':
                return 'bg-warning';
            case 'info':
                return 'bg-info';
            default:
                return 'bg-secondary';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'bi-check-circle';
            case 'error':
                return 'bi-exclamation-circle';
            case 'warning':
                return 'bi-exclamation-triangle';
            case 'info':
                return 'bi-info-circle';
            default:
                return 'bi-bell';
        }
    };

    return (
        <div
            className={`toast show position-fixed bottom-0 start-50 translate-middle-x mb-3 ${getTypeClass()}`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            style={{
                zIndex: 9999,
                minWidth: '300px',
            }}
        >
            <div className="toast-body text-white d-flex justify-content-between align-items-center">
                <span>
                    <i className={`bi ${getIcon()} me-2`}></i>
                    {message}
                </span>
                <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    onClick={() => {
                        setIsVisible(false);
                        if (onClose) onClose();
                    }}
                ></button>
            </div>
        </div>
    );
}

export default Toast;
