/**
 * TeacherAccessController Class
 * Handles dynamic UI updates for grade access toggles
 */
class TeacherAccessController {
    constructor() {
        // Core interactive elements
        this.unlockAllBtn = document.getElementById('btn-unlock-all');
        this.lockAllBtn = document.getElementById('btn-lock-all');
        this.accessToggles = document.querySelectorAll('.access-toggle');

        // Initialize if we are on a page that uses these elements
        if (this.accessToggles.length > 0) {
            this.initEvents();
        }
    }

    initEvents() {
        // Global Unlock/Lock Buttons
        if (this.unlockAllBtn) {
            this.unlockAllBtn.addEventListener('click', () => this.toggleAll(true));
        }

        if (this.lockAllBtn) {
            this.lockAllBtn.addEventListener('click', () => this.toggleAll(false));
        }

        // Individual switch listeners
        this.accessToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => this.handleToggleChange(e.target));
        });
    }

    /**
     * Toggles all switches on the page to a specific boolean state
     */
    toggleAll(state) {
        this.accessToggles.forEach(checkbox => {
            checkbox.checked = state;
            this.updateLabelStyle(checkbox);
        });
    }

    /**
     * Handles an individual toggle interaction
     */
    handleToggleChange(checkbox) {
        this.updateLabelStyle(checkbox);
    }

    /**
     * Finds the corresponding label for a toggle and dynamically updates text and CSS classes
     */
    updateLabelStyle(checkbox) {
        // Look up the closest table row to isolate the target label
        const row = checkbox.closest('tr');
        if (!row) return;

        const label = row.querySelector('.access-status-label');
        if (label) {
            if (checkbox.checked) {
                label.textContent = 'Unlocked';
                label.classList.remove('status-locked');
                label.classList.add('status-unlocked');
            } else {
                label.textContent = 'Locked';
                label.classList.remove('status-unlocked');
                label.classList.add('status-locked');
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TeacherAccessController();
});