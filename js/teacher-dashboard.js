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
        // 1. Get Logged in Teacher
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return window.location.href = 'login.html';

        // 2. Get Sections assigned to this teacher
        const { data: sections, error } = await window.supabase
            .from('sections')
            .select('id, section_name, subjects(code, title)')
            .eq('faculty_id', user.id);

        if (error || !sections.length) return console.log('No sections assigned.');

        // 3. Load students for the first section by default
        this.loadStudentsForSection(sections[0].id);
    }

    async loadStudentsForSection(sectionId) {
        const { data: records, error } = await window.supabase
            .from('records')
            .select(`
                id, grade, status, payment_status,
                profiles ( full_name, school_id )
            `)
            .eq('section_id', sectionId);

        if (error) return console.error(error);

        this.renderGradeTable(records);
    }

    renderGradeTable(records) {
        const tbody = document.querySelector('#grades-view .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        records.forEach((record, index) => {
            const isLocked = record.status === 'Locked';
            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="subject-code">${record.profiles.school_id}</span></td>
                    <td>${record.profiles.full_name}</td>
                    <td><span class="access-badge ${record.payment_status === 'Paid' ? 'unlocked' : 'locked'}">${record.payment_status}</span></td>
                    <td>
                        <input type="number" class="grade-input" id="grade-${record.id}" value="${record.grade || ''}" step="0.25" min="1.00" max="5.00" onblur="teacherApp.updateGrade('${record.id}', this.value)">
                    </td>
                    <td>
                        <span class="access-status-label ${isLocked ? 'status-locked' : 'status-unlocked'}">${record.status}</span>
                        <button style="margin-left: 10px; font-size: 0.7rem; padding: 2px 5px;" onclick="teacherApp.toggleSingleGrade('${record.id}', '${isLocked ? 'Unlocked' : 'Locked'}')">Toggle</button>
                    </td>
                </tr>
            `;
        });
    }

    // ==========================================
    // SUPABASE UPDATES
    // ==========================================

    async updateGrade(recordId, newGrade) {
        if (!newGrade) return;
        const { error } = await window.supabase
            .from('records')
            .update({ grade: parseFloat(newGrade) })
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

let teacherApp;
document.addEventListener('DOMContentLoaded', () => {
    teacherApp = new TeacherDashboardController();
});