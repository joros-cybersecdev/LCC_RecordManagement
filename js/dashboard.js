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
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return window.location.href = 'login.html';

        // 2. Update Profile Name in UI
        const { data: profile } = await window.supabase
            .from('profiles')
            .select('full_name, school_id')
            .eq('id', user.id)
            .single();
            
        if(profile) {
            document.querySelectorAll('.info-name, .header-user-name, .sidebar-user-name').forEach(el => el.textContent = profile.full_name);
        }

        // 3. Fetch Grades
        const { data: records, error } = await window.supabase
            .from('records')
            .select(`
                grade, status,
                sections ( semester, subjects (code, title, units) )
            `)
            .eq('student_id', user.id);

        if (error) return console.error(error);

        this.renderGrades(records);
    }

    renderGrades(records) {
        const tbody = document.querySelector('#grades-view .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        let totalUnits = 0;
        let gradeSum = 0;
        let count = 0;

        records.forEach(record => {
            const subject = record.sections.subjects;
            const isUnlocked = record.status === 'Unlocked';
            const displayGrade = isUnlocked && record.grade ? record.grade : '--';
            
            if (isUnlocked && record.grade) {
                totalUnits += subject.units;
                gradeSum += parseFloat(record.grade);
                count++;
            }

            tbody.innerHTML += `
                <tr>
                    <td><span class="subject-code">${subject.code}</span></td>
                    <td>${subject.title}</td>
                    <td><span class="grade-pill ${isUnlocked ? 'grade-high' : 'grade-locked'}">${displayGrade}</span></td>
                    <td><span class="access-badge ${isUnlocked ? 'unlocked' : 'locked'}">${isUnlocked ? 'Unlocked' : 'Locked by Teacher'}</span></td>
                </tr>
            `;
        });

        // Update GWA Card
        const gwa = count > 0 ? (gradeSum / count).toFixed(2) : 'N/A';
        const gwaCard = document.querySelector('#student-dashboard-view .stat-card.blue .stat-card-value');
        if(gwaCard) gwaCard.textContent = gwa;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});