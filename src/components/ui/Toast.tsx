
import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1e1e1e',
          color: '#f5f5f5',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          maxWidth: '320px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        },
        success: {
          duration: 3000,
          iconTheme: { primary: '#22c55e', secondary: '#f5f5f5' },
        },
        error: {
          duration: 5000,
          iconTheme: { primary: '#ef4444', secondary: '#f5f5f5' },
        },
      }}
    />
  );
}
