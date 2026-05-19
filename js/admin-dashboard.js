/**
 * AdminDashboardController Class
 * Handles OOP Modal Popups and Internal Routing
 */
class AdminDashboardController {
    constructor() {
        // Modal Elements
        this.modals = document.querySelectorAll('.modal-overlay');
        this.modalTriggers = document.querySelectorAll('.modal-trigger');
        this.closeButtons = document.querySelectorAll('.modal-close-btn');
        
        // Navigation / Routing Elements
        this.navTriggers = document.querySelectorAll('.nav-trigger');

        this.initEvents();
    }

    initEvents() {
        // 1. Open Modals
        this.modalTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-modal-target');
                this.openModal(targetId);
            });
        });

        // 2. Close Modals
        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const activeModal = btn.closest('.modal-overlay');
                if (activeModal) this.closeModal(activeModal);
            });
        });

        // 3. Click outside to close
        window.addEventListener('click', (e) => {
            this.modals.forEach(overlay => {
                if (e.target === overlay) this.closeModal(overlay);
            });
        });

        // 4. Custom App Navigation (e.g., clicking "Manage Payments")
        this.navTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const route = btn.getAttribute('data-route');
                const sidebarLink = document.querySelector(`.sidebar-link[data-target='${route}']`);
                if (sidebarLink) sidebarLink.click();
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('open');
    }

    closeModal(modalElement) {
        modalElement.classList.remove('open');
    }
}

// Initialize when the DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboardController();
});