class DashboardController {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleBtns = document.querySelectorAll('.sidebar-toggle');
        this.navLinks = document.querySelectorAll('.sidebar-nav .sidebar-link:not(.logout-link)');
        this.views = document.querySelectorAll('.view-section');
        this.pageTitle = document.getElementById('page-title');
        this.pageSubtitle = document.getElementById('page-subtitle');

        this.initEvents();
        this.loadMyData(); // Fetch Supabase Data
    }

    initEvents() {
        this.toggleBtns.forEach(btn => btn.addEventListener('click', () => this.toggleSidebar()));

        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); 
                this.switchView(e.currentTarget);
            });
        });
        
        const logoutBtn = document.querySelector('.logout-link');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await window.supabase.auth.signOut();
                window.location.href = 'login.html';
            });
        }
    }

    toggleSidebar() {
        if (this.sidebar) this.sidebar.classList.toggle('sidebar-open');
    }

    switchView(clickedLink) {
        this.navLinks.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');

        const targetId = clickedLink.getAttribute('data-target');
        this.views.forEach(view => view.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');

        if (this.pageTitle && this.pageSubtitle) {
            this.pageTitle.textContent = clickedLink.getAttribute('data-title');
            this.pageSubtitle.textContent = clickedLink.getAttribute('data-subtitle');
        }

        if (window.innerWidth <= 820 && this.sidebar) {
            this.sidebar.classList.remove('sidebar-open');
        }
    }

    // ==========================================
    // SUPABASE DATA FETCHING
    // ==========================================
    
    async loadMyData() {
        // 1. Get Logged-in User
        const localSession = JSON.parse(localStorage.getItem('lcc_user'));
        if (!localSession) return window.location.href = 'login.html';
        const user = { id: localSession.id };

        // 2. Update Profile Name in UI
        const { data: profile } = await window.supabase
            .from('profiles')
            .select('full_name, school_id')
            .eq('id', user.id)
            .single();
            
        if (profile) {
            document.querySelectorAll('.info-name, .header-user-name, .sidebar-user-name').forEach(el => el.textContent = profile.full_name);
        }

        // 3. Fetch Grades — includes prelim/midterm/final/final_rating per period
        const { data: records, error } = await window.supabase
            .from('records')
            .select(`
                status,
                prelim, midterm, final, final_rating,
                sections ( semester, subjects (code, title, units) )
            `)
            .eq('student_id', user.id);

        if (error) return console.error(error);

        this.renderGrades(records);
    }

    renderGrades(records) {
        // If Supabase returns no data, keep the hardcoded sample rows visible
        if (!records || records.length === 0) return;

        const tbody = document.querySelector('#grades-table tbody');
        const tfoot = document.getElementById('grades-tfoot');
        if (!tbody) return;

        tbody.innerHTML = '';
        let releasedCount = 0;
        let gwaSum = 0;
        let gwaCount = 0;

        // Helper: format a grade value safely
        const fmt = (val) => {
            if (val === null || val === undefined || val === '') return '--';
            const n = parseFloat(val);
            return isNaN(n) ? '--' : n.toFixed(2);
        };

        records.forEach(record => {
            const subject   = record.sections.subjects;
            const isUnlocked = record.status === 'Unlocked';

            const prelim      = isUnlocked ? fmt(record.prelim)        : '--';
            const midterm     = isUnlocked ? fmt(record.midterm)       : '--';
            const final       = isUnlocked ? fmt(record.final)         : '--';
            const finalRating = isUnlocked ? fmt(record.final_rating)  : '--';

            if (isUnlocked) {
                releasedCount++;
                const fr = parseFloat(record.final_rating);
                if (!isNaN(fr)) {
                    gwaSum += fr;
                    gwaCount++;
                }
            }

            const gradeClass   = isUnlocked ? 'grade-high'  : 'grade-locked';
            const badgeClass   = isUnlocked ? 'unlocked'    : 'locked';
            const badgeLabel   = isUnlocked ? 'Released'    : 'Locked';

            tbody.innerHTML += `
                <tr>
                    <td><span class="subject-code">${subject.code}</span></td>
                    <td>${subject.title}</td>
                    <td>${subject.units}</td>
                    <td><span class="grade-pill ${gradeClass}">${prelim}</span></td>
                    <td><span class="grade-pill ${gradeClass}">${midterm}</span></td>
                    <td><span class="grade-pill ${gradeClass}">${final}</span></td>
                    <td><span class="grade-pill ${isUnlocked && finalRating !== '--' ? 'grade-high' : 'grade-locked'}">${finalRating}</span></td>
                    <td><span class="access-badge ${badgeClass}">${badgeLabel}</span></td>
                </tr>
            `;
        });

        // GWA
        const gwa = gwaCount > 0 ? (gwaSum / gwaCount).toFixed(2) : 'N/A';

        // Update GWA stat cards (dashboard view + grades view)
        document.querySelectorAll('#student-dashboard-view .stat-card.blue .stat-card-value, #grades-gwa-value').forEach(el => {
            el.textContent = gwa;
        });

        // Update released count badge
        const releasedEl = document.getElementById('grades-released-count');
        if (releasedEl) releasedEl.textContent = releasedCount;

        // Render tfoot GWA row
        if (tfoot) {
            tfoot.innerHTML = `
                <tr class="tfoot-bg">
                    <td colspan="6" class="tfoot-label">General Weighted Average (GWA)</td>
                    <td class="tfoot-value"><strong>${gwa}</strong></td>
                    <td></td>
                </tr>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});