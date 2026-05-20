/**
 * PortalApp Class
 * Handles sidebar toggling, SPA view routing, and dynamic data generation (GWA math/rendering).
 */
class PortalApp {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleBtns = document.querySelectorAll('.sidebar-toggle');
        this.navLinks = document.querySelectorAll('.sidebar-nav .sidebar-link:not(.logout-link)');
        this.views = document.querySelectorAll('.view-section');
        this.pageTitle = document.getElementById('page-title');
        this.pageSubtitle = document.getElementById('page-subtitle');

        // Internal Mock Database for Grades (Reduced to 6 subjects)
        this.defaultGradesDB = {
            '2026-001': [ // John Doe (Paid)
                { code: 'IT301', desc: 'Web Development II', units: 3, prelim: 1.50, midterm: 1.25, final: 1.25, locked: false },
                { code: 'IT302', desc: 'Database Management Systems', units: 3, prelim: 1.75, midterm: 1.50, final: 1.50, locked: false },
                { code: 'IT303', desc: 'Systems Integration', units: 3, prelim: null, midterm: null, final: null, locked: true }, // Locked explicitly by teacher
                { code: 'IT304', desc: 'Mobile App Development', units: 3, prelim: 2.00, midterm: 1.75, final: 1.75, locked: false },
                { code: 'IT205', desc: 'Systems Analysis and Design', units: 3, prelim: 1.25, midterm: 1.25, final: 1.00, locked: false },
                { code: 'IT206', desc: 'Networking I', units: 3, prelim: 2.25, midterm: 2.00, final: 1.75, locked: false }
            ],
            '2026-002': [ // Maria Clara (Unpaid)
                { code: 'IT301', desc: 'Web Development II', units: 3, prelim: 1.25, midterm: 1.25, final: 1.00, locked: false },
                { code: 'IT302', desc: 'Database Management Systems', units: 3, prelim: 1.50, midterm: 1.50, final: 1.50, locked: false },
                { code: 'IT303', desc: 'Systems Integration', units: 3, prelim: 1.75, midterm: 1.75, final: 1.75, locked: false }, 
                { code: 'IT304', desc: 'Mobile App Development', units: 3, prelim: 1.00, midterm: 1.00, final: 1.00, locked: false },
                { code: 'IT205', desc: 'Systems Analysis and Design', units: 3, prelim: 1.25, midterm: 1.25, final: 1.25, locked: false },
                { code: 'IT206', desc: 'Networking I', units: 3, prelim: 1.50, midterm: 1.50, final: 1.25, locked: false }
            ]
        };

        // FORCE UPDATE: Overwrites the old 8-subject cache with the new 6-subject list
        localStorage.setItem('gradesDB', JSON.stringify(this.defaultGradesDB));

