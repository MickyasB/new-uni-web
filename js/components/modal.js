export function render() {
    return `<div id="modal-root"></div>`;
}

export function openModal(config) {
    const root = document.getElementById('modal-root');
    if (!root) return;

    const { title, content, footer, size = 'md', onClose } = config;
    
    const modalHTML = `
        <div class="modal-overlay" id="modal-overlay">
            <div class="modal-dialog modal-${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modal-title" class="modal-title">${title}</h2>
                        <button class="modal-close" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            </div>
        </div>
    `;
    
    root.innerHTML = modalHTML;
    
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = root.querySelector('.modal-close');
    const dialog = root.querySelector('.modal-dialog');
    
    requestAnimationFrame(() => {
        overlay.classList.add('active');
        dialog.classList.add('active');
    });

    const close = () => {
        overlay.classList.remove('active');
        dialog.classList.remove('active');
        setTimeout(() => {
            root.innerHTML = '';
            if (onClose) onClose();
        }, 300);
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    const focusableElements = root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length) {
        focusableElements[0].focus();
    }
}

export function closeModal() {
    const root = document.getElementById('modal-root');
    const overlay = document.getElementById('modal-overlay');
    const dialog = root.querySelector('.modal-dialog');
    if (overlay && dialog) {
        overlay.classList.remove('active');
        dialog.classList.remove('active');
        setTimeout(() => {
            root.innerHTML = '';
        }, 300);
    }
}

export const showModal = openModal;

export default {
    render,
    openModal,
    showModal,
    closeModal
};
