import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const showToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        const newToast = { id, message, type, duration };
        
        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, [removeToast]);

    const success = useCallback((message, duration = 5000) => {
        showToast(message, 'success', duration);
    }, [showToast]);

    const error = useCallback((message, duration = 5000) => {
        showToast(message, 'error', duration);
    }, [showToast]);

    const warning = useCallback((message, duration = 5000) => {
        showToast(message, 'warning', duration);
    }, [showToast]);

    const info = useCallback((message, duration = 5000) => {
        showToast(message, 'info', duration);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{
            showToast,
            removeToast,
            success,
            error,
            warning,
            info,
            toasts,
        }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
