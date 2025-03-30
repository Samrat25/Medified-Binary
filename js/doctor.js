// DOM Elements and Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.userType !== 'doctor') {
        // Redirect to login if not logged in or not a doctor
        window.location.href = 'index.html';
        return;
    }
    
    // DOM elements
    const userNameElements = document.querySelectorAll('.user-name');
    const userEmailElement = document.querySelector('.user-email');
    const userSpecializationElement = document.querySelector('.user-specialization');
    const userInitialsElement = document.querySelector('.user-initials');
    const logoutBtn = document.getElementById('logoutBtn');
    const appointmentCardsContainer = document.getElementById('appointmentCards');
    const appointmentDetailModal = document.getElementById('appointmentDetailModal');
    const modalCloseBtn = document.querySelector('.modal-close');
    const modalCompleteBtn = document.getElementById('completeAppointmentBtn');
    const modalCancelBtn = document.querySelector('.modal-cancel');
    const appointmentCountElement = document.getElementById('appointmentCount');
    const upcomingCountElement = document.getElementById('upcomingCount');
    const patientsCountElement = document.getElementById('patientsCount');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Patient section elements
    const patientCardsContainer = document.getElementById('patientCards');
    const patientSearchInput = document.getElementById('patientSearchInput');
    const patientFilter = document.getElementById('patientFilter');
    
    // Video call elements
    const startVideoCallBtn = document.getElementById('startVideoCall');
    const joinVideoCallBtn = document.getElementById('joinVideoCall');
    const videoCallIdDisplay = document.getElementById('videoCallId');
    const copyCallIdBtn = document.getElementById('copyCallId');
    
    // Initialize page
    initializePage();
    
    // Event Listeners
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', closeModal);
    }
    
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                filterAppointments(filter);
                
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    
    // Patient section event listeners
    if (patientSearchInput) {
        patientSearchInput.addEventListener('input', function() {
            filterPatients();
        });
    }
    
    if (patientFilter) {
        patientFilter.addEventListener('change', function() {
            filterPatients();
        });
    }
    
    // Video call event listeners
    if (startVideoCallBtn) {
        startVideoCallBtn.addEventListener('click', function() {
            startNewVideoCall();
        });
    }
    
    if (joinVideoCallBtn) {
        joinVideoCallBtn.addEventListener('click', function() {
            joinExistingVideoCall();
        });
    }
    
    if (copyCallIdBtn) {
        copyCallIdBtn.addEventListener('click', function() {
            copyToClipboard(videoCallIdDisplay.textContent);
        });
    }
    
    // Functions
    function initializePage() {
        // Set user name and initials
        if (userNameElements) {
            userNameElements.forEach(element => {
                element.textContent = currentUser.name;
            });
        }
        if (userSpecializationElement) {
            userSpecializationElement.textContent = currentUser.specialization;
        }
        
        if (userInitialsElement) {
            userInitialsElement.textContent = getInitials(currentUser.name);
        }
        
        // Load appointments
        loadAppointments();
        
        // Load patients
        loadPatients();
        
        // Update dashboard counts
        updateDashboardCounts();
        
        // Generate video call ID if not already set
        if (videoCallIdDisplay && !videoCallIdDisplay.textContent) {
            videoCallIdDisplay.textContent = `DR-${Math.floor(Math.random() * 10000) + 1}`;
        }
    }
    
    function getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase();
    }
    
    function logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
    
    function loadAppointments(filterValue = 'all') {
        if (!appointmentCardsContainer) return;
        
        // Get the current user's appointments
        const appointments = currentUser.appointments || [];
        
        // Early return if no appointments
        if (appointments.length === 0) {
            appointmentCardsContainer.innerHTML = '<div class="no-data">No appointments scheduled.</div>';
            return;
        }
        
        // Sort appointments by date (newest first)
        appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Filter appointments based on status
        const filteredAppointments = filterValue === 'all' ? 
            appointments : 
            appointments.filter(appointment => {
                if (filterValue === 'upcoming') return appointment.status === 'Upcoming';
                if (filterValue === 'completed') return appointment.status === 'Completed';
                if (filterValue === 'cancelled') return appointment.status === 'Cancelled';
                return true;
            });
        
        if (filteredAppointments.length === 0) {
            appointmentCardsContainer.innerHTML = `<div class="no-data">No ${filterValue} appointments found.</div>`;
            return;
        }
        
        let appointmentHTML = '';
        
        // Generate HTML for each appointment card
        filteredAppointments.forEach(appointment => {
            const statusClass = getStatusClass(appointment.status);
            const appointmentDate = new Date(appointment.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isToday = appointmentDate.getTime() === today.getTime();
            const isTomorrow = appointmentDate.getTime() === today.getTime() + 86400000;
            const isPast = appointmentDate < today;
            
            let dateLabel = formatDate(appointment.date);
            if (isToday) dateLabel = 'Today';
            if (isTomorrow) dateLabel = 'Tomorrow';
            
            // Set appropriate icon based on appointment status
            let statusIcon = 'fa-calendar-check';
            if (appointment.status === 'Completed') statusIcon = 'fa-check-circle';
            if (appointment.status === 'Cancelled') statusIcon = 'fa-times-circle';
            
            // Create priority label for appointments
            let priorityLabel = '';
            let priorityClass = '';
            
            if (isToday && appointment.status === 'Upcoming') {
                priorityLabel = 'Today';
                priorityClass = 'priority-high';
            } else if (isTomorrow && appointment.status === 'Upcoming') {
                priorityLabel = 'Tomorrow';
                priorityClass = 'priority-medium';
            } else if (!isPast && appointment.status === 'Upcoming') {
                priorityLabel = 'Upcoming';
                priorityClass = 'priority-low';
            }
            
            appointmentHTML += `
            <div class="appointment-card ${statusClass.replace('status-', '')}">
                <div class="appointment-card-header">
                    <div class="appointment-status">
                        <i class="fas ${statusIcon}"></i>
                        <span class="status-badge ${statusClass}">${appointment.status}</span>
                    </div>
                    ${priorityLabel ? `<div class="priority-badge ${priorityClass}">${priorityLabel}</div>` : ''}
                </div>
                <div class="appointment-card-body">
                    <div class="appointment-doctor">
                        <div class="doctor-avatar">${getInitials(appointment.patientName)}</div>
                        <div class="doctor-info">
                            <h3>${appointment.patientName}</h3>
                            <p>Patient ID: ${appointment.patientId}</p>
                        </div>
                    </div>
                    <div class="appointment-details">
                        <div class="appointment-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${dateLabel}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-clock"></i>
                            <span>${appointment.time}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-stethoscope"></i>
                            <span>${appointment.reason || 'General Consultation'}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>In-Person Visit</span>
                        </div>
                    </div>
                </div>
                <div class="appointment-card-footer">
                    <button class="btn-secondary" onclick="viewAppointmentDetails('${appointment.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${appointment.status === 'Upcoming' ? 
                    `<button class="btn-success" onclick="completeAppointment('${appointment.id}')">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button class="btn-danger" onclick="cancelAppointment('${appointment.id}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>` : ''}
                </div>
            </div>
            `;
        });
        
        appointmentCardsContainer.innerHTML = appointmentHTML;
    }
    
    function filterAppointments(filter) {
        loadAppointments(filter);
    }
    
    function getStatusClass(status) {
        switch(status) {
            case 'Upcoming':
                return 'status-upcoming';
            case 'Completed':
                return 'status-completed';
            case 'Cancelled':
                return 'status-cancelled';
            default:
                return '';
        }
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function updateDashboardCounts() {
        // Get appointments and patients
        const appointments = currentUser.appointments || [];
        
        // Extract unique patient IDs
        const patientIds = new Set();
        appointments.forEach(appointment => {
            if (appointment.patientId) {
                patientIds.add(appointment.patientId);
            }
        });
        
        // Count appointments
        if (appointmentCountElement) {
            appointmentCountElement.textContent = appointments.length;
        }
        
        // Count upcoming appointments
        if (upcomingCountElement) {
            const upcomingCount = appointments.filter(a => a.status === 'Upcoming').length;
            upcomingCountElement.textContent = upcomingCount;
        }
        
        // Count unique patients
        if (patientsCountElement) {
            patientsCountElement.textContent = patientIds.size;
        }
    }
    
    function openModal() {
        if (appointmentDetailModal) {
            appointmentDetailModal.classList.add('active');
        }
    }
    
    function closeModal() {
        if (appointmentDetailModal) {
            appointmentDetailModal.classList.remove('active');
        }
    }
    
    // Patients Section Functions
    function loadPatients() {
        if (!patientCardsContainer) return;
        
        // Get all appointments to extract unique patients
        const appointments = currentUser.appointments || [];
        
        // Create a map to store unique patients
        const patientsMap = new Map();
        
        appointments.forEach(appointment => {
            if (!patientsMap.has(appointment.patientId)) {
                patientsMap.set(appointment.patientId, {
                    id: appointment.patientId,
                    name: appointment.patientName,
                    lastVisit: appointment.date,
                    appointments: []
                });
            }
            
            // Add appointment to patient's record
            const patient = patientsMap.get(appointment.patientId);
            patient.appointments.push({
                id: appointment.id,
                date: appointment.date,
                time: appointment.time,
                reason: appointment.reason,
                status: appointment.status
            });
            
            // Update last visit if newer
            if (new Date(appointment.date) > new Date(patient.lastVisit)) {
                patient.lastVisit = appointment.date;
            }
        });
        
        // Convert map to array
        const patients = Array.from(patientsMap.values());
        
        // Sort by name
        patients.sort((a, b) => a.name.localeCompare(b.name));
        
        renderPatients(patients);
    }
    
    function renderPatients(patients) {
        if (!patientCardsContainer) return;
        
        if (patients.length === 0) {
            patientCardsContainer.innerHTML = '<div class="no-data">No patients found.</div>';
            return;
        }
        
        let patientsHTML = '';
        
        patients.forEach(patient => {
            // Count upcoming appointments
            const upcomingAppointments = patient.appointments.filter(a => a.status === 'Upcoming').length;
            
            // Format last visit date
            const lastVisitDate = formatDate(patient.lastVisit);
            
            patientsHTML += `
            <div class="patient-card">
                <div class="patient-card-header">
                    <div class="patient-avatar">${getInitials(patient.name)}</div>
                    <div class="patient-info">
                        <h3>${patient.name}</h3>
                        <p>Patient ID: ${patient.id}</p>
                    </div>
                </div>
                <div class="patient-card-body">
                    <div class="patient-detail">
                        <i class="fas fa-calendar-check"></i>
                        <span>Total Visits: ${patient.appointments.length}</span>
                    </div>
                    <div class="patient-detail">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Upcoming: ${upcomingAppointments}</span>
                    </div>
                    <div class="patient-detail">
                        <i class="fas fa-history"></i>
                        <span>Last Visit: ${lastVisitDate}</span>
                    </div>
                </div>
                <div class="patient-card-footer">
                    <button class="btn-secondary" onclick="viewPatientDetails('${patient.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn-primary" onclick="scheduleAppointment('${patient.id}')">
                        <i class="fas fa-calendar-plus"></i> Schedule
                    </button>
                </div>
            </div>
            `;
        });
        
        patientCardsContainer.innerHTML = patientsHTML;
    }
    
    function filterPatients() {
        if (!patientCardsContainer) return;
        
        const searchTerm = patientSearchInput ? patientSearchInput.value.toLowerCase().trim() : '';
        const filterValue = patientFilter ? patientFilter.value : 'all';
        
        // Get all appointments to extract unique patients
        const appointments = currentUser.appointments || [];
        
        // Create a map to store unique patients
        const patientsMap = new Map();
        
        appointments.forEach(appointment => {
            if (!patientsMap.has(appointment.patientId)) {
                patientsMap.set(appointment.patientId, {
                    id: appointment.patientId,
                    name: appointment.patientName,
                    lastVisit: appointment.date,
                    appointments: []
                });
            }
            
            // Add appointment to patient's record
            const patient = patientsMap.get(appointment.patientId);
            patient.appointments.push({
                id: appointment.id,
                date: appointment.date,
                time: appointment.time,
                reason: appointment.reason,
                status: appointment.status
            });
            
            // Update last visit if newer
            if (new Date(appointment.date) > new Date(patient.lastVisit)) {
                patient.lastVisit = appointment.date;
            }
        });
        
        // Convert map to array
        let patients = Array.from(patientsMap.values());
        
        // Apply search filter
        if (searchTerm) {
            patients = patients.filter(patient => 
                patient.name.toLowerCase().includes(searchTerm) ||
                patient.id.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply type filter
        if (filterValue === 'recent') {
            // Sort by last visit (newest first)
            patients.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
            // Get only the 10 most recent
            patients = patients.slice(0, 10);
        } else if (filterValue === 'upcoming') {
            // Only patients with upcoming appointments
            patients = patients.filter(patient => 
                patient.appointments.some(a => a.status === 'Upcoming')
            );
        }
        
        renderPatients(patients);
    }

// Global functions (accessible from HTML)
function viewAppointmentDetails(appointmentId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;
    
    const appointment = currentUser.appointments.find(a => a.id === appointmentId);
    
    if (!appointment) {
        alert('Appointment not found');
        return;
    }
    
    const modal = document.getElementById('appointmentDetailModal');
    
    if (!modal) return;
    
    // Update modal content
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Appointment with ${appointment.patientName}`;
    }
    
    // Find modal fields and update them
    const patientNameField = document.getElementById('modalPatientName');
    const patientEmailField = document.getElementById('modalPatientEmail');
    const appointmentDateField = document.getElementById('modalAppointmentDate');
    const appointmentTimeField = document.getElementById('modalAppointmentTime');
    const appointmentReasonField = document.getElementById('modalAppointmentReason');
    const appointmentStatusField = document.getElementById('modalAppointmentStatus');
    const completeAppointmentBtn = document.getElementById('completeAppointmentBtn');
    const cancelAppointmentBtn = document.getElementById('cancelAppointmentBtn');
    
    if (patientNameField) patientNameField.textContent = appointment.patientName;
    if (patientEmailField) patientEmailField.textContent = appointment.patientEmail;
    if (appointmentDateField) appointmentDateField.textContent = new Date(appointment.date).toLocaleDateString();
    if (appointmentTimeField) appointmentTimeField.textContent = appointment.time;
    if (appointmentReasonField) appointmentReasonField.textContent = appointment.reason || 'Not specified';
    if (appointmentStatusField) {
        appointmentStatusField.textContent = appointment.status;
        appointmentStatusField.className = ''; // Reset classes
        appointmentStatusField.classList.add(getStatusClass(appointment.status));
    }
    
    // Show/hide action buttons based on status
    if (completeAppointmentBtn) {
        if (appointment.status === 'Upcoming') {
            completeAppointmentBtn.style.display = 'block';
            completeAppointmentBtn.onclick = function() {
                completeAppointment(appointment.id);
                closeModal();
            };
        } else {
            completeAppointmentBtn.style.display = 'none';
        }
    }
    
    if (cancelAppointmentBtn) {
        if (appointment.status === 'Upcoming') {
            cancelAppointmentBtn.style.display = 'block';
            cancelAppointmentBtn.onclick = function() {
                cancelAppointment(appointment.id);
                closeModal();
            };
        } else {
            cancelAppointmentBtn.style.display = 'none';
        }
    }
    
    // Store current appointment ID in the modal
    modal.dataset.appointmentId = appointmentId;
    
    // Open modal
    modal.classList.add('active');
}

function getStatusClass(status) {
    switch(status) {
        case 'Upcoming':
            return 'status-upcoming';
        case 'Completed':
            return 'status-completed';
        case 'Cancelled':
            return 'status-cancelled';
        default:
            return '';
    }
}

function closeModal() {
    const modal = document.getElementById('appointmentDetailModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function completeAppointment(appointmentId) {
    if (!confirm('Mark this appointment as completed?')) {
        return;
    }
    
    updateAppointmentStatus(appointmentId, 'Completed');
}

function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    updateAppointmentStatus(appointmentId, 'Cancelled');
}

function updateAppointmentStatus(appointmentId, newStatus) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;
    
    // Find appointment
    const appointmentIndex = currentUser.appointments.findIndex(a => a.id === appointmentId);
    
    if (appointmentIndex === -1) {
        alert('Appointment not found');
        return;
    }
    
    const appointment = currentUser.appointments[appointmentIndex];
    
    // Update status
    appointment.status = newStatus;
    
    // Update in current user
    currentUser.appointments[appointmentIndex] = appointment;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update in users array
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const doctorIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (doctorIndex !== -1) {
        users[doctorIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Update in doctors array
    const doctors = JSON.parse(localStorage.getItem('doctors')) || [];
    const doctorArrayIndex = doctors.findIndex(d => d.id === currentUser.id);
    
    if (doctorArrayIndex !== -1) {
        doctors[doctorArrayIndex] = currentUser;
        localStorage.setItem('doctors', JSON.stringify(doctors));
    }
    
    // Update in patient's appointments
    const patientUser = users.find(u => u.id === appointment.patientId);
    
    if (patientUser) {
        const patientAppointmentIndex = patientUser.appointments.findIndex(a => a.id === appointmentId);
        
        if (patientAppointmentIndex !== -1) {
            patientUser.appointments[patientAppointmentIndex] = appointment;
            
            // Update patient in users array
            const patientIndex = users.findIndex(u => u.id === patientUser.id);
            
            if (patientIndex !== -1) {
                users[patientIndex] = patientUser;
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
    }
    
    // Reload appointments
    const appointmentCardsContainer = document.getElementById('appointmentCards');
    if (appointmentCardsContainer) {
        // Get active filter
        const activeFilter = document.querySelector('.filter-btn.active');
        let statusFilter = 'all';
        
        if (activeFilter) {
            statusFilter = activeFilter.dataset.filter;
            
            if (statusFilter === 'upcoming') {
                statusFilter = 'Upcoming';
            } else if (statusFilter === 'completed') {
                statusFilter = 'Completed';
            } else if (statusFilter === 'cancelled') {
                statusFilter = 'Cancelled';
            }
        }
        
        // Get current user's appointments
        const appointments = currentUser.appointments || [];
        
        if (appointments.length === 0) {
            appointmentCardsContainer.innerHTML = '<div class="no-data">No appointments scheduled.</div>';
            return;
        }
        
        // Filter by status if needed
        let filteredAppointments = appointments;
        if (statusFilter !== 'all') {
            filteredAppointments = appointments.filter(a => a.status === statusFilter);
        }
        
        if (filteredAppointments.length === 0) {
            appointmentCardsContainer.innerHTML = '<div class="no-data">No appointments found with this status.</div>';
            return;
        }
        
        // Sort appointments
        if (statusFilter === 'Upcoming') {
            filteredAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
            filteredAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        
        let appointmentHTML = '';
        
        filteredAppointments.forEach(appointment => {
            const statusClass = getStatusClass(appointment.status);
            const appointmentDate = new Date(appointment.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isToday = appointmentDate.getTime() === today.getTime();
            const isTomorrow = appointmentDate.getTime() === today.getTime() + 86400000;
            const isPast = appointmentDate < today;
            
            let dateLabel = formatDate(appointment.date);
            if (isToday) dateLabel = 'Today';
            if (isTomorrow) dateLabel = 'Tomorrow';
            
            // Set appropriate icon based on appointment status
            let statusIcon = 'fa-calendar-check';
            if (appointment.status === 'Completed') statusIcon = 'fa-check-circle';
            if (appointment.status === 'Cancelled') statusIcon = 'fa-times-circle';
            
            // Create priority label for appointments
            let priorityLabel = '';
            let priorityClass = '';
            
            if (isToday && appointment.status === 'Upcoming') {
                priorityLabel = 'Today';
                priorityClass = 'priority-high';
            } else if (isTomorrow && appointment.status === 'Upcoming') {
                priorityLabel = 'Tomorrow';
                priorityClass = 'priority-medium';
            } else if (!isPast && appointment.status === 'Upcoming') {
                priorityLabel = 'Upcoming';
                priorityClass = 'priority-low';
            }
            
            appointmentHTML += `
            <div class="appointment-card ${statusClass.replace('status-', '')}">
                <div class="appointment-card-header">
                    <div class="appointment-status">
                        <i class="fas ${statusIcon}"></i>
                        <span class="status-badge ${statusClass}">${appointment.status}</span>
                    </div>
                    ${priorityLabel ? `<div class="priority-badge ${priorityClass}">${priorityLabel}</div>` : ''}
                </div>
                <div class="appointment-card-body">
                    <div class="appointment-doctor">
                        <div class="doctor-avatar">${getInitials(appointment.patientName)}</div>
                        <div class="doctor-info">
                            <h3>${appointment.patientName}</h3>
                            <p>Patient ID: ${appointment.patientId}</p>
                        </div>
                    </div>
                    <div class="appointment-details">
                        <div class="appointment-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${dateLabel}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-clock"></i>
                            <span>${appointment.time}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-stethoscope"></i>
                            <span>${appointment.reason || 'General Consultation'}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>In-Person Visit</span>
                        </div>
                    </div>
                </div>
                <div class="appointment-card-footer">
                    <button class="btn-secondary" onclick="viewAppointmentDetails('${appointment.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${appointment.status === 'Upcoming' ? 
                    `<button class="btn-success" onclick="completeAppointment('${appointment.id}')">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button class="btn-danger" onclick="cancelAppointment('${appointment.id}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>` : ''}
                </div>
            </div>
            `;
        });
        
        appointmentCardsContainer.innerHTML = appointmentHTML;
    }
    
    // Update dashboard counts
    const appointmentCountElement = document.getElementById('appointmentCount');
    const upcomingCountElement = document.getElementById('upcomingCount');
    const patientsCountElement = document.getElementById('patientsCount');
    
    if (appointmentCountElement) {
        appointmentCountElement.textContent = currentUser.appointments.length;
    }
    
    if (upcomingCountElement) {
        const upcomingCount = currentUser.appointments.filter(a => a.status === 'Upcoming').length;
        upcomingCountElement.textContent = upcomingCount;
    }
    
    if (patientsCountElement) {
        const uniquePatients = [...new Set(currentUser.appointments.map(a => a.patientId))].length;
        patientsCountElement.textContent = uniquePatients;
    }
    
    alert(`Appointment ${newStatus.toLowerCase()} successfully`);
}

function viewPatientDetails(patientId) {
    // Get all appointments for this patient
    const appointments = currentUser.appointments || [];
    const patientAppointments = appointments.filter(a => a.patientId === patientId);
    
    if (patientAppointments.length === 0) {
        alert('No appointments found for this patient.');
        return;
    }
    
    // Get patient information from the first appointment
    const patientName = patientAppointments[0].patientName;
    
    // Create a patient details modal and display it
    const modalContent = `
    <div class="modal" id="patientDetailsModal" style="display: block;">
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">&times;</button>
            <h2 class="modal-title">${patientName}</h2>
            <div class="patient-info-container">
                <div class="patient-profile">
                    <div class="patient-avatar-large">${getInitials(patientName)}</div>
                    <div class="patient-id">ID: ${patientId}</div>
                    <button class="btn-primary" onclick="scheduleAppointment('${patientId}')">
                        <i class="fas fa-calendar-plus"></i> New Appointment
                    </button>
                </div>
                <div class="patient-history">
                    <h3>Appointment History</h3>
                    <div class="patient-appointments">
                        ${patientAppointments.map(appointment => `
                            <div class="patient-appointment-item ${getStatusClass(appointment.status).replace('status-', '')}">
                                <div class="appointment-detail-date">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${formatDate(appointment.date)}</span>
                                </div>
                                <div class="appointment-detail-time">
                                    <i class="fas fa-clock"></i>
                                    <span>${appointment.time}</span>
                                </div>
                                <div class="appointment-detail-reason">
                                    <i class="fas fa-stethoscope"></i>
                                    <span>${appointment.reason || 'General Consultation'}</span>
                                </div>
                                <div class="appointment-detail-status">
                                    <span class="status-badge ${getStatusClass(appointment.status)}">${appointment.status}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = modalContent;
    
    // Append to body
    document.body.appendChild(tempContainer.firstChild);
}

function scheduleAppointment(patientId) {
    alert(`Scheduling functionality for patient ${patientId} not implemented yet.`);
}

