class TeacherDashboardController {
    constructor() {
        this.session = null;
        this.profile = null;
        this.sections = [];
        this.currentSectionId = null;
        
        this.init();
    }

    async init() {
        // 1. Session check
        const sessionStr = localStorage.getItem('lcc_user');
        if (!sessionStr) return window.location.href = 'login.html';
        this.session = JSON.parse(sessionStr);

        if (this.session.role !== 'faculty') {
            this.showToast('Unauthorized access. Redirecting...');
            return window.location.href = 'login.html';
        }

        // 2. Fetch Profile
        const { data: profile } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', this.session.id)
            .single();
        
        if (!profile) return window.location.href = 'login.html';
        this.profile = profile;

        // 3. Update DOM (Names & Avatars)
        const nameText = this.profile.full_name || 'Teacher';
        const initial = nameText.charAt(0).toUpperCase();
        
        document.querySelectorAll('.sidebar-user-name, .header-user-name, .info-name').forEach(el => el.textContent = nameText);
        document.querySelectorAll('.sidebar-avatar, .header-avatar, .info-avatar').forEach(el => el.textContent = initial);
        
        const metaEl = document.querySelector('.info-meta');
        if (metaEl) metaEl.innerHTML = `${this.profile.department || 'Faculty'} &bull; Teacher`;

        // 4. Fetch Sections
        await this.loadSections();

        // 5. Render Everything
        await this.renderDashboardStats();
        this.renderSubjectsAtAGlance();
        this.renderSubjectDetailCards();
        this.initDropdowns();
        
        // 6. Wire up static buttons
        const btnUnlockAll = document.getElementById('btn-unlock-all');
        const btnLockAll = document.getElementById('btn-lock-all');
        const btnSaveAccess = document.querySelector('#access-view .panel-footer .btn-save');
        
        if (btnUnlockAll) btnUnlockAll.addEventListener('click', () => this.bulkUpdateAccess('Unlocked'));
        if (btnLockAll) btnLockAll.addEventListener('click', () => this.bulkUpdateAccess('Locked'));
        if (btnSaveAccess) btnSaveAccess.addEventListener('click', () => {
            this.showToast('✅ Access settings saved/refreshed');
            if (this.currentSectionId) this.loadAccessTable(this.currentSectionId);
        });
    }

    async loadSections() {
        const { data: sections, error } = await window.supabase
            .from('sections')
            .select('id, section_name, program, year_level, semester, school_year, subjects(code, title, units)')
            .eq('faculty_id', this.session.id);
            
        if (error) return this.showToast('Error loading sections');
        
        this.sections = sections || [];
        if (this.sections.length > 0) {
            this.currentSectionId = this.sections[0].id;
        }
    }

    async renderDashboardStats() {
        const sectionIds = this.sections.map(s => s.id);
        
        // Update DOM elements for "My Subjects" immediately
        const statCards = document.querySelectorAll('#dashboard-view .stat-card-value');
        if (statCards.length >= 1) statCards[0].textContent = this.sections.length;

        if (sectionIds.length === 0) {
            if (statCards.length >= 4) {
                statCards[1].textContent = '0';
                statCards[2].textContent = '0';
                statCards[3].textContent = '0';
            }
            return;
        }

        // Fetch all records for this teacher's sections
        const { data: records, error } = await window.supabase
            .from('records')
            .select('*')
            .in('section_id', sectionIds);

        if (error) return;

        const totalStudents = records.length;
        const gradesEntered = records.filter(r => r.final_rating !== null).length;
        const gradesUnlocked = records.filter(r => r.status === 'Unlocked').length;

        if (statCards.length >= 4) {
            statCards[1].textContent = totalStudents;
            statCards[2].textContent = gradesEntered;
            statCards[3].textContent = gradesUnlocked;
        }

        const metaStats = document.querySelectorAll('.info-meta');
        if (metaStats.length > 1) {
            metaStats[1].innerHTML = `Handling ${this.sections.length} subjects &bull; ${totalStudents} students`;
        }
    }

    renderSubjectsAtAGlance() {
        const tbody = document.querySelector('#dashboard-view .data-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (this.sections.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:2rem;">No subjects assigned yet.</td></tr>`;
            return;
        }

        this.sections.forEach(sec => {
            const subj = sec.subjects || {};
            tbody.innerHTML += `
                <tr>
                    <td><span class="subject-code">${subj.code || '—'}</span></td>
                    <td>${subj.title || '—'}</td>
                    <td>${subj.units || '—'}</td>
                    <td>${sec.section_name}</td>
                    <td>${sec.program || '—'}</td>
                    <td>${sec.school_year || '—'}</td>
                </tr>
            `;
        });
    }

