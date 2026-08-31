export function init() {
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

export function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (container.children.length >= 5) {
        container.removeChild(container.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '&#8505;'; // info
    if (type === 'success') icon = '&#10003;';
    if (type === 'error') icon = '&#10007;';
    if (type === 'warning') icon = '&#9888;';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('active');
    });

    let timeoutId = setTimeout(() => closeToast(toast), duration);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(timeoutId);
        closeToast(toast);
    });
}

function closeToast(toast) {
    toast.classList.remove('active');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}
