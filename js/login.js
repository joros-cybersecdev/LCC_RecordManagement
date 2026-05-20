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
class LoginForm {
    constructor() {
        this.roleButtons = document.querySelectorAll('.role-btn');
        this.roleInput = document.getElementById('roleInput');
        this.usernameLabel = document.getElementById('usernameLabel');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.togglePassBtn = document.querySelector('.toggle-pass');
        
        // Form elements for mock authentication
        this.loginForm = document.getElementById('loginForm');
        this.loginAlert = document.getElementById('loginAlert');

        // Only initialize if we are actually on the login page
        if (this.roleButtons.length > 0) {
            this.initEvents();
        }
    }

    initEvents() {
        // Bind role buttons
        this.roleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.setRole(e.currentTarget));
        });

        // Bind password visibility toggle
        if (this.togglePassBtn && this.passwordInput) {
            this.togglePassBtn.addEventListener('click', () => this.togglePassword());
        }

        // Bind form submission for mock authentication
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    setRole(clickedBtn) {
        // Update active class state
        this.roleButtons.forEach(b => b.classList.remove('active'));
        clickedBtn.classList.add('active');

        // Get role from the HTML data attribute
        const role = clickedBtn.dataset.role;
        this.roleInput.value = role;

        // Update UI dynamically
        if (role === 'student') {
            this.usernameLabel.textContent = 'Student ID';
            this.usernameInput.placeholder = 'Enter your student ID';
        } else if (role === 'teacher') {
            this.usernameLabel.textContent = 'Username';
            this.usernameInput.placeholder = 'Enter your teacher username';
        } else if (role === 'admin') {
            this.usernameLabel.textContent = 'Username';
            this.usernameInput.placeholder = 'Enter your admin username';
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

    // --- MOCK AUTHENTICATION LOGIC ---
    handleLogin(e) {
        e.preventDefault(); 

        const role = this.roleInput.value;
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        // Fetch dynamic teachers added from the admin dashboard
        const dynamicTeachers = JSON.parse(localStorage.getItem('facultyMembers')) || [];
        
        const validAdmins = ['admin'];

        // Shared Student DB 
        const studentsDB = {
            '2026-001': { id: '2026-001', name: 'John Doe', section: 'BSIT-3A', program: 'BSIT', year: '3rd Year', status: 'paid' },
            '2026-002': { id: '2026-002', name: 'Maria Clara', section: 'BSIT-3A', program: 'BSIT', year: '3rd Year', status: 'paid' } // Set to paid so grades work
        };

        if (this.loginAlert) {
            this.loginAlert.classList.add('hidden-alert');
        }

        if (password !== 'admin123') {
            this.showError('Invalid password. Please try again.');
            return;
        }

        // --- Teacher Verification ---
        if (role === 'teacher') {
            let matchedTeacher = null;

            if (username === 't.janedoe') {
                matchedTeacher = { username: 't.janedoe', fullname: 'Jane Doe', department: 'College of Computer Studies' };
            } else {
                matchedTeacher = dynamicTeachers.find(t => t.username === username);
            }

            if (matchedTeacher) {
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
        // --- Admin Verification ---
        else if (role === 'admin') {
            if (validAdmins.includes(username)) {
                window.location.href = 'admin-dashboard.html';
            } else {
                this.showError('Admin account not found.');
            }
        } 
        // --- Student Verification ---
        else if (role === 'student') {
            const matchedStudent = studentsDB[username];
            
            if (matchedStudent) {
                // Save student session data
                localStorage.setItem('currentUser', JSON.stringify({
                    role: 'student',
                    ...matchedStudent
                }));
                window.location.href = 'student-dashboard.html';
            } else {
                this.showError('Student account not found.');
            }
        }
    }

    showError(message) {
        if (this.loginAlert) {
            this.loginAlert.textContent = message;
            this.loginAlert.classList.remove('hidden-alert');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Navigation('.mobile-menu-btn', 'mobileMenu');
    new LoginForm();
});