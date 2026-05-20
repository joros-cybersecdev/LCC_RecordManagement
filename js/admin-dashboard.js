/**
 * AdminDashboardController Class
 * Handles OOP Modal Popups and Internal Routing
 */
class AdminDashboardController {
    constructor() {
        // Modal Elements
        this.modals = document.querySelectorAll('.modal-overlay');
        this.modalTriggers = document.querySelectorAll('.modal-trigger');
        this.closeButtons = document.querySelectorAll('.modal-close-btn');
        
        // Navigation / Routing Elements
        this.navTriggers = document.querySelectorAll('.nav-trigger');

        this.initEvents();
    }initEvents() {
    // 1. Open Modals
        this.modalTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-modal-target');
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

        // 4. Custom App Navigation (e.g., clicking "Manage Payments")
        this.navTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const route = btn.getAttribute('data-route');
                const sidebarLink = document.querySelector(`.sidebar-link[data-target='${route}']`);
                if (sidebarLink) sidebarLink.click();
            });
        });

        // ... existing code ...

    // Handle Delete Buttons
    const deleteBtns = document.querySelectorAll('.btn-delete');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(confirm("Are you sure you want to delete this record?")) {
                // Logic to remove the row goes here
                const row = e.target.closest('tr');
                if (row) row.remove();
            }
        });
    });

    // ----------------------------------------------------
    // NEW: Handle "Confirm Assignment" Button
    // ----------------------------------------------------
    const confirmAssignmentBtn = document.querySelector('#assignNewSubjectModal .btn-submit');
    
    if (confirmAssignmentBtn) {
        confirmAssignmentBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Get the modal and the dropdowns
            const assignModal = document.getElementById('assignNewSubjectModal');
            const selectInputs = assignModal.querySelectorAll('.admin-input');
            const subjectSelect = selectInputs[0];
            const sectionSelect = selectInputs[1];

            const subjectValue = subjectSelect.value;
            const sectionValue = sectionSelect.value;

            // 2. Basic validation (make sure both are selected)
            if (!subjectValue || !sectionValue) {
                alert("Please select both a subject and a section.");
                return;
            }

            // 3. Extract the Subject Code and Title (e.g. "IT303 - Systems Integration")
            const splitSubject = subjectValue.split(' - ');
            const subjectCode = splitSubject[0];
            const subjectTitle = splitSubject[1] || subjectValue;

            // 4. Find the target table inside the Manage Subjects Modal
            const subjectsTableBody = document.querySelector('#manageSubjectsModal .data-table tbody');

            if (subjectsTableBody) {
                // 5. Create a new table row matching your existing HTML
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td><span class="subject-code">${subjectCode}</span></td>
                    <td><strong>${subjectTitle}</strong></td>
                    <td>${sectionValue}</td>
                    <td class="text-right">
                        <div class="action-btns justify-end">
                            <button class="btn-action btn-delete">Unassign</button>
                        </div>
                    </td>
                `;

                // 6. Append the new row to the table
                subjectsTableBody.appendChild(newRow);

                // 7. Make sure the new "Unassign" button works!
                const newDeleteBtn = newRow.querySelector('.btn-delete');
                newDeleteBtn.addEventListener('click', (event) => {
                    if(confirm("Are you sure you want to unassign this subject?")) {
                        event.target.closest('tr').remove();
                    }
                });

                // 8. Reset the dropdowns and close the modal
                subjectSelect.selectedIndex = 0;
                sectionSelect.selectedIndex = 0;
                this.closeModal(assignModal);
            }
        });
    }
    // ----------------------------------------------------

} // <-- End of initEvents() method

openModal(modalId) {
// ... existing code ...

    // Handle Delete Buttons
    const deleteBtns = document.querySelectorAll('.btn-delete');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(confirm("Are you sure you want to delete this record?")) {
                // Logic to remove the row goes here
                const row = e.target.closest('tr');
                if (row) row.remove();
            }
        });
    })
}

  

    

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('open');
    }

    closeModal(modalElement) {
        modalElement.classList.remove('open');
    }
    
    
}

// Initialize when the DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboardController();
});


