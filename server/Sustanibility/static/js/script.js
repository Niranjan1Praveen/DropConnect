let carbonChartInstance;

// Dashboard data
let dashboardData = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardData();
    setupEventListeners();

    testGeminiConnection().then(success => {
        console.log(success ? '✅ Gemini API connection successful' : '❌ Gemini API connection failed');
    });
});

// Load dashboard data from API
async function loadDashboardData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Failed to fetch data');
        dashboardData = await response.json();
        updateDashboard();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        dashboardData = {
            user_profile: {},
            carbon_footprint: { historical_data: [] },
            sustainability_activities: [],
            skills: [],
            certifications: [],
            opportunities: []
        };
        updateDashboard();
        showStatus(document.getElementById('electricityStatus'), 'Failed to load data. Please try again.', 'error');
    }
}

// Update dashboard with loaded data
function updateDashboard() {
    updateUserProfile();
    updateCarbonFootprint();
    updateActivities();
    updateSkills();
    updateCertifications();
    updateOpportunities();
    createCarbonChart();
    animateCounters();
}

// Update user profile section
function updateUserProfile() {
    const profile = dashboardData.user_profile || {};
    document.getElementById('userName').textContent = profile.name || 'Unknown User';
    document.getElementById('userLevel').textContent = profile.level || 'N/A';
    document.getElementById('overallScore').textContent = profile.sustainability_score || profile.sustainability_score === 0 ? profile.sustainability_score : 'Upload bill';
    document.getElementById('greenScore').textContent = profile.green_base || profile.green_base === 0 ? profile.green_base : 'Upload bill';
    document.getElementById('carbonScore').textContent = dashboardData.carbon_footprint?.current_score || dashboardData.carbon_footprint?.current_score === 0 ? dashboardData.carbon_footprint.current_score : 'Upload bill';
}

// Update carbon footprint section
function updateCarbonFootprint() {
    const footprint = dashboardData.carbon_footprint || {};
    const electricity = footprint.electricity_usage || {};
    const water = footprint.water_usage || {};

    document.getElementById('carbonScore').textContent = footprint.current_score || footprint.current_score === 0 ? footprint.current_score : 'Upload bill';
    document.getElementById('carbonProgress').style.width = `${footprint.current_score || 0}%`;

    document.getElementById('electricityUsage').textContent = electricity.current_month ? `${electricity.current_month} ${electricity.unit || 'kWh'}` : 'No bill data';
    document.getElementById('electricityEmissions').textContent = electricity.co2_emissions ? `${electricity.co2_emissions} kg CO₂` : 'N/A';

    const electricityChange = electricity.previous_month && electricity.current_month ? ((electricity.current_month - electricity.previous_month) / electricity.previous_month * 100) : null;
    const electricityChangeEl = document.getElementById('electricityChange');
    electricityChangeEl.textContent = electricityChange !== null ? `${electricityChange.toFixed(1)}% from last month` : 'N/A';
    electricityChangeEl.className = `consumption-change ${electricityChange !== null && electricityChange < 0 ? 'positive' : 'negative'}`;

    document.getElementById('waterUsage').textContent = water.current_month ? `${water.current_month.toLocaleString()} ${water.unit || 'Liters'}` : 'No bill data';
    document.getElementById('waterEmissions').textContent = water.co2_emissions ? `${water.co2_emissions} kg CO₂` : 'N/A';

    const waterChange = water.previous_month && water.current_month ? ((water.current_month - water.previous_month) / water.previous_month * 100) : null;
    const waterChangeEl = document.getElementById('waterChange');
    waterChangeEl.textContent = waterChange !== null ? `${waterChange.toFixed(1)}% from last month` : 'N/A';
    waterChangeEl.className = `consumption-change ${waterChange !== null && waterChange < 0 ? 'positive' : 'negative'}`;
}

