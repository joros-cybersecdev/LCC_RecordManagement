class TeacherDashboardController {
    constructor() {
        this.unlockAllBtn = document.getElementById('btn-unlock-all');
        this.lockAllBtn = document.getElementById('btn-lock-all');
        
        this.initEvents();
        this.loadTeacherData();
    }

    initEvents() {
        if (this.unlockAllBtn) this.unlockAllBtn.addEventListener('click', () => this.toggleAllGrades('Unlocked'));
        if (this.lockAllBtn) this.lockAllBtn.addEventListener('click', () => this.toggleAllGrades('Locked'));
    }

    async loadTeacherData() {
        const localSession = JSON.parse(localStorage.getItem('lcc_user'));
        if (!localSession) return window.location.href = 'login.html';
        const user = { id: localSession.id }; // Creates the user object your code expects

        const { data: sections, error } = await window.supabase
            .from('sections')
            .select('id, section_name, subjects(code, title)')
            .eq('faculty_id', user.id);

        // FIX: Added null safety for 'sections'
        if (error || !sections || sections.length === 0) {
            return console.log('No sections assigned.');
        }

        this.loadStudentsForSection(sections[0].id);
    }

    async loadStudentsForSection(sectionId) {
        const { data: records, error } = await window.supabase
            .from('records')
            .select(`
                id, prelim, midterm, final, final_rating, status, payment_status,
                profiles ( full_name, school_id )
            `)
            .eq('section_id', sectionId);

        if (error) return console.error(error);

        this.renderGradeTable(records);
    }

    renderGradeTable(records) {
        const tbody = document.querySelector('#grades-view .data-table tbody');
        if (!tbody || !records || records.length === 0) return;

        const fmt = (val) => {
            if (val === null || val === undefined || val === '') return '';
            const n = parseFloat(val);
            return isNaN(n) ? '' : n.toFixed(2);
        };

        tbody.innerHTML = '';
        records.forEach((record, index) => {
            const isPaid     = record.payment_status === 'Paid';
            const fr         = fmt(record.final_rating);
            const frDisplay  = fr
                ? `<input type="number" class="grade-input" value="${fr}" step="0.25" min="1.00" max="5.00" readonly style="background:#f0fdf4;font-weight:700;color:#15803d;">`
                : `<input type="number" class="grade-input" value="" step="0.25" min="1.00" max="5.00" placeholder="—" readonly style="background:#f9fafb;">`;
            const remarks    = fr
                ? `<span class="grade-pill grade-high">Passed</span>`
                : `<span class="empty-grade-text">No grade yet</span>`;

            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="subject-code">${record.profiles.school_id}</span></td>
                    <td>${record.profiles.full_name}</td>
                    <td><span class="access-badge ${isPaid ? 'unlocked' : 'locked'}">${record.payment_status}</span></td>
                    <td><input type="number" class="grade-input" id="prelim-${record.id}" value="${fmt(record.prelim)}" step="0.25" min="1.00" max="5.00" placeholder="—" onblur="teacherApp.updateGradeField('${record.id}', 'prelim', this.value)"></td>
                    <td><input type="number" class="grade-input" id="midterm-${record.id}" value="${fmt(record.midterm)}" step="0.25" min="1.00" max="5.00" placeholder="—" onblur="teacherApp.updateGradeField('${record.id}', 'midterm', this.value)"></td>
                    <td><input type="number" class="grade-input" id="final-${record.id}" value="${fmt(record.final)}" step="0.25" min="1.00" max="5.00" placeholder="—" onblur="teacherApp.updateGradeField('${record.id}', 'final', this.value)"></td>
                    <td>${frDisplay}</td>
                    <td>${remarks}</td>
                </tr>
            `;
        });
    }

    // ==========================================
    // SUPABASE UPDATES
    // ==========================================

    async updateGradeField(recordId, field, value) {
        if (!value) return;
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return;

        const { error } = await window.supabase
            .from('records')
            .update({ [field]: parsed })
            .eq('id', recordId);

        if (error) alert('Error saving grade: ' + error.message);
    }

    async toggleSingleGrade(recordId, newStatus) {
        const { error } = await window.supabase
            .from('records')
            .update({ status: newStatus })
            .eq('id', recordId);

        if (!error) this.loadTeacherData(); // Refresh UI
    }

    async toggleAllGrades(newStatus) {
        // In a real app, you would pass the section ID here to update all in a section.
        alert(`Bulk update to ${newStatus} triggered.`);
    }
}

<<<<<<< HEAD
let teacherApp;
document.addEventListener('DOMContentLoaded', () => {
    teacherApp = new TeacherDashboardController();
=======
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
>>>>>>> 64f0e7796444bfe0753bc248abfcd40b316a9bce
});