class Modal {
    constructor(options = {}) {
        this.id = options.id || 'modal-' + Math.random().toString(36).substr(2, 9);
        this.title = options.title || '';
        this.content = options.content || '';
        this.onClose = options.onClose || (() => {});
        this.onConfirm = options.onConfirm || (() => {});
        this.showFooter = options.showFooter !== false;
        this.confirmText = options.confirmText || 'Confirm';
        this.cancelText = options.cancelText || 'Cancel';
    }

    create() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = this.id;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${this.content}
                </div>
                ${this.showFooter ? this.createFooter() : ''}
            </div>
        `;

        this.attachEventListeners(modal);
        return modal;
    }

    createFooter() {
        return `
            <div class="modal-footer">
                <button class="cancel-btn">${this.cancelText}</button>
                <button class="confirm-btn">${this.confirmText}</button>
            </div>
        `;
    }

    attachEventListeners(modal) {
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');

        closeBtn?.addEventListener('click', () => this.close());
        cancelBtn?.addEventListener('click', () => this.close());
        confirmBtn?.addEventListener('click', () => {
            this.onConfirm();
            this.close();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }

    show() {
        document.body.appendChild(this.create());
        document.body.style.overflow = 'hidden';
    }

    close() {
        const modal = document.getElementById(this.id);
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
            this.onClose();
        }
    }
}

// Export for use in other components
window.Modal = Modal;