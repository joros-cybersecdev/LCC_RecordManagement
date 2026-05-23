<<<<<<< HEAD
=======
/**
 * Navigation Class
 * Handles mobile menu toggling for the main portal.
 */
class Navigation {
    constructor(buttonSelector, menuId) {
        this.menuBtn = document.querySelector(buttonSelector);
        this.mobileMenu = document.getElementById(menuId);

        if (this.menuBtn && this.mobileMenu) {
            this.initEvents();
        }
    }

    initEvents() {
        this.menuBtn.addEventListener('click', () => this.toggleMenu());
    }

    toggleMenu() {
        this.mobileMenu.classList.toggle('open');
    }
}

/**
 * LoginForm Class
 * Handles dynamic role selection, password visibility, and mock authentication.
 */
>>>>>>> 64f0e7796444bfe0753bc248abfcd40b316a9bce
class LoginForm {
    constructor() {
        this.roleButtons = document.querySelectorAll('.role-btn');
        this.roleInput = document.getElementById('roleInput');
        this.usernameLabel = document.getElementById('usernameLabel');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.togglePassBtn = document.querySelector('.toggle-pass');
        
<<<<<<< HEAD
=======
        // Form elements for mock authentication
>>>>>>> 64f0e7796444bfe0753bc248abfcd40b316a9bce
        this.loginForm = document.getElementById('loginForm');
        this.loginAlert = document.getElementById('loginAlert');

        if (this.roleButtons.length > 0) {
            this.initEvents();
        }
    }

    initEvents() {
        this.roleButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setRole(btn));
        });

        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.togglePassBtn) {
            this.togglePassBtn.addEventListener('click', () => this.togglePassword());
        }

        // Bind form submission for mock authentication
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    setRole(clickedBtn) {
        this.roleButtons.forEach(b => b.classList.remove('active'));
        clickedBtn.classList.add('active');
        const role = clickedBtn.dataset.role;
        this.roleInput.value = role;

        if (role === 'student') {
            this.usernameLabel.textContent = 'Student ID';
            this.usernameInput.placeholder = 'e.g. 26-0001';
        } else {
            this.usernameLabel.textContent = 'Username';
            this.usernameInput.placeholder = `Enter your ${role} username`;
        }
    }

    togglePassword() {
        if (this.passwordInput.type === 'password') {
            this.passwordInput.type = 'text';
            this.togglePassBtn.textContent = 'Hide';
        } else {
            this.passwordInput.type = 'password';
            this.togglePassBtn.textContent = 'Show';
        }
    }

<<<<<<< HEAD
    async handleLogin(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;
        const role = this.roleInput.value;

        try {
            // 1. Direct Database Query (Bypass Auth API entirely)
            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('school_id', username)
                .eq('role', role)
                .single();

            if (error || !profile) {
                throw new Error("Account not found. Please check your ID and Role.");
            }

            // 2. Simple Password Verification (Prototype Logic)
            // Admin password check
            if (role === 'admin' && password !== 'admin123') {
                throw new Error("Invalid admin password.");
            }
            // Student/Teacher password check (Default password = their ID)
            if (role !== 'admin' && password !== username) {
                throw new Error("Invalid password.");
            }

            // 3. Create a Local Browser Session
            localStorage.setItem('lcc_user', JSON.stringify({
                id: profile.id,
                role: profile.role
            }));

            // 4. Redirect to the correct dashboard
            if (role === 'admin') window.location.href = 'admin-dashboard.html';
            else if (role === 'faculty') window.location.href = 'teacher-dashboard.html';
            else window.location.href = 'student-dashboard.html';

        } catch (err) {
            this.showError(err.message || 'Invalid credentials. Please try again.');
=======
    // --- MOCK AUTHENTICATION LOGIC ---
    handleLogin(e) {
        e.preventDefault(); 

        const role = this.roleInput.value;
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        // Fetch dynamic teachers added from the admin dashboard
        const dynamicTeachers = JSON.parse(localStorage.getItem('facultyMembers')) || [];
        
        const validAdmins = ['admin'];
        const validStudents = ['2026-001', '2026-002'];

        if (this.loginAlert) {
            this.loginAlert.classList.add('hidden-alert');
        }

        if (password !== 'admin123') {
            this.showError('Invalid password. Please try again.');
            return;
        }

        // --- NEW: Dynamic Teacher Verification & Session Tracking ---
        if (role === 'teacher') {
            let matchedTeacher = null;

            // Check if it's the default teacher OR a newly added dynamic teacher
            if (username === 't.janedoe') {
                matchedTeacher = { username: 't.janedoe', fullname: 'Jane Doe', department: 'College of Computer Studies' };
            } else {
                matchedTeacher = dynamicTeachers.find(t => t.username === username);
            }

            if (matchedTeacher) {
                // Save the session data so the dashboard knows who logged in!
                localStorage.setItem('currentUser', JSON.stringify({
                    role: 'teacher',
                    username: matchedTeacher.username,
                    fullname: matchedTeacher.fullname,
                    department: matchedTeacher.department
                }));
                window.location.href = 'teacher-dashboard.html';
            } else {
                this.showError('Teacher account not found.');
            }
        } 
        // ------------------------------------------------------------
        else if (role === 'admin') {
            if (validAdmins.includes(username)) {
                window.location.href = 'admin-dashboard.html';
            } else {
                this.showError('Admin account not found.');
            }
        } 
        else if (role === 'student') {
            if (validStudents.includes(username)) {
                window.location.href = 'student-dashboard.html';
            } else {
                this.showError('Student account not found.');
            }
>>>>>>> 64f0e7796444bfe0753bc248abfcd40b316a9bce
        }
    }

    showError(message) {
        if (this.loginAlert) {
            this.loginAlert.textContent = message;
<<<<<<< HEAD
=======
            // Make the block viewable by stripping the hiding class away
>>>>>>> 64f0e7796444bfe0753bc248abfcd40b316a9bce
            this.loginAlert.classList.remove('hidden-alert');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginForm();
});