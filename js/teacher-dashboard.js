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

let teacherApp;
document.addEventListener('DOMContentLoaded', () => {
    teacherApp = new TeacherDashboardController();
});