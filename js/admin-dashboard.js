/**
 * AdminDashboardController Class
 * Handles OOP Modal Popups, Internal Routing, and LocalStorage Persistence
 */
class AdminDashboardController {
    constructor() {
        this.modals = document.querySelectorAll('.modal-overlay');
        this.modalTriggers = document.querySelectorAll('.modal-trigger');
        this.closeButtons = document.querySelectorAll('.modal-close-btn');
        this.navTriggers = document.querySelectorAll('.nav-trigger');
        
        // NEW: Tracks which teacher's subjects we are currently editing
        this.activeTeacherUsername = null;

        this.initEvents();
        this.loadSavedTeachers();
    }

    initEvents() {
        // 1. Open Modals
        this.modalTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-modal-target');
                
                // NEW: Intercept the Subjects modal to set the active teacher
                if (targetId === 'manageSubjectsModal') {
                    this.prepareManageSubjectsModal(btn);
                }
                
                this.openModal(targetId);
            });
        });

        // 2. Close Modals
        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const activeModal = btn.closest('.modal-overlay');
                if (activeModal) this.closeModal(activeModal);
            });
        });

        // 3. Click outside to close
        window.addEventListener('click', (e) => {
            this.modals.forEach(overlay => {
                if (e.target === overlay) this.closeModal(overlay);
            });
        });

        // 4. Custom App Navigation
        this.navTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const route = btn.getAttribute('data-route');
                const sidebarLink = document.querySelector(`.sidebar-link[data-target='${route}']`);
                if (sidebarLink) sidebarLink.click();
            });
        });

        // Handle Hardcoded Delete Buttons
        const deleteBtns = document.querySelectorAll('.btn-delete');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm("Are you sure you want to delete this record?")) {
                    const row = e.target.closest('tr');
                    if (row) row.remove();
                }
            });
        });

        // Handle "Save Teacher" Form Submission
        const saveTeacherBtn = document.querySelector('#addTeacherModal .btn-submit');
        if (saveTeacherBtn) {
            saveTeacherBtn.addEventListener('click', (e) => {
                e.preventDefault();

                const teacherModal = document.getElementById('addTeacherModal');
                const usernameInput = document.getElementById('teacher-username');
                const fullnameInput = document.getElementById('teacher-fullname');
                const emailInput = document.getElementById('teacher-email');
                const deptInput = document.getElementById('teacher-dept');

                const username = usernameInput.value.trim();
                const fullname = fullnameInput.value.trim();
                const email = emailInput.value.trim();
                const department = deptInput.value.trim();

                if (!username || !fullname || !email || !department) {
                    alert("Please fill out all the teacher details fields.");
                    return;
                }

                const newTeacher = { username, fullname, email, department };

                let facultyList = JSON.parse(localStorage.getItem('facultyMembers')) || [];
                facultyList.push(newTeacher);
                localStorage.setItem('facultyMembers', JSON.stringify(facultyList));

                this.appendTeacherRow(newTeacher);

                usernameInput.value = '';
                fullnameInput.value = '';
                emailInput.value = '';
                deptInput.value = '';

                this.closeModal(teacherModal);
            });
        }

        // Handle "Confirm Assignment" Button
        const confirmAssignmentBtn = document.querySelector('#assignNewSubjectModal .btn-submit');
        if (confirmAssignmentBtn) {
            confirmAssignmentBtn.addEventListener('click', (e) => {
                e.preventDefault();

                const assignModal = document.getElementById('assignNewSubjectModal');
                const selectInputs = assignModal.querySelectorAll('.admin-input');
                const subjectSelect = selectInputs[0];
                const sectionSelect = selectInputs[1];

                const subjectValue = subjectSelect.value;
                const sectionValue = sectionSelect.value;

                if (!subjectValue || !sectionValue) {
                    alert("Please select both a subject and a section.");
                    return;
                }

                const splitSubject = subjectValue.split(' - ');
                const subjectCode = splitSubject[0];
                const subjectTitle = splitSubject[1] || subjectValue;
                const programCode = sectionValue.split('-')[0] || "N/A";
                const yearLevel = (sectionValue.match(/\d/) ? sectionValue.match(/\d/)[0] + "rd Year" : "N/A");

                const newSubjectData = {
                    teacherUsername: this.activeTeacherUsername, // CRITICAL FIX: Tag the subject to the teacher!
                    code: subjectCode,
                    title: subjectTitle,
                    section: sectionValue,
                    program: programCode,
                    year: yearLevel,
                    units: "3"
                };

                let savedSubjects = JSON.parse(localStorage.getItem('teacherSubjects')) || [];
                savedSubjects.push(newSubjectData);
                localStorage.setItem('teacherSubjects', JSON.stringify(savedSubjects));

                // Re-render the subjects table directly from memory
                this.renderSubjectsForAdmin();

                subjectSelect.selectedIndex = 0;
                sectionSelect.selectedIndex = 0;
                this.closeModal(assignModal);
            });
        }
    }

    /**
     * NEW: Sets up the Manage Subjects modal for the specific teacher clicked
     */
    prepareManageSubjectsModal(btn) {
        const row = btn.closest('tr');
        if (!row) return;

        // Extract the username and fullname from the HTML table row
        const username = row.querySelector('td:nth-child(1)').textContent.trim();
        const fullname = row.querySelector('td:nth-child(2)').textContent.trim();

        // Save it to the class so the "Confirm Assignment" button knows who to give the subject to
        this.activeTeacherUsername = username;
        
        // Update the Modal Title dynamically
        const modalTitle = document.querySelector('#manageSubjectsModal .modal-title');
        if (modalTitle) modalTitle.textContent = `Assigned Subjects - ${fullname}`;

        this.renderSubjectsForAdmin();
    }

    /**
     * NEW: Clears the modal table and renders ONLY the active teacher's subjects
     */
    renderSubjectsForAdmin() {
        const tbody = document.querySelector('#manageSubjectsModal .data-table tbody');
        if (!tbody) return;
        
        // Wipe the hardcoded HTML rows out
        tbody.innerHTML = ''; 

        const allSubjects = JSON.parse(localStorage.getItem('teacherSubjects')) || [];
        
        // Filter out everyone else's subjects
        const teacherSubjects = allSubjects.filter(sub => sub.teacherUsername === this.activeTeacherUsername);

        teacherSubjects.forEach(subject => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="subject-code">${subject.code}</span></td>
                <td><strong>${subject.title}</strong></td>
                <td>${subject.section}</td>
                <td class="text-right">
                    <div class="action-btns justify-end">
                        <button class="btn-action btn-delete">Unassign</button>
                    </div>
                </td>
            `;
            
            // Allow unassigning
            const unassignBtn = tr.querySelector('.btn-delete');
            unassignBtn.addEventListener('click', (e) => {
                if(confirm("Are you sure you want to unassign this subject?")) {
                    let stored = JSON.parse(localStorage.getItem('teacherSubjects')) || [];
                    // Remove this exact subject for this exact teacher from the database
                    stored = stored.filter(s => !(s.teacherUsername === this.activeTeacherUsername && s.code === subject.code && s.section === subject.section));
                    localStorage.setItem('teacherSubjects', JSON.stringify(stored));
                    tr.remove();
                }
            });

            tbody.appendChild(tr);
        });

        // Handle Drop Student Functionality
        const dropBtn = tr.querySelector('.btn-delete');
        dropBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showConfirm("Drop Student", `Are you sure you want to drop ${fullname}?`, () => {
                let studentProfiles = JSON.parse(localStorage.getItem('studentProfiles')) || {};
                delete studentProfiles[id];
                localStorage.setItem('studentProfiles', JSON.stringify(studentProfiles));
                tr.remove();
                this.refreshStatCards();
            });
        });

        tbody.appendChild(tr);
    }

    loadSavedTeachers() {
        const facultyList = JSON.parse(localStorage.getItem('facultyMembers')) || [];
        facultyList.forEach(teacher => {
            this.appendTeacherRow(teacher);
        });
    }

    appendTeacherRow(teacher) {
        const teachersTableBody = document.querySelector('#teachers-view .data-table tbody');
        if (!teachersTableBody) return;

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><span class="subject-code">${teacher.username}</span></td>
            <td>${teacher.fullname}</td>
            <td>${teacher.email}</td>
            <td>${teacher.department}</td>
            <td class="text-right">
                <div class="action-btns justify-end">
                    <button class="btn-action btn-access modal-trigger" data-modal-target="manageSubjectsModal" title="Manage Assigned Subjects">
                        &#128218; Subjects
                    </button>
                    <button class="btn-action btn-edit modal-trigger" data-modal-target="editTeacherModal">Edit</button>
                    <button class="btn-action btn-delete">Delete</button>
                </div>
            </td>
        `;

        const deleteBtn = newRow.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete ${teacher.fullname}?`)) {
                newRow.remove();
                let facultyList = JSON.parse(localStorage.getItem('facultyMembers')) || [];
                facultyList = facultyList.filter(f => f.username !== teacher.username);
                localStorage.setItem('facultyMembers', JSON.stringify(facultyList));
            }
        }

        // Populate DOM elements
        document.getElementById('pc-avatar').textContent = initials;
        document.getElementById('pc-name').textContent = val(student.fullname);
        document.getElementById('pc-id').textContent = id;
        document.getElementById('pc-program-sec').innerHTML = `${val(student.program)} &bull; ${val(student.section)}`;
        
        document.getElementById('pc-sex').textContent = val(student.sex);
        document.getElementById('pc-birthday').textContent = val(student.birthday);
        document.getElementById('pc-age').textContent = val(student.age);
        document.getElementById('pc-contact').textContent = val(student.contact);
        document.getElementById('pc-email').textContent = val(student.email);
        document.getElementById('pc-address').textContent = val(student.address);
        
        document.getElementById('pc-father-name').textContent = val(student.fatherName);
        document.getElementById('pc-father-contact').textContent = val(student.fatherContact);
        document.getElementById('pc-mother-name').textContent = val(student.motherName);
        document.getElementById('pc-mother-contact').textContent = val(student.motherContact);

        // Show Overlay
        const overlay = document.getElementById('studentProfileCardOverlay');
        const closeBtn = overlay.querySelector('.profile-card-close');
        
        overlay.classList.add('active');

        // Self-cleaning event listener functions
        const closeCard = () => {
            overlay.classList.remove('active');
            closeBtn.removeEventListener('click', closeCard);
            overlay.removeEventListener('click', clickOutside);
        };

        const clickOutside = (e) => {
            if (e.target === overlay) closeCard();
        };

        // Attach listeners
        closeBtn.addEventListener('click', closeCard);
        overlay.addEventListener('click', clickOutside);
    }

    // ==========================================
    // HELPER METHODS: TEACHERS & SUBJECTS
    // ==========================================

    prepareManageSubjectsModal(btn) {
        const row = btn.closest('tr');
        if (!row) return;
        const username = row.querySelector('td:nth-child(1)').textContent.trim();
        const fullname = row.querySelector('td:nth-child(2)').textContent.trim();
        this.activeTeacherUsername = username;
        const modalTitle = document.querySelector('#manageSubjectsModal .modal-title');
        if (modalTitle) modalTitle.textContent = `Assigned Subjects - ${fullname}`;
        this.renderSubjectsForAdmin();
    }

    renderSubjectsForAdmin() {
        const tbody = document.querySelector('#manageSubjectsModal .data-table tbody');
        if (!tbody) return;
        tbody.innerHTML = ''; 

        const allSubjects = JSON.parse(localStorage.getItem('teacherSubjects')) || [];
        const teacherSubjects = allSubjects.filter(sub => sub.teacherUsername === this.activeTeacherUsername);

        teacherSubjects.forEach(subject => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="subject-code">${subject.code}</span></td>
                <td><strong>${subject.title}</strong></td>
                <td>${subject.section}</td>
                <td class="text-right">
                    <div class="action-btns justify-end">
                        <button class="btn-action btn-delete">Unassign</button>
                    </div>
                </td>
            `;
            
            const unassignBtn = tr.querySelector('.btn-delete');
            unassignBtn.addEventListener('click', (e) => {
                this.showConfirm("Unassign Subject", "Are you sure you want to unassign this subject?", () => {
                    let stored = JSON.parse(localStorage.getItem('teacherSubjects')) || [];
                    stored = stored.filter(s => !(s.teacherUsername === this.activeTeacherUsername && s.code === subject.code && s.section === subject.section));
                    localStorage.setItem('teacherSubjects', JSON.stringify(stored));
                    tr.remove();
                });
            });
            tbody.appendChild(tr);
        });

        const modalTriggers = newRow.querySelectorAll('.modal-trigger');
        modalTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-modal-target');
                
                // NEW: Intercept for dynamic rows too
                if (targetId === 'manageSubjectsModal') {
                    this.prepareManageSubjectsModal(btn);
                }

                this.openModal(targetId);
            });
        });

        teachersTableBody.appendChild(newRow);
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('open');
    }

    closeModal(modalElement) {
        modalElement.classList.remove('open');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboardController();
});