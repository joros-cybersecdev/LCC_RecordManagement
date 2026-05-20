class AdminDashboardController {
    constructor() {
        this.modals = document.querySelectorAll('.modal-overlay');
        this.modalTriggers = document.querySelectorAll('.modal-trigger');
        this.closeButtons = document.querySelectorAll('.modal-close-btn');
        this.navTriggers = document.querySelectorAll('.nav-trigger');
        
        this.initEvents();
        
        // Fetch LIVE data from Supabase
        this.loadStudents();
        this.loadTeachers();
        this.loadSections();
    }

    initEvents() {
        // UI Navigation & Modals
        this.modalTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal(btn.getAttribute('data-modal-target'));
            });
        });

        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const activeModal = btn.closest('.modal-overlay');
                if (activeModal) this.closeModal(activeModal);
            });
        });

        this.navTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const route = btn.getAttribute('data-route');
                const sidebarLink = document.querySelector(`.sidebar-link[data-target='${route}']`);
                if (sidebarLink) sidebarLink.click();
            });
        });
    }

    // ==========================================
    // SUPABASE DATABASE FETCHING
    // ==========================================

    async loadStudents() {
        const { data: students, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student');

        if (error) return console.error(error);

        const tbody = document.querySelector('#students-view .data-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        students.forEach(student => {
            tbody.innerHTML += `
                <tr>
                    <td><span class="subject-code">${student.school_id}</span></td>
                    <td>${student.full_name}</td>
                    <td>${student.program || 'N/A'}</td>
                    <td><span class="access-badge unlocked">Active</span></td>
                    <td class="text-right">
                        <div class="action-btns justify-end">
                            <button class="btn-delete" onclick="adminApp.deleteProfile('${student.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    async loadTeachers() {
        const { data: teachers, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('role', 'faculty');

        if (error) return console.error(error);

        const tbody = document.querySelector('#teachers-view .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        teachers.forEach(teacher => {
            tbody.innerHTML += `
                <tr>
                    <td><span class="subject-code">${teacher.school_id}</span></td>
                    <td>${teacher.full_name}</td>
                    <td>${teacher.school_id}@lcc.edu</td>
                    <td>Faculty Department</td>
                    <td class="text-right">
                        <div class="action-btns justify-end">
                            <button class="btn-delete" onclick="adminApp.deleteProfile('${teacher.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    async loadSections() {
        const { data: sections, error } = await window.supabase
            .from('sections')
            .select('id, section_name, school_year, semester, subjects(title)');

        if (error) return console.error(error);

        const tbody = document.querySelector('#sections-view .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        sections.forEach(sec => {
            tbody.innerHTML += `
                <tr>
                    <td><span class="subject-code">${sec.section_name}</span></td>
                    <td>${sec.subjects?.title || 'Unknown Subject'}</td>
                    <td>${sec.school_year}</td>
                    <td>${sec.semester}</td>
                    <td class="text-right">
                        <div class="action-btns justify-end">
                            <button class="btn-delete" onclick="adminApp.deleteSection('${sec.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    // ==========================================
    // SUPABASE DELETION
    // ==========================================

    async deleteProfile(id) {
        if (!confirm('Delete this user permanently?')) return;
        const { error } = await window.supabase.from('profiles').delete().eq('id', id);
        if (error) alert(error.message);
        else { this.loadStudents(); this.loadTeachers(); }
    }

    async deleteSection(id) {
        if (!confirm('Delete this section?')) return;
        const { error } = await window.supabase.from('sections').delete().eq('id', id);
        if (error) alert(error.message);
        else this.loadSections();
    }

    // ==========================================
    // UI UTILITIES
    // ==========================================

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('open');
    }

    closeModal(modalElement) {
        modalElement.classList.remove('open');
    }
}

let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminDashboardController();
});