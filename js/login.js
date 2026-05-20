class LoginForm {
    constructor() {
        this.roleButtons = document.querySelectorAll('.role-btn');
        this.roleInput = document.getElementById('roleInput');
        this.usernameLabel = document.getElementById('usernameLabel');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.togglePassBtn = document.querySelector('.toggle-pass');
        
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

    async handleLogin(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;
        const role = this.roleInput.value;

        // Convert username to a mock email for Supabase Auth (e.g. 26-0001@lcc.edu)
        const email = username.includes('@') ? username : `${username}@lcc.edu`;

        try {
            // 1. Authenticate with Supabase
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // 2. Verify Role in Profiles Table
            const { data: profile, error: profileError } = await window.supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError || profile.role !== role) {
                await window.supabase.auth.signOut();
                throw new Error("Unauthorized: Invalid role for this account.");
            }

            // 3. Redirect to correct dashboard
            if (role === 'admin') window.location.href = 'admin-dashboard.html';
            else if (role === 'faculty') window.location.href = 'teacher-dashboard.html';
            else window.location.href = 'student-dashboard.html';

        } catch (err) {
            this.showError(err.message || 'Invalid credentials. Please try again.');
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
    new LoginForm();
});