// Update activities section
function updateActivities() {
    const activitiesGrid = document.getElementById('activitiesGrid');
    activitiesGrid.innerHTML = '';

    (dashboardData.sustainability_activities || []).forEach(activity => {
        const activityCard = document.createElement('div');
        activityCard.className = 'activity-card';
        const mainMetric = activity.trees_planted || activity.waste_collected || 0;
        const metricLabel = activity.type.includes('Tree') ? 'Trees' : activity.type.includes('Beach') ? 'kg Waste' : 'Units';
        activityCard.innerHTML = `
            <div class="activity-header">
                <span class="activity-type">${activity.type || 'Unknown'}</span>
                <span class="activity-date">${formatDate(activity.date)}</span>
            </div>
            <div class="activity-stats">
                <div class="stat-item">
                    <span class="stat-value">${mainMetric}</span>
                    <span class="stat-label">${metricLabel}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${activity.co2_offset || 0}</span>
                    <span class="stat-label">kg CO₂ Offset</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${activity.participants || 0}</span>
                    <span class="stat-label">Participants</span>
                </div>
            </div>
            <p style="color: #cccccc; margin-top: 10px;">${activity.location || 'N/A'}</p>
        `;
        activitiesGrid.appendChild(activityCard);
    });
}

// Update skills section
function updateSkills() {
    const skillsGrid = document.getElementById('skillsGrid');
    skillsGrid.innerHTML = '';

    (dashboardData.skills || []).forEach(skill => {
        const skillCard = document.createElement('div');
        skillCard.className = 'skill-card';
        skillCard.innerHTML = `
            <div class="skill-header">
                <span class="skill-name">${skill.name || 'Unknown'}</span>
                <span class="skill-level">${skill.level || 0}%</span>
            </div>
            <div class="skill-progress">
                <div class="skill-progress-fill" style="width: ${skill.level || 0}%"></div>
            </div>
            <div class="skill-source">Acquired from: ${skill.source || 'N/A'}</div>
        `;
        skillsGrid.appendChild(skillCard);
    });
}

// Update certifications section
function updateCertifications() {
    const certificationsGrid = document.getElementById('certificationsGrid');
    certificationsGrid.innerHTML = '';

    (dashboardData.certifications || []).forEach(cert => {
        const certCard = document.createElement('div');
        certCard.className = 'certification-card';
        certCard.innerHTML = `
            <div class="certification-header">
                <div class="certification-badge">V</div>
                <div>
                    <div class="certification-name">${cert.name || 'Unknown'}</div>
                    <div class="certification-level">${cert.level || 'N/A'}</div>
                </div>
            </div>
            <div class="certification-dates">
                Issued: ${formatDate(cert.issued_date)} | Valid until: ${formatDate(cert.validity)}
            </div>
        `;
        certificationsGrid.appendChild(certCard);
    });
}

// Update opportunities section
function updateOpportunities() {
    const opportunitiesGrid = document.getElementById('opportunitiesGrid');
    opportunitiesGrid.innerHTML = '';

    (dashboardData.opportunities || []).forEach(opportunity => {
        const opportunityCard = document.createElement('div');
        opportunityCard.className = `opportunity-card ${opportunity.status || 'unknown'}`;
        opportunityCard.innerHTML = `
            <div class="opportunity-header">
                <div class="opportunity-title">${opportunity.title || 'Unknown'}</div>
                <div class="opportunity-company">${opportunity.company || 'N/A'}</div>
                <span class="opportunity-type">${opportunity.type || 'N/A'}</span>
            </div>
            <div class="opportunity-details">
                <p><strong>Duration:</strong> ${opportunity.duration || 'N/A'}</p>
                <p><strong>Required Score:</strong> ${opportunity.eligibility_score || 0}</p>
                <p><strong>Deadline:</strong> ${formatDate(opportunity.application_deadline)}</p>
                <p><strong>Required Skills:</strong> ${(opportunity.required_skills || []).join(', ')}</p>
                <p>${opportunity.description || 'No description available'}</p>
            </div>
            <div class="opportunity-status ${opportunity.status || 'unknown'}">${(opportunity.status || 'unknown').replace('_', ' ')}</div>
        `;
        opportunitiesGrid.appendChild(opportunityCard);
    });
}

