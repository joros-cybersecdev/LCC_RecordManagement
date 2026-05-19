/**
 * PortalApp Class
 * Handles sidebar toggling and Single Page Application (SPA) view routing.
 */
class PortalApp {
    constructor() {
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.toggleBtns = document.querySelectorAll('.sidebar-toggle');

        // Navigation and Views
        this.navLinks = document.querySelectorAll('.sidebar-nav .sidebar-link:not(.logout-link)');
        this.views = document.querySelectorAll('.view-section');

        // Header Text Elements
        this.pageTitle = document.getElementById('page-title');
        this.pageSubtitle = document.getElementById('page-subtitle');

        this.initEvents();
    }

    initEvents() {
        // Sidebar toggle
        this.toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleSidebar());
        });

        // Navigation routing
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Stop the page from reloading
                this.switchView(e.currentTarget);
            });
        });
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('sidebar-open');
        }
    }

    switchView(clickedLink) {
        // 1. Change Active state on sidebar
        this.navLinks.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');

        // 2. Hide all views, then show the target view
        const targetId = clickedLink.getAttribute('data-target');
        this.views.forEach(view => view.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');

        // 3. Update Header Title & Subtitle dynamically
        if (this.pageTitle && this.pageSubtitle) {
            this.pageTitle.textContent = clickedLink.getAttribute('data-title');
            this.pageSubtitle.textContent = clickedLink.getAttribute('data-subtitle');
        }

        // 4. Auto-close sidebar on mobile after clicking a link
        if (window.innerWidth <= 820 && this.sidebar) {
            this.sidebar.classList.remove('sidebar-open');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PortalApp();
});