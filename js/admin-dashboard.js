class AdminDashboardController {
    constructor() {
        this.modals        = document.querySelectorAll('.modal-overlay');
        this.modalTriggers = document.querySelectorAll('.modal-trigger');
        this.closeButtons  = document.querySelectorAll('.modal-close-btn');
        this.navTriggers   = document.querySelectorAll('.nav-trigger');

        this.initEvents();
        this.initFormSubmissions();
        this.initializeApp();
    }

    async initializeApp() {
        const isValid = await this.validateAdminAccess();
        if (isValid) {
            this.loadStudents();
            this.loadTeachers();
            this.loadSections();
            this.loadDashboardStats();
            this.initGradesView();
        }
    }

    async validateAdminAccess() {
        const localSession = JSON.parse(localStorage.getItem('lcc_user'));
    
        if (!localSession || localSession.role !== 'admin') {
            window.location.href = 'login.html';
            return false;
        }
        
        const { data: profile } = await window.supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', localSession.id)
            .single();
        if (!profile || profile.role !== 'admin') {
            alert('Unauthorized access.');
            window.location.href = 'login.html';
            return false;
        }
        // Show admin name in sidebar/header if available
        if (profile.full_name) {
            document.querySelectorAll('.sidebar-user-name, .header-user-name, .info-name').forEach(el => {
                el.textContent = profile.full_name;
            });
        }
        return true;
    }

    // ==========================================
    // FORM SUBMISSION WIRING
    // ==========================================

    initFormSubmissions() {
        // 1. ENROLL STUDENT
        const btnSaveStudent = document.getElementById('btn-save-student');
        if (btnSaveStudent) {
            btnSaveStudent.addEventListener('click', () => this.handleEnrollStudent());
        }

        // 2. ADD TEACHER — target the button inside addTeacherModal specifically
        const addTeacherModal = document.getElementById('addTeacherModal');
        if (addTeacherModal) {
            const btnSaveTeacher = addTeacherModal.querySelector('.btn-submit');
            if (btnSaveTeacher) {
                btnSaveTeacher.addEventListener('click', () => this.handleAddTeacher());
            }
        }

        // 3. ADD SECTION
        const addSectionModal = document.getElementById('addSectionModal');
        if (addSectionModal) {
            const btnSaveSection = addSectionModal.querySelector('.btn-submit');
            if (btnSaveSection) {
                btnSaveSection.addEventListener('click', () => this.handleAddSection());
            }
        }

        // 4. UPDATE STUDENT
        const btnUpdateStudent = document.getElementById('btn-update-student');
        if (btnUpdateStudent) {
            btnUpdateStudent.addEventListener('click', () => this.handleUpdateStudent());
        }
    }

    // ==========================================
    // HELPER: CREATE AUTH USER (NO EMAIL SENT)
    //
    // Uses the Admin API (service role key) so:
    //   • No confirmation email is ever sent → no rate limit
    //   • Any email format is accepted (e.g. fake@lcc.edu)
    //   • User is immediately active and can log in
    // ==========================================

    async _createAuthUser(email, password) {
        // Prefer admin API (bypasses email entirely)
        if (window.supabaseAdmin) {
            const { data, error } = await window.supabaseAdmin.auth.admin.createUser({
                email:         email,
                password:      password,
                email_confirm: true,   // Mark as confirmed — no email sent
            });
            if (error) throw error;
            return data.user.id;
        }

        // Fallback: regular signUp (requires "Disable email confirmations" in Supabase)
        const { data, error } = await window.supabase.auth.signUp({ email, password });
        if (error) throw error;
        const uid = data?.user?.id;
        if (!uid) throw new Error(
            'Account creation returned no user ID. ' +
            'Please paste your service_role key into admin-dashboard.html, or ' +
            'disable email confirmations in Supabase → Authentication → Settings.'
        );
        return uid;
    }

    // ==========================================
    // ENROLL STUDENT
    // Auth email is always studentId@lcc.edu — NEVER the contact email field.
    // ==========================================

    async handleEnrollStudent() {
        const btn       = document.getElementById('btn-save-student');
        const studentId = document.getElementById('add-student-id').value.trim();
        const fullName  = document.getElementById('add-student-fullname').value.trim();

        if (!studentId || !fullName) return this.showModalError('addStudentModal', 'Required fields missing.');

        this.setButtonLoading(btn, true, 'Enrolling...');

        try {
            // DIRECT INSERT TO DATABASE
            const { error: profileError } = await window.supabase.from('profiles').insert({
                school_id:      studentId,
                full_name:      fullName,
                role:           'student',
                program:        document.getElementById('add-student-program').value,
                sex:            document.getElementById('add-student-sex').value,
                birthday:       document.getElementById('add-student-bday').value || null,
                age:            parseInt(document.getElementById('add-student-age').value) || null,
                address:        document.getElementById('add-student-address').value.trim(),
                contact:        document.getElementById('add-student-contact').value.trim(),
                email:          document.getElementById('add-student-email').value.trim() || `${studentId}@lcc.edu`,
                father_name:    document.getElementById('add-student-father').value.trim(),
                father_contact: document.getElementById('add-student-father-contact').value.trim(),
                mother_name:    document.getElementById('add-student-mother').value.trim(),
                mother_contact: document.getElementById('add-student-mother-contact').value.trim(),
            });

            if (profileError) throw profileError;

            this.closeModalById('addStudentModal');
            this.clearForm('addStudentModal');
            this.showToast(`✅ "${fullName}" enrolled! Login with ID: ${studentId}`);
            this.loadStudents();
            this.loadDashboardStats();

        } catch (err) {
            this.showModalError('addStudentModal', err.message);
        } finally {
            this.setButtonLoading(btn, false, 'Enroll Student');
        }
    }

    async handleAddTeacher() {
        const addTeacherModal = document.getElementById('addTeacherModal');
        const btn = addTeacherModal.querySelector('.btn-submit');
        const username  = document.getElementById('teacher-username').value.trim();
        const fullName  = document.getElementById('teacher-fullname').value.trim();
        const dept      = document.getElementById('teacher-dept').value.trim();

        if (!username || !fullName) return this.showModalError('addTeacherModal', 'Required fields missing.');

        this.setButtonLoading(btn, true, 'Saving...');

        try {
            // DIRECT INSERT TO DATABASE
            const { error: profileError } = await window.supabase.from('profiles').insert({
                school_id:  username,
                full_name:  fullName,
                role:       'faculty',
                department: dept,
                email:      document.getElementById('teacher-email').value.trim() || `${username}@lcc.edu`,
            });

            if (profileError) throw profileError;

            this.closeModalById('addTeacherModal');
            this.clearForm('addTeacherModal');
            this.showToast(`✅ Teacher "${fullName}" added! Login ID: ${username}`);
            this.loadTeachers();
            this.loadDashboardStats();

        } catch (err) {
            this.showModalError('addTeacherModal', err.message);
        } finally {
            this.setButtonLoading(btn, false, 'Save Teacher');
        }
    }
    // ==========================================
    // ADD SECTION
    // Direct INSERT — no auth user needed.
    // ==========================================

    async handleAddSection() {
        const addSectionModal = document.getElementById('addSectionModal');
        const btn = addSectionModal.querySelector('.btn-submit');

        const sectionName = document.getElementById('add-sec-name').value.trim();
        const program     = document.getElementById('add-sec-program').value;
        const yearLevel   = document.getElementById('add-sec-year').value;
        const semester    = document.getElementById('add-sec-sem').value;

        if (!sectionName) {
            return this.showModalError('addSectionModal', 'Section Name is required.');
        }

        this.setButtonLoading(btn, true, 'Saving...');

        try {
            const { error } = await window.supabase.from('sections').insert({
                section_name: sectionName,
                program:      program,
                year_level:   yearLevel,
                semester:     semester,
                school_year:  this.getCurrentSchoolYear(),
            });

            if (error) throw error;

            this.closeModalById('addSectionModal');
            this.clearForm('addSectionModal');
            this.showToast(`✅ Section "${sectionName}" created!`);
            this.loadSections();
            this.loadDashboardStats();

        } catch (err) {
            this.showModalError('addSectionModal', 'Error: ' + err.message);
        } finally {
            this.setButtonLoading(btn, false, 'Save Section');
        }
    }

    // ==========================================
    // UPDATE STUDENT
    // ==========================================

    async handleUpdateStudent() {
        const btn       = document.getElementById('btn-update-student');
        const studentId = document.getElementById('edit-student-id').value.trim();
        const fullName  = document.getElementById('edit-student-fullname').value.trim();

        if (!fullName) return this.showModalError('editStudentModal', 'Full Name is required.');

        this.setButtonLoading(btn, true, 'Updating...');

        try {
            const { error } = await window.supabase.from('profiles').update({
                full_name:      fullName,
                program:        document.getElementById('edit-student-program').value,
                sex:            document.getElementById('edit-student-sex').value,
                birthday:       document.getElementById('edit-student-bday').value || null,
                age:            parseInt(document.getElementById('edit-student-age').value) || null,
                address:        document.getElementById('edit-student-address').value.trim(),
                contact:        document.getElementById('edit-student-contact').value.trim(),
                email:          document.getElementById('edit-student-email').value.trim(),
                father_name:    document.getElementById('edit-student-father').value.trim(),
                father_contact: document.getElementById('edit-student-father-contact').value.trim(),
                mother_name:    document.getElementById('edit-student-mother').value.trim(),
                mother_contact: document.getElementById('edit-student-mother-contact').value.trim(),
            }).eq('school_id', studentId);

            if (error) throw error;

            this.closeModalById('editStudentModal');
            this.showToast(`✅ "${fullName}" updated successfully!`);
            this.loadStudents();

        } catch (err) {
            this.showModalError('editStudentModal', 'Error: ' + err.message);
        } finally {
            this.setButtonLoading(btn, false, 'Update Student');
        }
    }

    // ==========================================
    // SUPABASE: FETCH & RENDER DATA
    // ==========================================

    async loadDashboardStats() {
        const [{ count: studentCount }, { count: teacherCount }, { count: sectionCount }] = await Promise.all([
            window.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            window.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty'),
            window.supabase.from('sections').select('*', { count: 'exact', head: true }),
        ]);

        const el = (id) => document.getElementById(id);
        if (el('stat-students')) el('stat-students').textContent = studentCount ?? 0;
        if (el('stat-teachers')) el('stat-teachers').textContent = teacherCount ?? 0;
        if (el('stat-sections')) el('stat-sections').textContent = sectionCount ?? 0;
    }

    async loadStudents() {
        const { data: students, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('loadStudents error:', error);
            return;
        }

        // ── Students view table ──
        const tbody = document.querySelector('#students-view .data-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            if (!students || students.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:2rem;font-size:0.88rem;">No students enrolled yet. Click "+ Enroll Student" to add one.</td></tr>`;
            } else {
                students.forEach(student => {
                    tbody.innerHTML += `
                    <tr>
                        <td><span class="subject-code">${student.school_id}</span></td>
                        <td>
                            <a href="#" class="student-name-link" onclick="adminApp.openViewStudentModal('${student.id}'); return false;">
                                ${student.full_name}
                            </a>
                        </td>
                        <td>${student.program || '—'}</td>
                        <td><span class="access-badge unlocked">Active</span></td>
                        <td class="text-right">
                            <div class="action-btns justify-end">
                                <button class="action-btn-pill btn-view-row" onclick="adminApp.openViewStudentModal('${student.id}')">View</button>
                                <button class="action-btn-pill btn-edit-row" onclick="adminApp.openEditStudentModal('${student.id}')">Edit</button>
                                <button class="action-btn-pill btn-delete-row" onclick="adminApp.deleteProfile('${student.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
                });
            }
        }

        // ── Dashboard "Recently Added" table ──
        const recentTbody = document.querySelector('#dashboard-view .data-table tbody');
        if (recentTbody) {
            recentTbody.innerHTML = '';
            if (!students || students.length === 0) {
                recentTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--gray-400);padding:1.5rem;font-size:0.88rem;">No students added yet.</td></tr>`;
            } else {
                students.slice(0, 5).forEach(student => {
                    recentTbody.innerHTML += `
                        <tr>
                            <td><span class="subject-code">${student.school_id}</span></td>
                            <td>${student.full_name}</td>
                            <td>${student.program || '—'}</td>
                        </tr>
                    `;
                });
            }
        }
    }

    async loadTeachers() {
        const { data: teachers, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('role', 'faculty')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('loadTeachers error:', error);
            return;
        }

        const tbody = document.querySelector('#teachers-view .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!teachers || teachers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:2rem;font-size:0.88rem;">No teachers added yet. Click "+ Add Teacher" to get started.</td></tr>`;
            return;
        }

        teachers.forEach(teacher => {
            tbody.innerHTML += `
            <tr>
                <td><span class="subject-code">${teacher.school_id}</span></td>
                <td>${teacher.full_name}</td>
                <td>${teacher.email || teacher.school_id + '@lcc.edu'}</td>
                <td>${teacher.department || '—'}</td>
                <td class="text-right">
                    <div class="action-btns justify-end">
                        <button class="action-btn-pill btn-view-row" onclick="adminApp.openViewTeacherModal('${teacher.id}')">View</button>
                        <button class="action-btn-pill btn-edit-row" onclick="adminApp.openEditTeacherModal('${teacher.id}')">Edit</button>
                        <button class="action-btn-pill btn-delete-row" onclick="adminApp.deleteProfile('${teacher.id}')">Delete</button>
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

        if (error) {
            console.error('loadSections error:', error);
            return;
        }

        const tbody = document.querySelector('#sections-view .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!sections || sections.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:2rem;font-size:0.88rem;">No sections created yet. Click "+ Add Section" to create one.</td></tr>`;
            return;
        }

        sections.forEach(sec => {
            tbody.innerHTML += `
            <tr>
                <td><span class="subject-code">${sec.section_name}</span></td>
                <td>${sec.subjects?.title || '—'}</td>
                <td>${sec.school_year || '—'}</td>
                <td>${sec.semester || '—'}</td>
                <td class="text-right">
                    <div class="action-btns justify-end">
                        <button class="action-btn-pill btn-view-row" onclick="adminApp.openViewSectionModal('${sec.id}')">View</button>
                        <button class="action-btn-pill btn-edit-row" onclick="adminApp.openEditSectionModal('${sec.id}')">Edit</button>
                        <button class="action-btn-pill btn-delete-row" onclick="adminApp.deleteSection('${sec.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
        });
    }

    // ==========================================
    // OPEN EDIT STUDENT MODAL
    // ==========================================

    async openEditStudentModal(profileId) {
        const { data: student, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error || !student) return alert('Could not load student data.');

        document.getElementById('edit-student-id').value             = student.school_id    || '';
        document.getElementById('edit-student-fullname').value       = student.full_name    || '';
        document.getElementById('edit-student-sex').value            = student.sex          || 'Male';
        document.getElementById('edit-student-bday').value           = student.birthday     || '';
        document.getElementById('edit-student-age').value            = student.age          || '';
        document.getElementById('edit-student-address').value        = student.address      || '';
        document.getElementById('edit-student-contact').value        = student.contact      || '';
        document.getElementById('edit-student-email').value          = student.email        || '';
        document.getElementById('edit-student-program').value        = student.program      || 'BSIT';
        document.getElementById('edit-student-father').value         = student.father_name   || '';
        document.getElementById('edit-student-father-contact').value = student.father_contact || '';
        document.getElementById('edit-student-mother').value         = student.mother_name   || '';
        document.getElementById('edit-student-mother-contact').value = student.mother_contact || '';

        this.openModal('editStudentModal');
    }

    // ==========================================
    // GRADES VIEW — Read-only monitor for admin
    // ==========================================

    async initGradesView() {
        // Populate section dropdown and wire up change events
        await this.populateGradesSectionDropdown();

        const secSelect = document.getElementById('admin-grades-section-select');
        const subSelect = document.getElementById('admin-grades-subject-select');

        if (secSelect) {
            secSelect.addEventListener('change', async () => {
                const sectionId = secSelect.value;
                subSelect.innerHTML = '<option value="">— All Subjects —</option>';
                if (!sectionId) return;
                await this.populateGradesSubjectDropdown(sectionId);
                this.loadGrades(sectionId, subSelect.value);
            });
        }

        if (subSelect) {
            subSelect.addEventListener('change', () => {
                const sectionId = secSelect ? secSelect.value : '';
                if (sectionId) this.loadGrades(sectionId, subSelect.value);
            });
        }
    }

    async populateGradesSectionDropdown() {
        const select = document.getElementById('admin-grades-section-select');
        if (!select) return;

        const { data: sections } = await window.supabase
            .from('sections')
            .select('id, section_name, semester, school_year')
            .order('section_name');

        if (sections) {
            sections.forEach(sec => {
                const opt = document.createElement('option');
                opt.value = sec.id;
                opt.textContent = `${sec.section_name} — ${sec.semester || ''} ${sec.school_year || ''}`.trim();
                select.appendChild(opt);
            });
        }
    }

    async populateGradesSubjectDropdown(sectionId) {
        const select = document.getElementById('admin-grades-subject-select');
        if (!select) return;

        const { data: section } = await window.supabase
            .from('sections')
            .select('subjects(id, code, title)')
            .eq('id', sectionId)
            .single();

        if (section?.subjects) {
            const opt = document.createElement('option');
            opt.value = section.subjects.id;
            opt.textContent = `${section.subjects.code} — ${section.subjects.title}`;
            select.appendChild(opt);
        }
    }

    async loadGrades(sectionId, subjectId = '') {
        const tbody = document.getElementById('admin-grades-tbody');
        const tfoot = document.getElementById('admin-grades-tfoot');
        const countEl = document.getElementById('admin-grades-count');
        const panelTitle = document.getElementById('admin-grades-panel-title');
        const panelSub = document.getElementById('admin-grades-panel-sub');

        if (!tbody) return;

        // Show loading state
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--gray-400);padding:2rem;">Loading grades…</td></tr>`;

        // Fetch section info for panel header
        const { data: secInfo } = await window.supabase
            .from('sections')
            .select('section_name, semester, school_year, subjects(code, title)')
            .eq('id', sectionId)
            .single();

        if (panelTitle && secInfo) {
            panelTitle.textContent = `${secInfo.subjects?.code || ''} — ${secInfo.subjects?.title || secInfo.section_name}`;
        }
        if (panelSub && secInfo) {
            panelSub.textContent = `${secInfo.section_name} • ${secInfo.school_year || ''} • ${secInfo.semester || ''}`;
        }

        // Fetch records with student profiles
        const query = window.supabase
            .from('records')
            .select(`
                id, prelim, midterm, final, final_rating, status, payment_status,
                profiles ( full_name, school_id )
            `)
            .eq('section_id', sectionId);

        const { data: records, error } = await query;
        if (error) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#dc2626;padding:2rem;">Error loading grades: ${error.message}</td></tr>`;
            return;
        }

        this.renderGradesTable(records || [], countEl, tfoot);
    }

    renderGradesTable(records, countEl, tfoot) {
        const tbody = document.getElementById('admin-grades-tbody');
        if (!tbody) return;

        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--gray-400);padding:2.5rem;font-size:0.88rem;">No student records found for this section.</td></tr>`;
            if (tfoot) tfoot.innerHTML = '';
            if (countEl) countEl.textContent = '0 student(s)';
            return;
        }

        const fmt = (val) => {
            if (val === null || val === undefined || val === '') return '—';
            const n = parseFloat(val);
            return isNaN(n) ? '—' : n.toFixed(2);
        };

        tbody.innerHTML = '';
        let gwaSum = 0;
        let gwaCount = 0;
        let paidCount = 0;

        records.forEach((record, i) => {
            const profile    = record.profiles || {};
            const isPaid     = record.payment_status === 'Paid';
            const fr         = fmt(record.final_rating);
            const isReleased = record.status === 'Unlocked';
            const hasFR      = fr !== '—';

            if (isPaid) paidCount++;
            if (hasFR && isReleased) {
                gwaSum += parseFloat(record.final_rating);
                gwaCount++;
            }

            // Grade color class
            const gc = (val) => {
                if (!isReleased || val === '—') return 'grade-locked';
                const n = parseFloat(val);
                return (isNaN(n) || n > 3.0) ? 'grade-low' : 'grade-high';
            };

            // Remarks
            let remarks = `<span class="empty-grade-text">Pending</span>`;
            if (isReleased && hasFR) {
                const frNum = parseFloat(record.final_rating);
                remarks = frNum <= 3.0
                    ? `<span class="grade-pill grade-high">Passed</span>`
                    : `<span class="grade-pill grade-low">Failed</span>`;
            } else if (!isReleased) {
                remarks = `<span class="access-badge locked" style="font-size:0.72rem;">Locked</span>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td><span class="subject-code">${profile.school_id || '—'}</span></td>
                    <td style="font-weight:600;">${profile.full_name || '—'}</td>
                    <td><span class="access-badge ${isPaid ? 'unlocked' : 'locked'}">${record.payment_status || 'Unpaid'}</span></td>
                    <td><span class="grade-pill ${gc(record.prelim)}">${isReleased ? fmt(record.prelim) : '—'}</span></td>
                    <td><span class="grade-pill ${gc(record.midterm)}">${isReleased ? fmt(record.midterm) : '—'}</span></td>
                    <td><span class="grade-pill ${gc(record.final)}">${isReleased ? fmt(record.final) : '—'}</span></td>
                    <td><span class="grade-pill ${hasFR && isReleased ? gc(record.final_rating) : 'grade-locked'}" style="font-weight:800;">${isReleased ? fr : '—'}</span></td>
                    <td>${remarks}</td>
                </tr>
            `;
        });

        // Count badge
        if (countEl) countEl.textContent = `${records.length} student(s) · ${paidCount} paid`;

        // GWA tfoot
        const gwa = gwaCount > 0 ? (gwaSum / gwaCount).toFixed(2) : 'N/A';
        if (tfoot) {
            tfoot.innerHTML = `
                <tr class="tfoot-bg">
                    <td colspan="7" class="tfoot-label">Section GWA (Released Grades Only)</td>
                    <td class="tfoot-value"><strong>${gwa}</strong></td>
                    <td></td>
                </tr>
            `;
        }
    }

    printGradeReport() {
        const panel = document.getElementById('admin-grades-panel');
        if (!panel) return;

        const title   = document.getElementById('admin-grades-panel-title')?.textContent || 'Grade Report';
        const sub     = document.getElementById('admin-grades-panel-sub')?.textContent   || '';
        const tableEl = document.getElementById('admin-grades-table');
        if (!tableEl) return;

        const printWin = window.open('', '_blank', 'width=900,height=700');
        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} — LCC Grade Report</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #111; padding: 2rem; }
                    .print-header { text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid #1e3a5f; padding-bottom: 1rem; }
                    .print-header h1 { font-size: 1.1rem; font-weight: 800; color: #1e3a5f; }
                    .print-header p  { font-size: 0.82rem; color: #555; margin-top: 0.2rem; }
                    .print-header .school { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.3rem; }
                    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                    th { background: #1e3a5f; color: #fff; padding: 0.5rem 0.75rem; font-size: 0.75rem; text-align: left; }
                    td { padding: 0.45rem 0.75rem; border-bottom: 1px solid #e5e7eb; font-size: 0.8rem; }
                    tr:nth-child(even) td { background: #f8fafc; }
                    tfoot td { background: #dbeafe !important; font-weight: 700; color: #1e40af; }
                    .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 100px; font-weight: 700; font-size: 0.72rem; }
                    .badge-paid { background: #dcfce7; color: #15803d; }
                    .badge-unpaid { background: #fee2e2; color: #b91c1c; }
                    .grade-pass { color: #15803d; font-weight: 700; }
                    .grade-fail { color: #b91c1c; font-weight: 700; }
                    .grade-lock { color: #9ca3af; }
                    .print-footer { margin-top: 2rem; font-size: 0.75rem; color: #9ca3af; text-align: right; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <div class="school">Laguna College of Criminology (LCC)</div>
                    <h1>${title}</h1>
                    <p>${sub}</p>
                    <p>Printed: ${new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
                ${tableEl.outerHTML}
                <div class="print-footer">Generated by LCC Registrar Portal &mdash; For official use only.</div>
            </body>
            </html>
        `);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => printWin.print(), 400);
    }

    // ==========================================
    // DELETION
    // ==========================================

    async deleteProfile(id) {
        if (!confirm('Delete this user? This removes their profile. To fully delete the login account, use the Supabase dashboard.')) return;

        const { error } = await window.supabase.from('profiles').delete().eq('id', id);
        if (error) {
            alert('Failed to delete profile: ' + error.message);
        } else {
            // Try to also delete auth account via admin API
            if (window.supabaseAdmin) {
                await window.supabaseAdmin.auth.admin.deleteUser(id).catch(() => {});
            }
            this.showToast('User deleted.');
            this.loadStudents();
            this.loadTeachers();
            this.loadDashboardStats();
        }
    }

    async deleteSection(id) {
        if (!confirm('Delete this section? This may affect linked records.')) return;
        const { error } = await window.supabase.from('sections').delete().eq('id', id);
        if (error) {
            alert('Failed to delete section: ' + error.message);
        } else {
            this.showToast('Section deleted.');
            this.loadSections();
            this.loadDashboardStats();
        }
    }

    // ==========================================
    // UI / MODAL UTILITIES
    // ==========================================

    initEvents() {
        this.modalTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetModal = btn.getAttribute('data-modal-target');
                this.openModal(targetModal);
                if (targetModal === 'addTeacherModal') this.populateTeacherSectionDropdown();
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

        // Close modal when clicking the backdrop
        this.modals.forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeModal(overlay);
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

    closeModalById(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('open');
    }

    clearForm(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.querySelectorAll('input:not([readonly]), select, textarea').forEach(el => {
            el.value = el.tagName === 'SELECT' ? (el.options[0]?.value ?? '') : '';
        });
        const errEl = modal.querySelector('.modal-form-error');
        if (errEl) errEl.remove();
    }

    setButtonLoading(btn, isLoading, loadingText) {
        if (!btn) return;
        btn.disabled    = isLoading;
        btn.textContent = loadingText;
    }

    showModalError(modalId, message) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        let errEl = modal.querySelector('.modal-form-error');
        if (!errEl) {
            errEl           = document.createElement('p');
            errEl.className = 'modal-form-error';
            errEl.style.cssText = 'color:#dc2626;background:#fee2e2;padding:0.6rem 0.9rem;border-radius:8px;font-size:0.82rem;margin-bottom:0.75rem;';
            modal.querySelector('.modal-body').prepend(errEl);
        }
        errEl.textContent = message;
    }

    showToast(message) {
        let t = document.getElementById('adminToast');
        if (!t) {
            t           = document.createElement('div');
            t.id        = 'adminToast';
            t.className = 'admin-toast';
            document.body.appendChild(t);
        }
        t.textContent = message;
        t.classList.add('visible');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => t.classList.remove('visible'), 5000);
    }

    async populateTeacherSectionDropdown() {
        const select = document.getElementById('teacher-section');
        if (!select) return;
        select.innerHTML = '<option value="">— No section yet —</option>';
        const { data: sections } = await window.supabase
            .from('sections')
            .select('id, section_name')
            .order('section_name');
        if (sections) {
            sections.forEach(sec => {
                const opt       = document.createElement('option');
                opt.value       = sec.id;
                opt.textContent = sec.section_name;
                select.appendChild(opt);
            });
        }
    }

    getCurrentSchoolYear() {
        const now   = new Date();
        const year  = now.getFullYear();
        const month = now.getMonth() + 1;
        return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }

    openStudentProfile(profileId) {
        this.openEditStudentModal(profileId);
    }

    async openViewStudentModal(profileId) {
        const { data: student, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error || !student) return alert('Could not load student data.');

        const setText = (id, val) => { 
            const el = document.getElementById(id); 
            if (el) el.textContent = val || '—'; 
        };

        setText('vs-id', student.school_id);
        setText('vs-name', student.full_name);
        setText('vs-program', student.program);
        setText('vs-sex', student.sex);
        setText('vs-birthday', student.birthday);
        setText('vs-age', student.age);
        setText('vs-address', student.address);
        setText('vs-contact', student.contact);
        setText('vs-email', student.email);
        setText('vs-father-name', student.father_name);
        setText('vs-father-contact', student.father_contact);
        setText('vs-mother-name', student.mother_name);
        setText('vs-mother-contact', student.mother_contact);

        this.openModal('viewStudentModal');
    }

    // ==========================================
    // PART 2: TEACHER VIEW & EDIT
    // ==========================================

    async openViewTeacherModal(profileId) {
        const { data: teacher, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error || !teacher) return alert('Could not load teacher data.');

        const setText = (id, val) => { 
            const el = document.getElementById(id); 
            if (el) el.textContent = val || '—'; 
        };

        setText('vt-id', teacher.school_id);
        setText('vt-name', teacher.full_name);
        setText('vt-dept', teacher.department);
        setText('vt-email', teacher.email);
        setText('vt-contact', teacher.contact);

        // Fetch assigned sections joined with subjects
        const { data: sections } = await window.supabase
            .from('sections')
            .select('section_name, subjects(code, title)')
            .eq('faculty_id', profileId);

        const listContainer = document.getElementById('vt-sections-list');
        if (listContainer) {
            listContainer.innerHTML = '';
            if (!sections || sections.length === 0) {
                listContainer.innerHTML = '<p style="color:var(--gray-500);font-size:0.85rem;padding:0.5rem 0;">No sections currently assigned.</p>';
            } else {
                sections.forEach(sec => {
                    const subjCode = sec.subjects?.code || 'No Subject';
                    const subjTitle = sec.subjects?.title || '';
                    listContainer.innerHTML += `
                        <div class="profile-card-row" style="flex-direction:column; align-items:flex-start; gap:0.25rem;">
                            <strong style="color:var(--gray-800); font-size:0.85rem;">${sec.section_name}</strong>
                            <span style="color:var(--gray-500); font-size:0.75rem;">${subjCode} — ${subjTitle}</span>
                        </div>
                    `;
                });
            }
        }

        this.openModal('viewTeacherModal');
    }

    async openEditTeacherModal(profileId) {
        const { data: teacher, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error || !teacher) return alert('Could not load teacher data.');

        document.getElementById('edit-teacher-id-hidden').value = teacher.id;
        document.getElementById('edit-teacher-fullname').value = teacher.full_name || '';
        document.getElementById('edit-teacher-dept').value = teacher.department || '';
        document.getElementById('edit-teacher-email').value = teacher.email || '';
        document.getElementById('edit-teacher-contact').value = teacher.contact || '';

        this.openModal('editTeacherModal');
    }

    async handleUpdateTeacher() {
        const btn = document.getElementById('btn-update-teacher-save');
        const profileId = document.getElementById('edit-teacher-id-hidden').value;
        const fullName = document.getElementById('edit-teacher-fullname').value.trim();

        if (!fullName) return this.showModalError('editTeacherModal', 'Full Name is required.');

        this.setButtonLoading(btn, true, 'Updating...');

        try {
            const { error } = await window.supabase.from('profiles').update({
                full_name: fullName,
                department: document.getElementById('edit-teacher-dept').value.trim(),
                email: document.getElementById('edit-teacher-email').value.trim(),
                contact: document.getElementById('edit-teacher-contact').value.trim()
            }).eq('id', profileId);

            if (error) throw error;

            this.closeModalById('editTeacherModal');
            this.showToast(`✅ Teacher "${fullName}" updated successfully!`);
            this.loadTeachers();
        } catch (err) {
            this.showModalError('editTeacherModal', 'Error: ' + err.message);
        } finally {
            this.setButtonLoading(btn, false, 'Update Teacher');
        }
    }

    // ==========================================
    // PART 3: SECTION VIEW & EDIT
    // ==========================================

    async openViewSectionModal(sectionId) {
        const { data: section, error } = await window.supabase
            .from('sections')
            .select(`
                *,
                profiles ( full_name ),
                subjects ( code, title )
            `)
            .eq('id', sectionId)
            .single();

        if (error || !section) return alert('Could not load section data.');

        // Count enrolled students
        const { count } = await window.supabase
            .from('records')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', sectionId);

        const setText = (id, val) => { 
            const el = document.getElementById(id); 
            if (el) el.textContent = val || '—'; 
        };

        setText('vsec-name', section.section_name);
        setText('vsec-program', section.program);
        setText('vsec-year', section.year_level);
        setText('vsec-sem', section.semester);
        setText('vsec-sy', section.school_year);
        setText('vsec-teacher', section.profiles?.full_name || 'Unassigned');
        setText('vsec-subject', section.subjects ? `${section.subjects.code} — ${section.subjects.title}` : 'Unassigned');
        setText('vsec-count', count !== null ? count : '0');

        this.openModal('viewSectionModal');
    }

    async populateFacultyDropdown(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">— Select Teacher —</option>';
        
        const { data: teachers } = await window.supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'faculty')
            .order('full_name');
            
        if (teachers) {
            teachers.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.full_name;
                select.appendChild(opt);
            });
        }
    }

    async populateSubjectDropdown(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">— Select Subject —</option>';
        
        const { data: subjects } = await window.supabase
            .from('subjects')
            .select('id, code, title')
            .order('code');
            
        if (subjects) {
            subjects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `${s.code} — ${s.title}`;
                select.appendChild(opt);
            });
        }
    }

    async openEditSectionModal(sectionId) {
        const { data: section, error } = await window.supabase
            .from('sections')
            .select('*')
            .eq('id', sectionId)
            .single();

        if (error || !section) return alert('Could not load section data.');

        document.getElementById('edit-sec-id-hidden').value = section.id;
        document.getElementById('edit-sec-name-val').value = section.section_name || '';
        document.getElementById('edit-sec-program-val').value = section.program || '';
        document.getElementById('edit-sec-year-val').value = section.year_level || '';
        document.getElementById('edit-sec-sem-val').value = section.semester || '';

        await Promise.all([
            this.populateFacultyDropdown('edit-sec-faculty'),
            this.populateSubjectDropdown('edit-sec-subject')
        ]);

        document.getElementById('edit-sec-faculty').value = section.faculty_id || '';
        document.getElementById('edit-sec-subject').value = section.subject_id || '';

        this.openModal('editSectionModal');
    }

    async handleUpdateSection() {
        const btn = document.getElementById('btn-update-section-save');
        const sectionId = document.getElementById('edit-sec-id-hidden').value;
        const sectionName = document.getElementById('edit-sec-name-val').value.trim();

        if (!sectionName) return this.showModalError('editSectionModal', 'Section Name is required.');

        this.setButtonLoading(btn, true, 'Updating...');

        try {
            const facultyId = document.getElementById('edit-sec-faculty').value;
            const subjectId = document.getElementById('edit-sec-subject').value;

            const { error } = await window.supabase.from('sections').update({
                section_name: sectionName,
                program: document.getElementById('edit-sec-program-val').value,
                year_level: document.getElementById('edit-sec-year-val').value,
                semester: document.getElementById('edit-sec-sem-val').value,
                faculty_id: facultyId ? facultyId : null,
                subject_id: subjectId ? subjectId : null
            }).eq('id', sectionId);

            if (error) throw error;

            this.closeModalById('editSectionModal');
            this.showToast(`✅ Section "${sectionName}" updated successfully!`);
            this.loadSections();
        } catch (err) {
            this.showModalError('editSectionModal', 'Error: ' + err.message);
        } finally {
            this.setButtonLoading(btn, false, 'Update Section');
        }
    }
}

let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminDashboardController();
});

/*
=============================================================
  SETUP CHECKLIST — READ THIS
=============================================================

  STEP 1 — Paste your service_role key
    In admin-dashboard.html, find:
      const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';
    Replace with your key from:
      Supabase Dashboard → Settings → API → service_role (secret)

    This is what removes the email rate limit. The admin API
    creates users instantly with no email sent at all.

  STEP 2 — Disable RLS insert policy for profiles (or add one)
    If you get "new row violates RLS" errors:
      Supabase → Table Editor → profiles → RLS Policies
      Add an INSERT policy: "allow authenticated" or disable RLS
      while testing.

  STEP 3 — profiles table columns required
    id, school_id, full_name, role, program, sex,
    birthday, age, address, contact, email,
    father_name, father_contact, mother_name,
    mother_contact, department, created_at

  HOW LOGIN WORKS
    Students:  ID = "2026-001"  → email: 2026-001@lcc.edu  password: 2026-001
    Teachers:  Username = "t.doe" → email: t.doe@lcc.edu   password: t.doe
    (Default password always equals the username/ID — tell users to change it)
=============================================================
*/