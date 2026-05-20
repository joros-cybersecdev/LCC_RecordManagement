/**
 * AdminDashboardController Class
 * Handles OOP Modal Popups, Internal Routing, LocalStorage Persistence, and Dynamic Tables
 */
class AdminDashboardController {
    constructor() {
        this.modals = document.querySelectorAll('.modal-overlay');
        this.modalTriggers = document.querySelectorAll('.modal-trigger');
        this.closeButtons = document.querySelectorAll('.modal-close-btn');
        this.navTriggers = document.querySelectorAll('.nav-trigger');
        
        // Tracks active subjects/sections for modals
        this.activeTeacherUsername = null;
        this.activeStudentRow = null;

        this.initEvents();
        this.loadSavedTeachers();
        this.loadSavedStudents();
        this.loadSavedSections(); 
        this.updateStats;

        this.refreshStatCards();
        this.loadRecentStudents();
        
        // Removed missing init***() methods to prevent constructor crashes
    }

    initEvents() {
        // 1. Open Modals
        this.modalTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-modal-target');
                
                if (targetId === 'manageSubjectsModal') {
                    this.prepareManageSubjectsModal(btn);
                }
                if (targetId === 'assignStudentSectionModal') {
                    this.prepareAssignSectionModal(btn);
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

        // ==========================================
        // ADD TEACHER LOGIC
        // ==========================================
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
                this.refreshStatCards();
            });
        }

        // ==========================================
        // UPDATE TEACHER LOGIC 
        // ==========================================
        const btnUpdateTeacher = document.getElementById('btn-update-teacher');
        if (btnUpdateTeacher) {
            btnUpdateTeacher.addEventListener('click', (e) => {
                e.preventDefault();
                const originalUsername = document.getElementById('edit-teacher-original-username').value;
                const username = document.getElementById('edit-teacher-username').value.trim();
                const fullname = document.getElementById('edit-teacher-fullname').value.trim();
                const email = document.getElementById('edit-teacher-email').value.trim();
                const department = document.getElementById('edit-teacher-dept').value.trim();

                let facultyList = JSON.parse(localStorage.getItem('facultyMembers')) || [];
                const index = facultyList.findIndex(f => f.username === originalUsername);
                if (index !== -1) {
                    facultyList[index] = { username, fullname, email, department };
                    localStorage.setItem('facultyMembers', JSON.stringify(facultyList));
                    
                    // Wipe and re-render table
                    const tbody = document.querySelector('#teachers-view .data-table tbody');
                    if(tbody) tbody.innerHTML = '';
                    this.loadSavedTeachers();
                    this.closeModal(document.getElementById('editTeacherModal'));
                }
            });
        }

        // ==========================================
        // ADD (ENROLL) & EDIT STUDENT LOGIC
        // ==========================================
        const saveStudentBtn = document.getElementById('btn-save-student');
        if (saveStudentBtn) {
            saveStudentBtn.addEventListener('click', (e) => {
                e.preventDefault();

                const idVal = document.getElementById('add-student-id').value.trim();
                const nameVal = document.getElementById('add-student-fullname').value.trim();

                if (!idVal || !nameVal) {
                    alert("Please enter the student's ID and Full Name.");
                    return;
                }

                let studentProfiles = JSON.parse(localStorage.getItem('studentProfiles')) || {};
                
                studentProfiles[idVal] = { 
                    fullname: nameVal, 
                    sex: document.getElementById('add-student-sex').value,
                    birthday: document.getElementById('add-student-bday').value,
                    age: document.getElementById('add-student-age').value,
                    address: document.getElementById('add-student-address').value,
                    contact: document.getElementById('add-student-contact').value,
                    email: document.getElementById('add-student-email').value.trim(), 
                    program: document.getElementById('add-student-program').value, 
                    section: document.getElementById('add-student-section').value,
                    fatherName: document.getElementById('add-student-father').value,
                    fatherContact: document.getElementById('add-student-father-contact').value,
                    motherName: document.getElementById('add-student-mother').value,
                    motherContact: document.getElementById('add-student-mother-contact').value
                };
                
                localStorage.setItem('studentProfiles', JSON.stringify(studentProfiles));
                
                // Clear the table and reload to reflect changes accurately
                const tbody = document.querySelector('#students-view .data-table tbody');
                if(tbody) tbody.innerHTML = '';
                this.loadSavedStudents();

                // Clear specific required fields for the next use
                document.getElementById('add-student-id').value = '';
                document.getElementById('add-student-fullname').value = '';
                
                this.closeModal(document.getElementById('addStudentModal'));
                this.refreshStatCards();
                this.showToast("Student successfully enrolled!");
            });
        }

        // ==========================================
        // ASSIGN SECTION LOGIC (STUDENTS)
        // ==========================================
        const assignSectionBtn = document.querySelector('#assignStudentSectionModal .btn-submit');
        if (assignSectionBtn) {
            assignSectionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const assignModal = document.getElementById('assignStudentSectionModal');
                const programVal = document.getElementById('assign-student-program').value;
                const sectionVal = document.getElementById('assign-student-section').value;

                if (!programVal || !sectionVal) {
                    alert("Please select both a program and a section.");
                    return;
                }

                if (this.activeStudentRow) {
                    this.activeStudentRow.querySelector('td:nth-child(3)').textContent = sectionVal;
                    
                    const studentId = this.activeStudentRow.querySelector('td:nth-child(1)').textContent.trim();
                    let studentProfiles = JSON.parse(localStorage.getItem('studentProfiles')) || {};
                    
                    if (!studentProfiles[studentId]) {
                        studentProfiles[studentId] = { fullname: "Unknown" }; 
                    }
                    studentProfiles[studentId].program = programVal;
                    studentProfiles[studentId].section = sectionVal;
                    
                    localStorage.setItem('studentProfiles', JSON.stringify(studentProfiles));
                }

                document.getElementById('assign-student-program').selectedIndex = 0;
                document.getElementById('assign-student-section').selectedIndex = 0;
                this.closeModal(assignModal);
            });
        }

        // ==========================================
        // ASSIGN SUBJECT LOGIC (TEACHERS)
        // ==========================================
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
                const yearMatch = sectionValue.match(/\d/);
                const yearLevel = yearMatch ? yearMatch[0] + "rd Year" : "N/A";

                const newSubjectData = {
                    teacherUsername: this.activeTeacherUsername,
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

                this.renderSubjectsForAdmin();

                subjectSelect.selectedIndex = 0;
                sectionSelect.selectedIndex = 0;
                this.closeModal(assignModal);
            });
        }

        // UPDATE STUDENT LOGIC
        const updateStudentBtn = document.getElementById('btn-update-student');
        if (updateStudentBtn) {
            updateStudentBtn.addEventListener('click', (e) => {
                e.preventDefault();

                const idVal = document.getElementById('edit-student-id').value;
                const nameVal = document.getElementById('edit-student-fullname').value.trim();

                if (!nameVal) {
                    alert("Full Name is required.");
                    return;
                }

                let studentProfiles = JSON.parse(localStorage.getItem('studentProfiles')) || {};
                
                if(studentProfiles[idVal]) {
                    studentProfiles[idVal] = {
                        ...studentProfiles[idVal], // Keep any other hidden data intact
                        fullname: nameVal, 
                        sex: document.getElementById('edit-student-sex').value,
                        birthday: document.getElementById('edit-student-bday').value,
                        age: document.getElementById('edit-student-age').value,
                        address: document.getElementById('edit-student-address').value,
                        contact: document.getElementById('edit-student-contact').value,
                        email: document.getElementById('edit-student-email').value.trim(), 
                        program: document.getElementById('edit-student-program').value, 
                        section: document.getElementById('edit-student-section').value,
                        fatherName: document.getElementById('edit-student-father').value,
                        fatherContact: document.getElementById('edit-student-father-contact').value,
                        motherName: document.getElementById('edit-student-mother').value,
                        motherContact: document.getElementById('edit-student-mother-contact').value
                    };
                    
                    localStorage.setItem('studentProfiles', JSON.stringify(studentProfiles));
                    
                    // Reload table
                    const tbody = document.querySelector('#students-view .data-table tbody');
                    if(tbody) tbody.innerHTML = '';
                    this.loadSavedStudents();
                    
                    this.closeModal(document.getElementById('editStudentModal'));
                    this.showToast("Student records updated!");
                }
            });
        }

        // ==========================================
        // MANAGE SECTIONS LOGIC (ADD / EDIT)
        // ==========================================
        
        // Add Section
        const saveSectionBtn = document.querySelector('#addSectionModal .btn-submit');
        if (saveSectionBtn) {
            saveSectionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = document.getElementById('addSectionModal');
                const name = document.getElementById('add-sec-name').value.trim();
                const program = document.getElementById('add-sec-program').value;
                const year = document.getElementById('add-sec-year').value;
                const term = document.getElementById('add-sec-sem').value;

                if (!name) return alert("Please enter a section name.");

                let sections = JSON.parse(localStorage.getItem('schoolSections')) || [];
                if (sections.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                    return alert("A section with this name already exists.");
                }

                sections.push({ name, program, year, term });
                localStorage.setItem('schoolSections', JSON.stringify(sections));

                document.getElementById('add-sec-name').value = '';
                this.renderSectionsTable();
                this.updateSectionDropdowns();
                this.closeModal(modal);
                this.refreshStatCards();
            });
        }

        // Edit Section
        const updateSectionBtn = document.querySelector('#editSectionModal .btn-submit');
        if (updateSectionBtn) {
            updateSectionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = document.getElementById('editSectionModal');
                const originalName = document.getElementById('edit-sec-original-name').value;
                const newName = document.getElementById('edit-sec-name').value.trim();
                const program = document.getElementById('edit-sec-program').value;
                const year = document.getElementById('edit-sec-year').value;
                const term = document.getElementById('edit-sec-sem').value;

                if (!newName) return alert("Section name cannot be blank.");

                let sections = JSON.parse(localStorage.getItem('schoolSections')) || [];
                
                // Prevent duplicate names during rename
                if (newName !== originalName && sections.some(s => s.name.toLowerCase() === newName.toLowerCase())) {
                    return alert("Another section with this name already exists.");
                }

                const index = sections.findIndex(s => s.name === originalName);
                if (index !== -1) {
                    sections[index] = { name: newName, program, year, term };
                    localStorage.setItem('schoolSections', JSON.stringify(sections));
                    this.renderSectionsTable();
                    this.updateSectionDropdowns();
                }
                
                this.closeModal(modal);
            });
        }
        
        // Initialize Table Filters
        this.filterTable('#students-view .search-input', '#students-view .data-table tbody');
        this.filterTable('#teachers-view .search-input', '#teachers-view .data-table tbody');
        this.filterTable('#sections-view .search-input', '#sections-view .data-table tbody');
    }

    // ==========================================
    // SECTIONS & DROPDOWNS METHODS
    // ==========================================

    loadSavedSections() {
        let sections = JSON.parse(localStorage.getItem('schoolSections'));
        // Seed default dummy data if completely empty
        if (!sections || sections.length === 0) {
            sections = [
                { name: "BSIT-3A", program: "BSIT", year: "3rd Year", term: "Prelim" },
                { name: "BSCS-1A", program: "BSCS", year: "1st Year", term: "Midterms" }
            ];
            localStorage.setItem('schoolSections', JSON.stringify(sections));
        }
        
        this.renderSectionsTable();
        this.updateSectionDropdowns();
    }

    renderSectionsTable() {
        const tbody = document.querySelector('#sections-view .data-table tbody');
        if (!tbody) return;
        tbody.innerHTML = ''; 

        const sections = JSON.parse(localStorage.getItem('schoolSections')) || [];

        sections.forEach(sec => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="subject-code">${sec.name}</span></td>
                <td>${sec.program}</td>
                <td>${sec.year}</td>
                <td>${sec.term}</td>
                <td class="text-right">
                    <div class="action-btns justify-end">
                        <button class="btn-edit btn-action">Edit</button>
                        <button class="btn-action btn-delete">Delete</button>
                    </div>
                </td>
            `;

            // Edit binding
            const editBtn = tr.querySelector('.btn-edit');
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('edit-sec-original-name').value = sec.name;
                document.getElementById('edit-sec-name').value = sec.name;
                document.getElementById('edit-sec-program').value = sec.program;
                document.getElementById('edit-sec-year').value = sec.year;
                document.getElementById('edit-sec-sem').value = sec.term;
                this.openModal('editSectionModal');
            });

            // Delete binding
            const deleteBtn = tr.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showConfirm("Delete Section", `Are you sure you want to delete section ${sec.name}?`, () => {
                    let saved = JSON.parse(localStorage.getItem('schoolSections')) || [];
                    saved = saved.filter(s => s.name !== sec.name);
                    localStorage.setItem('schoolSections', JSON.stringify(saved));
                    this.renderSectionsTable();
                    this.updateSectionDropdowns();
                    this.refreshStatCards();
                });
            });

            tbody.appendChild(tr);
        });
    }

    // FIXED: Added missing updateSectionDropdowns method
    updateSectionDropdowns() {
        const sections = JSON.parse(localStorage.getItem('schoolSections')) || [];
        const options = sections.map(s => ({ value: s.name, label: s.name }));
        
        // Push actual sections, then push the 'Pending' option manually if needed
        options.unshift({ value: 'Pending', label: 'Pending Assignment' });
        
        this.populateDropdown('assign-student-section', options, "Choose a section...");
        this.populateDropdown('assign-subject-section', options, "Choose a section...");
        this.populateDropdown('add-student-section', options, "Choose a section...");
        this.populateDropdown('edit-student-section', options, "Choose a section...");
    }

    populateDropdown(selectElementId, optionsArray, placeholder = "Select an option...") {
        const select = document.getElementById(selectElementId);
        if (!select) return;
        const currentVal = select.value;
        
        // FIXED: Removed recursive bug that caused infinite loops
        select.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        optionsArray.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.label;
            select.appendChild(optionEl);
        });
        
        if (currentVal && optionsArray.some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    }

    // ==========================================
    // HELPER METHODS: STUDENTS
    // ==========================================
    
    prepareAssignSectionModal(btn) {
        const row = btn.closest('tr');
        if (!row) return;
        const fullname = row.querySelector('td:nth-child(2)').textContent.trim();
        this.activeStudentRow = row;
        const modalTitle = document.querySelector('#assignStudentSectionModal .modal-title');
        if (modalTitle) modalTitle.textContent = `Assign Section - ${fullname}`;
    }

    loadSavedStudents() {
        let studentProfiles = JSON.parse(localStorage.getItem('studentProfiles'));
        if (!studentProfiles) {
            studentProfiles = {
                "2026-001": { fullname: "John Doe", program: "BSIT", section: "BSIT-3A" },
                "2026-002": { fullname: "Maria Clara", program: "BSIT", section: "BSIT-3A" }
            };
            localStorage.setItem('studentProfiles', JSON.stringify(studentProfiles));
        }

        const tbody = document.querySelector('#students-view .data-table tbody');
        if (!tbody) return;
        tbody.innerHTML = ''; 

        for (const [id, data] of Object.entries(studentProfiles)) {
            this.appendStudentRow(id, data.fullname, data.section);
        }
    }

    appendStudentRow(id, fullname, sectionText) {
        const tbody = document.querySelector('#students-view .data-table tbody');
        if (!tbody) return;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="subject-code">${id}</span></td>
            <td>${fullname}</td>
            <td>${sectionText}</td>
            <td class="text-right">
                <div class="action-btns justify-end">
                    <button class="btn-action btn-edit modal-trigger" data-modal-target="editStudentModal" title="Edit Student Data">
                        Edit
                    </button>
                    <button class="btn-action btn-view" title="View Student Profile">
                        &#128065; View
                    </button>
                    <button class="btn-action btn-delete" title="Drop Student">
                        Drop
                    </button>
                </div>
            </td>
        `;

        // Handle Edit Trigger
        const editBtn = tr.querySelector('.btn-edit');
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let studentProfiles = JSON.parse(localStorage.getItem('studentProfiles')) || {};
            const student = studentProfiles[id];
            
            if(student) {
                document.getElementById('edit-student-id').value = id;
                document.getElementById('edit-student-fullname').value = student.fullname || '';
                document.getElementById('edit-student-sex').value = student.sex || 'Male';
                document.getElementById('edit-student-bday').value = student.birthday || '';
                document.getElementById('edit-student-age').value = student.age || '';
                document.getElementById('edit-student-address').value = student.address || '';
                document.getElementById('edit-student-contact').value = student.contact || '';
                document.getElementById('edit-student-email').value = student.email || '';
                document.getElementById('edit-student-program').value = student.program || 'BSIT';
                document.getElementById('edit-student-section').value = student.section || 'Pending';
                document.getElementById('edit-student-father').value = student.fatherName || '';
                document.getElementById('edit-student-father-contact').value = student.fatherContact || '';
                document.getElementById('edit-student-mother').value = student.motherName || '';
                document.getElementById('edit-student-mother-contact').value = student.motherContact || '';
            }
            this.openModal('editStudentModal');
        });

        // Handle View Trigger
        const viewBtn = tr.querySelector('.btn-view');
        viewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showStudentProfileCard(id);
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

    showStudentProfileCard(id) {
        let studentProfiles = JSON.parse(localStorage.getItem('studentProfiles')) || {};
        const student = studentProfiles[id];
        
        if (!student) {
            this.showToast("Student data not found.", "error");
            return;
        }

        // Helper to handle empty/undefined fields cleanly
        const val = (field) => field && field.trim() !== '' ? field : '—';

        // Generate Avatar Initials
        let initials = '--';
        if (student.fullname) {
            const nameParts = student.fullname.trim().split(' ');
            if (nameParts.length >= 2) {
                initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
            } else {
                initials = nameParts[0].substring(0, 2).toUpperCase();
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
    }

    loadSavedTeachers() {
        const facultyList = JSON.parse(localStorage.getItem('facultyMembers')) || [];
        facultyList.forEach(teacher => {
            this.appendTeacherRow(teacher);
        });
    }

    // FIXED: Properly constructs the row, populates HTML, and handles events specific to this row
    appendTeacherRow(teacher) {
        const tbody = document.querySelector('#teachers-view .data-table tbody');
        if (!tbody) return;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="subject-code">${teacher.username}</span></td>
            <td>${teacher.fullname}</td>
            <td>${teacher.email || 'N/A'}</td>
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

        // Handle inner modal triggers specific to this row
        const modalTriggers = tr.querySelectorAll('.modal-trigger');
        modalTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-modal-target');
                
                if (targetId === 'manageSubjectsModal') {
                    this.prepareManageSubjectsModal(btn);
                } else if (targetId === 'editTeacherModal') {
                    document.getElementById('edit-teacher-original-username').value = teacher.username;
                    document.getElementById('edit-teacher-username').value = teacher.username;
                    document.getElementById('edit-teacher-fullname').value = teacher.fullname;
                    document.getElementById('edit-teacher-email').value = teacher.email || '';
                    document.getElementById('edit-teacher-dept').value = teacher.department;
                }
                this.openModal(targetId);
            });
        });

        // Handle Row Deletion
        const deleteBtn = tr.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showConfirm("Delete Teacher", `Are you sure you want to remove ${teacher.fullname}?`, () => {
                let facultyList = JSON.parse(localStorage.getItem('facultyMembers')) || [];
                facultyList = facultyList.filter(f => f.username !== teacher.username);
                localStorage.setItem('facultyMembers', JSON.stringify(facultyList));
                tr.remove();
                this.refreshStatCards();
            });
        });

        tbody.appendChild(tr);
    }

    filterTable(inputSelector, tableBodySelector) {
        const searchInput = document.querySelector(inputSelector);
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll(`${tableBodySelector} tr`);
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    refreshStatCards() {
        const students = JSON.parse(localStorage.getItem('studentProfiles')) || {};
        const teachers = JSON.parse(localStorage.getItem('facultyMembers')) || [];
        const sections = JSON.parse(localStorage.getItem('schoolSections')) || [];

        const studentCountEl = document.querySelector('.stat-card.blue .stat-card-value');
        const teacherCountEl = document.querySelector('.stat-card.indigo .stat-card-value');
        const sectionCountEl = document.querySelector('.stat-card.sky .stat-card-value');

        if (studentCountEl) studentCountEl.textContent = Object.keys(students).length;
        if (teacherCountEl) teacherCountEl.textContent = teachers.length;
        if (sectionCountEl) sectionCountEl.textContent = sections.length;
    }

    loadRecentStudents() {
        const studentProfiles = JSON.parse(localStorage.getItem('studentProfiles')) || {};
        const tbody = document.querySelector('#dashboard-view .data-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const studentsArray = Object.entries(studentProfiles).map(([id, data]) => ({ id, ...data }));
        const recentStudents = studentsArray.slice(-5).reverse();

        if (recentStudents.length === 0) {
            this.appendEmptyState(tbody, 3, "No students registered yet.");
            return;
        }

        recentStudents.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="subject-code">${student.id}</span></td>
                <td>${student.fullname}</td>
                <td>${student.program}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    showConfirm(title, message, onConfirm) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-msg').textContent = message;
        
        const confirmBtn = document.getElementById('confirm-btn-yes');
        // Prevent duplicate fires by cloning the button 
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        
        newBtn.addEventListener('click', () => {
            onConfirm();
            this.closeModal(document.getElementById('confirmActionModal'));
        });
        
        this.openModal('confirmActionModal');
    }

    appendEmptyState(tbodyElement, colSpan, message) {
        if (!tbodyElement) return;
        tbodyElement.innerHTML = `
            <tr>
                <td colspan="${colSpan}" style="text-align: center; padding: 2rem; color: var(--gray-500); font-style: italic;">
                    ${message}
                </td>
            </tr>
        `;
    }

    showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ==========================================
    // UTILITIES
    // ==========================================

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