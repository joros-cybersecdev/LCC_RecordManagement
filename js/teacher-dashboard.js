class TeacherAccessController {
    constructor() {
        this.unlockAllBtn = document.getElementById('btn-unlock-all');
        this.lockAllBtn = document.getElementById('btn-lock-all');
        // Select the save button specifically in the access view
        this.saveAccessBtn = document.querySelector('#access-view .panel-footer .btn-save');

        this.initEvents();
        this.loadInitialState();
    }

    initEvents() {
        if (this.unlockAllBtn) this.unlockAllBtn.addEventListener('click', () => this.toggleAll(true));
        if (this.lockAllBtn) this.lockAllBtn.addEventListener('click', () => this.toggleAll(false));
        
        // Listen to all toggles
        document.querySelectorAll('.access-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => this.handleToggleChange(e.target));
        });

        // Attach the save functionality to the button
        if (this.saveAccessBtn) {
            this.saveAccessBtn.addEventListener('click', () => this.saveAccessSettings());
        }
    }

    // Load the correct toggle states from localStorage when the page opens
    loadInitialState() {
        let gradesDB = JSON.parse(localStorage.getItem('gradesDB'));
        if (!gradesDB) return;

        const rows = document.querySelectorAll('#access-view tbody tr');
        rows.forEach(row => {
            const studentIdSpan = row.querySelector('.subject-code');
            const toggle = row.querySelector('.access-toggle');

            if (studentIdSpan && toggle) {
                const studentId = studentIdSpan.textContent.trim();
                if (gradesDB[studentId]) {
                    // Find the subject (currently hardcoded to IT301 for the demo)
                    const subjectData = gradesDB[studentId].find(g => g.code === 'IT301');
                    if (subjectData) {
                        // If it is NOT locked in DB, it should be checked (unlocked)
                        toggle.checked = !subjectData.locked;
                        this.updateLabelStyle(toggle);
                    }
                }
            }
        });
    }

    toggleAll(state) {
        document.querySelectorAll('.access-toggle').forEach(checkbox => {
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

    // The logic to save states back to the database
    saveAccessSettings() {
        let gradesDB = JSON.parse(localStorage.getItem('gradesDB'));
        if (!gradesDB) {
            alert('No database found.');
            return;
        }

        const rows = document.querySelectorAll('#access-view tbody tr');

        rows.forEach(row => {
            const studentIdSpan = row.querySelector('.subject-code');
            const toggle = row.querySelector('.access-toggle');

            if (studentIdSpan && toggle) {
                const studentId = studentIdSpan.textContent.trim();
                const isUnlocked = toggle.checked;

                if (gradesDB[studentId]) {
                    const subjectIndex = gradesDB[studentId].findIndex(g => g.code === 'IT301');
                    if (subjectIndex !== -1) {
                        // If toggle is checked (unlocked), locked becomes false.
                        gradesDB[studentId][subjectIndex].locked = !isUnlocked;
                    }
                }
            }
        });

        // Save back to localStorage so the Student Dashboard can read the update
        localStorage.setItem('gradesDB', JSON.stringify(gradesDB));
        alert('Grade access settings saved successfully!');
    }
}

class TeacherDashboardController {
    constructor() {
        this.loadUserProfile();
        this.loadAssignedSubjects();
        this.initGradesManagement();
    }

    loadUserProfile() {
        const sessionData = JSON.parse(localStorage.getItem('currentUser'));
        if (!sessionData || sessionData.role !== 'teacher') return;

        const firstName = sessionData.fullname.split(' ')[0];
        const initial = firstName.charAt(0).toUpperCase();

        document.querySelectorAll('.sidebar-user-name, .header-user-name, .info-name').forEach(el => {
            if (el) el.textContent = sessionData.fullname;
        });

        const subtitle = document.getElementById('page-subtitle');
        if (subtitle) subtitle.textContent = `Welcome, ${firstName}!`;

        document.querySelectorAll('.sidebar-avatar.teacher-av, .header-avatar.teacher-av, .info-avatar.teacher-av-lg').forEach(el => {
            if (el) el.textContent = initial;
        });

        const infoMeta = document.querySelector('.info-banner .info-meta');
        if (infoMeta) {
            infoMeta.innerHTML = `${sessionData.department} &bull; Teacher`;
        }
    }

    loadAssignedSubjects() {
        const container = document.querySelector('.subjects-cards');
        if (!container) return; 

        container.innerHTML = '';
        const sessionData = JSON.parse(localStorage.getItem('currentUser'));
        if (!sessionData || sessionData.role !== 'teacher') return;

        let allSubjects = JSON.parse(localStorage.getItem('teacherSubjects')) || [];
        let savedSubjects = allSubjects.filter(sub => sub.teacherUsername === sessionData.username);
        
        if (savedSubjects.length === 0) {
            container.innerHTML = `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: #64748b;">No subjects have been assigned to you yet.</div>`;
            return;
        }

        savedSubjects.forEach(subject => {
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
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    initGradesManagement() {
        const saveBtn = document.getElementById('save-grades-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveGrades());
        this.renderManageGradesTable();
    }

    renderManageGradesTable() {
        const tbody = document.getElementById('manage-grades-tbody');
        if (!tbody) return;

        let gradesDB = JSON.parse(localStorage.getItem('gradesDB'));
        if(!gradesDB) return;

        const students = [
            { id: '2026-001', name: 'John Doe', status: 'paid' },
            { id: '2026-002', name: 'Maria Clara', status: 'paid' }
        ];

        tbody.innerHTML = '';
        
        students.forEach((student, idx) => {
            const sGrades = gradesDB[student.id].find(g => g.code === 'IT301');
            const prelim = sGrades.prelim || '';
            const midterm = sGrades.midterm || '';
            const final = sGrades.final || '';

            let remarks = '<span class="empty-grade-text">No grade yet</span>';

            if (prelim && midterm && final) {
                const avg = ((parseFloat(prelim) + parseFloat(midterm) + parseFloat(final)) / 3);
                if (avg <= 3.0) {
                    remarks = `<span class="grade-pill grade-high">Passed</span>`;
                } else {
                    remarks = `<span class="grade-pill grade-low" style="background: #fee2e2; color: #991b1b;">Failed</span>`;
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><span class="subject-code">${student.id}</span></td>
                <td>${student.name}</td>
                <td><span class="access-badge unlocked">Paid</span></td>
                <td><input type="number" class="grade-input prelim-input" value="${prelim}" step="0.25" min="1.00" max="5.00" data-id="${student.id}"></td>
                <td><input type="number" class="grade-input midterm-input" value="${midterm}" step="0.25" min="1.00" max="5.00" data-id="${student.id}"></td>
                <td><input type="number" class="grade-input final-input" value="${final}" step="0.25" min="1.00" max="5.00" data-id="${student.id}"></td>
                <td>${remarks}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    saveGrades() {
        let gradesDB = JSON.parse(localStorage.getItem('gradesDB'));
        const tbody = document.getElementById('manage-grades-tbody');
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            const prelimInput = row.querySelector('.prelim-input');
            const midtermInput = row.querySelector('.midterm-input');
            const finalInput = row.querySelector('.final-input');

            const studentId = prelimInput.getAttribute('data-id');

            const pVal = prelimInput.value ? parseFloat(prelimInput.value) : null;
            const mVal = midtermInput.value ? parseFloat(midtermInput.value) : null;
            const fVal = finalInput.value ? parseFloat(finalInput.value) : null;

            const subjectIndex = gradesDB[studentId].findIndex(g => g.code === 'IT301');
            if (subjectIndex !== -1) {
                gradesDB[studentId][subjectIndex].prelim = pVal;
                gradesDB[studentId][subjectIndex].midterm = mVal;
                gradesDB[studentId][subjectIndex].final = fVal;
            }
        });

        localStorage.setItem('gradesDB', JSON.stringify(gradesDB));
        alert('Grades successfully saved!');
        
        this.renderManageGradesTable(); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TeacherAccessController();
    new TeacherDashboardController();
});