    renderSubjectDetailCards() {
        const container = document.querySelector('#subjects-view .subjects-cards');
        if (!container) return;

        container.innerHTML = '';
        if (this.sections.length === 0) {
            container.innerHTML = `<p style="text-align:center;width:100%;color:var(--gray-400);padding:3rem;">No subjects assigned.</p>`;
            return;
        }

        this.sections.forEach(sec => {
            const subj = sec.subjects || {};
            container.innerHTML += `
                <div class="subject-detail-card">
                    <div class="sdc-header">
                        <div class="sdc-code">${subj.code || '—'}</div>
                        <span class="sdc-units">${subj.units || 0} units</span>
                    </div>
                    <h3 class="sdc-name">${subj.title || '—'}</h3>
                    <div class="sdc-meta">
                        <div class="sdc-meta-item">
                            <span class="sdc-meta-label">Section</span>
                            <span class="sdc-meta-value">${sec.section_name}</span>
                        </div>
                        <div class="sdc-meta-item">
                            <span class="sdc-meta-label">Program</span>
                            <span class="sdc-meta-value">${sec.program || '—'}</span>
                        </div>
                        <div class="sdc-meta-item">
                            <span class="sdc-meta-label">Year Level</span>
                            <span class="sdc-meta-value">${sec.year_level || '—'}</span>
                        </div>
                        <div class="sdc-meta-item">
                            <span class="sdc-meta-label">Term</span>
                            <span class="sdc-meta-value">${sec.semester || '—'}</span>
                        </div>
                    </div>
                    <div style="margin-top:1.5rem;display:flex;gap:0.5rem;">
                        <button class="btn-save" style="flex:1;" onclick="teacherApp.jumpToView('grades-view', '${sec.id}')">Manage Grades</button>
                        <button class="btn-cancel" style="flex:1;" onclick="teacherApp.jumpToView('access-view', '${sec.id}')">Access</button>
                    </div>
                </div>
            `;
        });
    }

    jumpToView(viewId, sectionId) {
        const sidebarLink = document.querySelector(`.sidebar-link[data-target='${viewId}']`);
        if (sidebarLink) sidebarLink.click();
        
        // Sync dropdowns
        const gradesDropdown = document.querySelector('#grades-view .filter-select');
        const accessDropdown = document.querySelector('#access-view .filter-select');
        
        if (gradesDropdown) {
            gradesDropdown.value = sectionId;
            if (viewId === 'grades-view') gradesDropdown.dispatchEvent(new Event('change'));
        }
        if (accessDropdown) {
            accessDropdown.value = sectionId;
            if (viewId === 'access-view') accessDropdown.dispatchEvent(new Event('change'));
        }
    }

    initDropdowns() {
        const gradesDropdown = document.querySelector('#grades-view .filter-select');
        const accessDropdown = document.querySelector('#access-view .filter-select');

        const populate = (selectEl) => {
            if (!selectEl) return;
            selectEl.innerHTML = '';
            this.sections.forEach(sec => {
                const subj = sec.subjects || {};
                const opt = document.createElement('option');
                opt.value = sec.id;
                opt.textContent = `${subj.code || ''} — ${subj.title || ''} (${sec.section_name})`;
                selectEl.appendChild(opt);
            });
        };

        populate(gradesDropdown);
        populate(accessDropdown);

        if (gradesDropdown) {
            gradesDropdown.addEventListener('change', (e) => {
                this.currentSectionId = e.target.value;
                this.loadGradeTable(e.target.value);
            });
        }
        
        if (accessDropdown) {
            accessDropdown.addEventListener('change', (e) => {
                this.currentSectionId = e.target.value;
                this.loadAccessTable(e.target.value);
            });
        }

        // Load initially
        if (this.currentSectionId) {
            this.loadGradeTable(this.currentSectionId);
            this.loadAccessTable(this.currentSectionId);
        }
    }

