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
        // Handle Sidebar toggle button clicks
        this.toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleSidebar());
        });

        // Handle Tab/Navigation routing
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Stop the page from refreshing
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
        // 1. Remove 'active' class from all links, add to the clicked one
        this.navLinks.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');

        // 2. Hide all views
        this.views.forEach(view => view.classList.add('hidden'));
        
        // 3. Find and show the target view based on data-target attribute
        const targetId = clickedLink.getAttribute('data-target');
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.remove('hidden');
        }

        // 4. Update Header Title & Subtitle dynamically
        if (this.pageTitle && this.pageSubtitle) {
            this.pageTitle.textContent = clickedLink.getAttribute('data-title');
            this.pageSubtitle.textContent = clickedLink.getAttribute('data-subtitle');
        }

        // 5. Auto-close sidebar on mobile screens after clicking a link
        if (window.innerWidth <= 820 && this.sidebar) {
            this.sidebar.classList.remove('sidebar-open');
        }
    }
}

// Start the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PortalApp();
});