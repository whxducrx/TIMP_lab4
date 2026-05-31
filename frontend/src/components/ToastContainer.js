import React from 'react';
import Toast from './Toast';
import { useToast } from '../context/ToastContext';

function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="position-fixed bottom-0 start-50 translate-middle-x" style={{ zIndex: 9999 }}>
            {toasts.map((toast) => (
                <div key={toast.id} className="mb-2">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        duration={0}
                        onClose={() => removeToast(toast.id)}
                    />
                </div>
            ))}
        </div>
    );
}

export default ToastContainer;