        this.initEvents();
        this.loadUserData();
    }

    initEvents() {
        // Sidebar toggle
        this.toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleSidebar());
        });

        // Navigation routing
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Stop the page from reloading
                this.switchView(e.currentTarget);
            });
        });

        // Add Print Functionality
        const printBtn = document.getElementById('print-grades-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    loadUserData() {
        const userJSON = localStorage.getItem('currentUser');
        if (!userJSON) return; 
        
        const user = JSON.parse(userJSON);

        if (user.role === 'student') {
            const initial = user.name.charAt(0).toUpperCase();
            
            // 1. Update Names & Dashboard Subtitles
            document.querySelectorAll('.sidebar-user-name, .header-user-name, .info-name').forEach(el => {
                el.textContent = user.name;
            });
            
            const dashboardLink = document.querySelector('.sidebar-link[data-target="student-dashboard-view"]');
            if(dashboardLink) {
                const firstName = user.name.split(' ')[0];
                dashboardLink.setAttribute('data-subtitle', `Welcome back, ${firstName}!`);
                if(this.pageSubtitle && this.pageTitle.textContent === 'Dashboard') {
                    this.pageSubtitle.textContent = `Welcome back, ${firstName}!`;
                }
            }

            // 2. Update Initials
            document.querySelectorAll('.sidebar-avatar, .header-avatar, .info-avatar').forEach(el => {
                el.textContent = initial;
            });

            // 3. Update Banners & Print Titles
            const mainBannerMeta = document.querySelector('#student-dashboard-view .info-meta');
            if (mainBannerMeta) {
                mainBannerMeta.innerHTML = `ID: ${user.id} &bull; Section: ${user.section} &bull; SY: 2026-2027`;
            }

            const subjectsBannerMeta = document.querySelector('#subjects-view .info-meta');
            if (subjectsBannerMeta) {
                subjectsBannerMeta.innerHTML = `${user.program} &bull; ${user.year} &bull; Section ${user.section.split('-')[1] || 'A'}`;
            }

            const printSubtitle = document.getElementById('print-subtitle-meta');
            if (printSubtitle) {
                printSubtitle.innerHTML = `${user.name} &bull; ${user.id} &bull; ${user.program} - 2nd Semester (2026-2027)`;
            }

            // 4. Handle Payment Badge
            const paymentBadge = document.querySelector('.payment-badge');
            if (paymentBadge) {
                if (user.status === 'unpaid') {
                    paymentBadge.className = 'payment-badge unpaid';
                    paymentBadge.textContent = 'Tuition Unpaid';
                } else {
                    paymentBadge.className = 'payment-badge paid';
                    paymentBadge.textContent = 'Tuition Paid';
                }
            }

            // 5. Calculate and Render Grades Table Dynamically
            this.renderGrades(user.id, user.status);
        }
    }

    renderGrades(userId, status) {
        const tbody = document.getElementById('grades-table-body');
        const tfoot = document.getElementById('grades-table-foot');
        const mainGwaDisplay = document.getElementById('dashboard-gwa');
        const unitsDisplay = document.getElementById('grades-total-units');
        
        if (!tbody || !tfoot) return;

        // Fetch grades directly from localStorage so it syncs with Teacher inputs
        const db = JSON.parse(localStorage.getItem('gradesDB')) || this.defaultGradesDB;
        const gradesList = db[userId] || db['2026-001'];
        
        let activeUnits = 0;
        let weightedSum = 0;
        let grandTotalUnits = 0;

        tbody.innerHTML = '';

        gradesList.forEach(subject => {
            // Unpaid status forcibly locks everything
            const isUnpaid = (status === 'unpaid');
            const isLocked = isUnpaid || subject.locked;

            let overall = null;

            // Only compute overall if teacher inputted all periods
            if (subject.prelim && subject.midterm && subject.final) {
                overall = ((subject.prelim + subject.midterm + subject.final) / 3);
                
                // Add to true GWA calculation only if it is completely accessible
                if (!isLocked) {
                    activeUnits += subject.units;
                    weightedSum += (overall * subject.units);
                }
            }

            grandTotalUnits += subject.units;

            // Helper to generate the little UI pills for grades
            const getGradePill = (gradeVal) => {
                if (isLocked || !gradeVal) return `<span class="grade-pill grade-locked">--</span>`;
                const val = parseFloat(gradeVal).toFixed(2);
                let colorClass = 'grade-high';
                if (val > 1.50) colorClass = 'grade-mid';
                if (val > 2.50) colorClass = 'grade-low';
                return `<span class="grade-pill ${colorClass}">${val}</span>`;
            };

            // Status Badge generator
            let statusBadge = `<span class="access-badge unlocked">Passed</span>`;
            if (isUnpaid) {
                statusBadge = `<span class="access-badge locked">Locked (Unpaid)</span>`;
            } else if (subject.locked) {
                statusBadge = `<span class="access-badge locked">Locked by Teacher</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="subject-code">${subject.code}</span></td>
                <td>${subject.desc}</td>
                <td>${subject.units}</td>
                <td>${getGradePill(subject.prelim)}</td>
                <td>${getGradePill(subject.midterm)}</td>
                <td>${getGradePill(subject.final)}</td>
                <td>${getGradePill(overall)}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });

        // Compute final GWA math
        let finalGWA = '--';
        if (activeUnits > 0) {
            finalGWA = (weightedSum / activeUnits).toFixed(2);
        }

        // Inject the math into the table footer
        tfoot.innerHTML = `
            <tr class="tfoot-bg">
                <td colspan="2" class="tfoot-label" style="text-align: right;">Total Units / Computed GWA:</td>
                <td class="tfoot-label">${grandTotalUnits}</td>
                <td colspan="3"></td>
                <td class="tfoot-label" colspan="2">${finalGWA}</td>
            </tr>
        `;

        // Update the big dashboard stat cards
        if (mainGwaDisplay) mainGwaDisplay.textContent = finalGWA;
        if (unitsDisplay) unitsDisplay.textContent = grandTotalUnits;
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('sidebar-open');
        }
    }

    switchView(clickedLink) {
        // 1. Change Active state on sidebar
        this.navLinks.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');

        // 2. Hide all views, then show the target view
        const targetId = clickedLink.getAttribute('data-target');
        this.views.forEach(view => view.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');

        // 3. Update Header Title & Subtitle dynamically
        if (this.pageTitle && this.pageSubtitle) {
            this.pageTitle.textContent = clickedLink.getAttribute('data-title');
            this.pageSubtitle.textContent = clickedLink.getAttribute('data-subtitle');
        }

        // 4. Auto-close sidebar on mobile after clicking a link
        if (window.innerWidth <= 820 && this.sidebar) {
            this.sidebar.classList.remove('sidebar-open');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PortalApp();
});