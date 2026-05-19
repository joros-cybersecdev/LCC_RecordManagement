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
 * Handles dynamic role selection and password visibility on the login page.
 */
class LoginForm {
    constructor() {
        this.roleButtons = document.querySelectorAll('.role-btn');
        this.roleInput = document.getElementById('roleInput');
        this.usernameLabel = document.getElementById('usernameLabel');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.togglePassBtn = document.querySelector('.toggle-pass');

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
}

/**
 * Application Bootstrap
 * Initializes all modules when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    new Navigation('.mobile-menu-btn', 'mobileMenu');
    new LoginForm();
});