    async loadGradeTable(sectionId) {
        const sec = this.sections.find(s => s.id === sectionId);
        if (!sec) return;

        // Update headers
        const headerTitle = document.querySelector('#grades-view .panel-title');
        const headerSub = document.querySelector('#grades-view .panel-subtitle');
        if (headerTitle) headerTitle.textContent = `${sec.subjects?.code || ''} — ${sec.subjects?.title || ''}`;
        if (headerSub) headerSub.innerHTML = `${sec.section_name} &bull; ${sec.school_year || ''} &bull; ${sec.semester || ''}`;

        const tbody = document.querySelector('#grades-view .data-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Loading students...</td></tr>`;

        const { data: records, error } = await window.supabase
            .from('records')
            .select('*, profiles(school_id, full_name)')
            .eq('section_id', sectionId)
            .order('profiles(full_name)');

        if (error || !records) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#dc2626;">Failed to load records.</td></tr>`;
            return;
        }

        const countLabel = document.querySelector('#grades-view .panel-meta-count');
        if (countLabel) countLabel.textContent = `${records.length} student(s)`;

        if (records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:2rem;">No students enrolled in this section.</td></tr>`;
            return;
        }

        const fmt = (val) => val === null || val === undefined ? '' : Number(val).toFixed(2);

        tbody.innerHTML = '';
        records.forEach((r, i) => {
            const isPaid = r.payment_status === 'Paid';
            const profile = r.profiles || {};
            const finalRating = fmt(r.final_rating);
            
            const remarksHtml = finalRating === '' 
                ? `<span class="empty-grade-text remarks-display">No grade yet</span>`
                : (parseFloat(finalRating) <= 3.0 
                    ? `<span class="grade-pill grade-high remarks-display">Passed</span>` 
                    : `<span class="grade-pill grade-low remarks-display">Failed</span>`);

            tbody.innerHTML += `
                <tr data-record-id="${r.id}">
                    <td>${i + 1}</td>
                    <td><span class="subject-code">${profile.school_id || '—'}</span></td>
                    <td style="font-weight:600;">${profile.full_name || '—'}</td>
                    <td><span class="access-badge ${isPaid ? 'unlocked' : 'locked'}">${r.payment_status || 'Unpaid'}</span></td>
                    <td>
                        <div style="display:flex;gap:0.25rem;">
                            <input type="number" class="grade-input" placeholder="Prelim" step="0.25" min="1" max="5" value="${fmt(r.prelim)}" data-id="${r.id}" data-field="prelim" style="width:70px;">
                            <input type="number" class="grade-input" placeholder="Mid" step="0.25" min="1" max="5" value="${fmt(r.midterm)}" data-id="${r.id}" data-field="midterm" style="width:70px;">
                            <input type="number" class="grade-input" placeholder="Fin" step="0.25" min="1" max="5" value="${fmt(r.final)}" data-id="${r.id}" data-field="final" style="width:70px;">
                        </div>
                    </td>
                    <td>
                        <div style="display:flex;align-items:center;gap:0.75rem;">
                            <input type="text" class="grade-input final-rating-display" value="${finalRating}" readonly style="width:65px;background:#f8fafc;font-weight:700;">
                            ${remarksHtml}
                        </div>
                    </td>
                </tr>
            `;
        });

        // Add blur listeners to inputs
        tbody.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('blur', (e) => {
                const recId = e.target.getAttribute('data-id');
                const field = e.target.getAttribute('data-field');
                this.updateGradeField(recId, field, e.target.value);
            });
        });
    }

    async updateGradeField(recordId, field, value) {
        if (!value.trim()) return;
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed < 1.0 || parsed > 5.0) {
            return this.showToast('❌ Invalid grade. Must be 1.00 - 5.00');
        }

        // Update single field
        const { error } = await window.supabase
            .from('records')
            .update({ [field]: parsed })
            .eq('id', recordId);

        if (error) return this.showToast('❌ Failed to save grade');

        // Check if all 3 are present to compute final rating
        const { data: rec } = await window.supabase
            .from('records')
            .select('prelim, midterm, final')
            .eq('id', recordId)
            .single();

        if (rec.prelim !== null && rec.midterm !== null && rec.final !== null) {
            const finalRating = (rec.prelim + rec.midterm + rec.final) / 3;
            const rounded = parseFloat(finalRating.toFixed(2));
            
            await window.supabase.from('records').update({ final_rating: rounded }).eq('id', recordId);
            
            // Optimistic DOM Update
            const row = document.querySelector(`tr[data-record-id="${recordId}"]`);
            if (row) {
                const frInput = row.querySelector('.final-rating-display');
                const remarksEl = row.querySelector('.remarks-display');
                if (frInput) frInput.value = rounded.toFixed(2);
                if (remarksEl) {
                    remarksEl.className = rounded <= 3.0 ? 'grade-pill grade-high remarks-display' : 'grade-pill grade-low remarks-display';
                    remarksEl.textContent = rounded <= 3.0 ? 'Passed' : 'Failed';
                }
            }
            this.renderDashboardStats(); // Update stat card silently
        }
        this.showToast(`✅ ${field.charAt(0).toUpperCase() + field.slice(1)} grade saved!`);
    }

    async loadAccessTable(sectionId) {
        const sec = this.sections.find(s => s.id === sectionId);
        if (!sec) return;

        const headerTitle = document.querySelector('#access-view .panel-title');
        const headerSub = document.querySelector('#access-view .panel-subtitle');
        if (headerTitle) headerTitle.textContent = `${sec.subjects?.code || ''} — ${sec.subjects?.title || ''}`;
        if (headerSub) headerSub.innerHTML = `${sec.section_name} &bull; ${sec.school_year || ''} &bull; ${sec.semester || ''}`;

        const tbody = document.querySelector('#access-view .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Loading access records...</td></tr>`;

        const { data: records, error } = await window.supabase
            .from('records')
            .select('*, profiles(school_id, full_name)')
            .eq('section_id', sectionId)
            .order('profiles(full_name)');

        if (error || !records) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#dc2626;">Error loading access data.</td></tr>`;
            return;
        }

        const countLabel = document.querySelector('#access-view .panel-meta-count');
        if (countLabel) countLabel.textContent = `${records.length} student(s)`;

        if (records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:2rem;">No students found.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        records.forEach((r, i) => {
            const isPaid = r.payment_status === 'Paid';
            const isUnlocked = r.status === 'Unlocked';
            const profile = r.profiles || {};
            const fr = r.final_rating !== null ? Number(r.final_rating).toFixed(2) : 'No grade yet';
            const frHtml = r.final_rating !== null 
                ? `<span class="grade-pill ${r.final_rating <= 3.0 ? 'grade-high' : 'grade-low'}">${fr}</span>`
                : `<span class="empty-grade-text">${fr}</span>`;

            tbody.innerHTML += `
                <tr data-access-id="${r.id}">
                    <td>${i + 1}</td>
                    <td><span class="subject-code">${profile.school_id || '—'}</span></td>
                    <td style="font-weight:600;">${profile.full_name || '—'}</td>
                    <td><span class="access-badge ${isPaid ? 'unlocked' : 'locked'}">${r.payment_status || 'Unpaid'}</span></td>
                    <td>${frHtml}</td>
                    <td>
                        <div class="toggle-wrapper">
                            <label class="toggle-switch">
                                <input type="checkbox" class="access-toggle" data-id="${r.id}" ${isUnlocked ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="access-status-label status-${isUnlocked ? 'unlocked' : 'locked'}">${r.status || 'Locked'}</span>
                        </div>
                    </td>
                </tr>
            `;
        });

        // Add toggle listeners
        tbody.querySelectorAll('.access-toggle').forEach(chk => {
            chk.addEventListener('change', async (e) => {
                const recId = e.target.getAttribute('data-id');
                const newStatus = e.target.checked ? 'Unlocked' : 'Locked';
                
                // Optimistic UI update
                const label = e.target.closest('.toggle-wrapper').querySelector('.access-status-label');
                label.className = `access-status-label status-${newStatus.toLowerCase()}`;
                label.textContent = newStatus;

                const { error } = await window.supabase
                    .from('records')
                    .update({ status: newStatus })
                    .eq('id', recId);
                    
                if (error) {
                    e.target.checked = !e.target.checked; // revert
                    this.showToast('❌ Failed to update status');
                } else {
                    this.renderDashboardStats(); // refresh dashboard stats
                }
            });
        });
    }

    async bulkUpdateAccess(status) {
        if (!this.currentSectionId) return;
        
        const { data: records } = await window.supabase
            .from('records')
            .select('id')
            .eq('section_id', this.currentSectionId);
            
        if (!records || records.length === 0) return;
        
        const ids = records.map(r => r.id);
        const { error } = await window.supabase
            .from('records')
            .update({ status: status })
            .in('id', ids);

        if (error) {
            this.showToast(`❌ Failed to bulk update to ${status}`);
        } else {
            this.showToast(`✅ All students updated to ${status}`);
            this.loadAccessTable(this.currentSectionId);
            this.renderDashboardStats();
        }
    }

    showToast(message) {
        let t = document.getElementById('teacherToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'teacherToast';
            t.className = 'admin-toast'; 
            document.body.appendChild(t);
        }
        t.textContent = message;
        t.classList.add('visible');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => t.classList.remove('visible'), 4000);
    }
}

let teacherApp;
document.addEventListener('DOMContentLoaded', () => {
    teacherApp = new TeacherDashboardController();
});