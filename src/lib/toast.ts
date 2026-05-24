// Lightweight toast notification system
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
}

function createToast(message: string, type: ToastType, options: ToastOptions = {}) {
  const { duration = 3500 } = options;
  const existing = document.getElementById('arvi-toast-container');
  const container = existing || (() => {
    const el = document.createElement('div');
    el.id = 'arvi-toast-container';
    el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(el);
    return el;
  })();

  const colors: Record<ToastType, string> = {
    success: '#3CB371',
    error: '#ef4444',
    info: '#0F9FA8',
    warning: '#f59e0b',
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:white;
    border-left:4px solid ${colors[type]};
    border-radius:12px;
    padding:12px 18px;
    box-shadow:0 4px 20px rgba(0,0,0,0.15);
    font-size:14px;
    font-weight:500;
    color:#0A3D62;
    pointer-events:auto;
    transition:all 0.3s ease;
    opacity:0;
    transform:translateX(20px);
    max-width:320px;
    word-break:break-word;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

export const toast = {
  success: (msg: string, opts?: ToastOptions) => createToast(msg, 'success', opts),
  error: (msg: string, opts?: ToastOptions) => createToast(msg, 'error', opts),
  info: (msg: string, opts?: ToastOptions) => createToast(msg, 'info', opts),
  warning: (msg: string, opts?: ToastOptions) => createToast(msg, 'warning', opts),
};
