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

class TeacherDashboardController {
    constructor() {
        // Core interactive elements for toggles
        this.unlockAllBtn = document.getElementById('btn-unlock-all');
        this.lockAllBtn = document.getElementById('btn-lock-all');
        this.accessToggles = document.querySelectorAll('.access-toggle');

        // 1. Load the user profile details immediately
        this.loadUserProfile();

        // 2. Load the subjects
        this.loadAssignedSubjects();

        if (this.accessToggles.length > 0) {
            this.initEvents();
        }
    }

    loadUserProfile() {
        // Fetch the session created by the login page
        const sessionData = JSON.parse(localStorage.getItem('currentUser'));
        if (!sessionData || sessionData.role !== 'teacher') return;

        // Extract first name and initial for UI elements
        const firstName = sessionData.fullname.split(' ')[0];
        const initial = firstName.charAt(0).toUpperCase();

        // 1. Update all Full Name displays (Sidebar, Header, Banner)
        document.querySelectorAll('.sidebar-user-name, .header-user-name, .info-name').forEach(el => {
            if (el) el.textContent = sessionData.fullname;
        });

        // 2. Update Welcome subtitle
        const subtitle = document.getElementById('page-subtitle');
        if (subtitle) subtitle.textContent = `Welcome, ${firstName}!`;

        // 3. Update all Avatars (Sidebar, Header, Banner)
        document.querySelectorAll('.sidebar-avatar.teacher-av, .header-avatar.teacher-av, .info-avatar.teacher-av-lg').forEach(el => {
            if (el) el.textContent = initial;
        });

        // 4. Update the Department in the banner
        const infoMeta = document.querySelector('.info-banner .info-meta');
        if (infoMeta) {
            infoMeta.innerHTML = `${sessionData.department} &bull; Teacher`;
        }
    }

    /**
     * Loads subjects from localStorage and generates HTML cards
     */
    loadAssignedSubjects() {
        const cardsContainer = document.querySelector('.subjects-cards');
        const dashboardTableBody = document.querySelector('#dashboard-view .data-table tbody');

        // CRITICAL: Wipe out the hardcoded HTML dummy data so dynamic data doesn't mix!
        if (cardsContainer) cardsContainer.innerHTML = '';
        if (dashboardTableBody) dashboardTableBody.innerHTML = '';

        // Get the identity of the person currently logged in
        const sessionData = JSON.parse(localStorage.getItem('currentUser'));
        if (!sessionData || sessionData.role !== 'teacher') return;

        // Grab ALL subjects in the system
        let allSubjects = JSON.parse(localStorage.getItem('teacherSubjects')) || [];
        
        // FILTER: Keep only the subjects tagged with this specific teacher's username
        let savedSubjects = allSubjects.filter(sub => sub.teacherUsername === sessionData.username);
        
        // --- UPDATE STATS & BANNERS DYNAMICALLY ---
        const subjectCountElem = document.querySelector('.stat-card.blue .stat-card-value');
        if (subjectCountElem) {
            subjectCountElem.textContent = savedSubjects.length;
        }

        const infoMetaElements = document.querySelectorAll('.info-meta');
        if (infoMetaElements.length > 1) {
            infoMetaElements[1].innerHTML = `Handling ${savedSubjects.length} subject(s) &bull; Pending students`;
        }

        // --- HANDLE EMPTY STATE ---
        if (savedSubjects.length === 0) {
            if (cardsContainer) cardsContainer.innerHTML = `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: #64748b;">No subjects have been assigned to you yet.</div>`;
            if (dashboardTableBody) dashboardTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">No subjects assigned.</td></tr>`;
            return;
        }

        // --- RENDER DYNAMIC DATA ---
        savedSubjects.forEach(subject => {
            
            // 1. Render the Card for the "My Subjects" Tab
            if (cardsContainer) {
                const cardHTML = `
                    <div class="subject-detail-card">
                        <div class="sdc-header">
                            <div class="sdc-code">${subject.code}</div>
                            <span class="sdc-units">${subject.units} units</span>
                        </div>
                        <h3 class="sdc-name">${subject.title}</h3>
                        <div class="sdc-meta">
                            <div class="sdc-meta-item">
                                <span class="sdc-meta-label">Section</span>
                                <span class="sdc-meta-value">${subject.section}</span>
                            </div>
                            <div class="sdc-meta-item">
                                <span class="sdc-meta-label">Program</span>
                                <span class="sdc-meta-value">${subject.program}</span>
                            </div>
                            <div class="sdc-meta-item">
                                <span class="sdc-meta-label">Year Level</span>
                                <span class="sdc-meta-value">${subject.year}</span>
                            </div>
                            <div class="sdc-meta-item">
                                <span class="sdc-meta-label">Students</span>
                                <span class="sdc-meta-value">Pending</span>
                            </div>
                        </div>
                    </div>
                `;
                cardsContainer.insertAdjacentHTML('beforeend', cardHTML);
            }

            // 2. Render the Table Row for the main "Dashboard" Tab
            if (dashboardTableBody) {
                const rowHTML = `
                    <tr>
                        <td><span class="subject-code">${subject.code}</span></td>
                        <td>${subject.title}</td>
                        <td>${subject.units}</td>
                        <td>${subject.section}</td>
                        <td>${subject.program}</td>
                        <td>2025-2026</td>
                    </tr>
                `;
                dashboardTableBody.insertAdjacentHTML('beforeend', rowHTML);
            }
        });
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

    toggleAll(state) {
        this.accessToggles.forEach(checkbox => {
            checkbox.checked = state;
            this.updateLabelStyle(checkbox);
        });
    }

    handleToggleChange(checkbox) {
        this.updateLabelStyle(checkbox);
    }

    updateLabelStyle(checkbox) {
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
    new TeacherDashboardController();
});