// Create carbon footprint chart
function createCarbonChart() {
    const ctx = document.getElementById('carbonChart').getContext('2d');

    if (carbonChartInstance) {
        carbonChartInstance.destroy();
    }

    carbonChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: (dashboardData.carbon_footprint?.historical_data || []).map(d => d.month),
            datasets: [{
                label: 'Carbon Score',
                data: (dashboardData.carbon_footprint?.historical_data || []).map(d => d.score),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    setupFileUpload('electricity');
    setupFileUpload('water');

    const addActivityBtn = document.getElementById('addActivityBtn');
    const activityModal = document.getElementById('activityModal');
    const closeModal = document.querySelector('.close');
    const activityForm = document.getElementById('activityForm');

    if (addActivityBtn && activityModal && closeModal && activityForm) {
        addActivityBtn.addEventListener('click', () => {
            activityModal.style.display = 'block';
        });

        closeModal.addEventListener('click', () => {
            activityModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === activityModal) {
                activityModal.style.display = 'none';
            }
        });

        activityForm.addEventListener('submit', handleActivitySubmit);
    }
}

// Setup file upload for specific type
function setupFileUpload(type) {
    const uploadArea = document.getElementById(`${type}Upload`);
    const fileInput = document.getElementById(`${type}File`);
    const status = document.getElementById(`${type}Status`);

    if (uploadArea && fileInput && status) {
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = 'rgba(76, 175, 80, 0.1)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0], type, status);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0], type, status);
            }
        });
    }
}

// Handle file upload
async function handleFileUpload(file, type, statusElement) {
    if (!file.type.includes('pdf')) {
        showStatus(statusElement, 'Please upload a PDF file', 'error');
        return;
    }

    showStatus(statusElement, 'Uploading and processing with Gemini AI...', 'success');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bill_type', type);
    formData.append('num_people', document.getElementById('householdSize')?.value || 1);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showStatus(statusElement, 
                `✅ Processed ${result.bill_type} bill! Carbon Score: ${result.new_score}, Green Score: ${result.green_score}, Sustainability Score: ${result.sustainability_score}`, 
                'success'
            );

            if (result.extracted_data) {
                const preview = document.createElement('div');
                preview.style.marginTop = '10px';
                preview.style.padding = '10px';
                preview.style.background = 'rgba(76, 175, 80, 0.1)';
                preview.style.borderRadius = '5px';
                preview.style.fontSize = '0.9rem';
                preview.innerHTML = `
                    <strong>Extracted Data:</strong><br>
                    Consumption: ${result.extracted_data.consumption} ${result.extracted_data.unit}<br>
                    CO₂ Emissions: ${result.extracted_data.co2_emissions} kg<br>
                    Period: ${result.extracted_data.billing_period || 'Current'}
                `;
                statusElement.appendChild(preview);
            }

            await loadDashboardData();
        } else {
            showStatus(statusElement, `❌ ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showStatus(statusElement, '❌ Upload failed. Please try again.', 'error');
    }
}

// Show upload status
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `upload-status ${type}`;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
        element.innerHTML = '';
    }, 5000);
}

// Handle activity form submission
async function handleActivitySubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const activityData = {
        type: formData.get('activityType'),
        date: formData.get('activityDate'),
        location: formData.get('activityLocation'),
        trees_planted: parseInt(formData.get('treesPlanted')) || 0,
        co2_offset: parseFloat(formData.get('co2Offset')) || 0,
        participants: parseInt(formData.get('participants')) || 1,
        waste_collected: parseInt(formData.get('wasteCollected')) || 0
    };

    try {
        const response = await fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityData)
        });

        const result = await response.json();

        if (response.ok) {
            showStatus(document.getElementById('electricityStatus'), 
                `✅ Activity added! New Sustainability Score: ${result.new_score}, Green Score: ${result.green_score}`, 
                'success'
            );
            document.getElementById('activityModal').style.display = 'none';
            e.target.reset();
            await loadDashboardData();
        } else {
            showStatus(document.getElementById('electricityStatus'), 'Error adding activity: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error adding activity:', error);
        showStatus(document.getElementById('electricityStatus'), 'Error adding activity. Please try again.', 'error');
    }
}

// Utility function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Animate counters on page load
function animateCounters() {
    const counters = document.querySelectorAll('.score-value, .score-value-large');
    counters.forEach(counter => {
        const target = parseInt(counter.textContent) || 0;
        let current = 0;
        const increment = target / 50;

        const timer = setInterval(() => {
            current += increment;
            counter.textContent = Math.ceil(current);

            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            }
        }, 20);
    });
}

// Test Gemini API connection
async function testGeminiConnection() {
    try {
        const response = await fetch('/api/test-gemini', { method: 'POST' });
        const result = await response.json();
        return result.status === 'success';
    } catch (error) {
        console.error('Gemini API test failed:', error);
        return false;
    }
}