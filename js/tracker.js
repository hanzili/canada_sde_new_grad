/**
 * Job Application Tracker
 * Stores job applications in localStorage for persistent tracking
 */

const JobTracker = (function() {
    const STORAGE_KEY = 'canada_tech_jobs_tracker';
    const STATUSES = {
        saved: { label: 'Saved', icon: '💾', color: '#6b7280' },
        applied: { label: 'Applied', icon: '✅', color: '#22c55e' },
        interview: { label: 'Interview', icon: '📞', color: '#3b82f6' },
        offer: { label: 'Offer', icon: '🎉', color: '#a855f7' },
        rejected: { label: 'Rejected', icon: '❌', color: '#ef4444' }
    };

    // Get all tracked jobs from localStorage
    function getAllJobs() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error reading tracker data:', e);
            return {};
        }
    }

    // Save all jobs to localStorage
    function saveAllJobs(jobs) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
            return true;
        } catch (e) {
            console.error('Error saving tracker data:', e);
            return false;
        }
    }

    // Track a job with full details (preserves data even after job expires)
    function trackJob(jobData, status = 'saved') {
        const jobs = getAllJobs();
        const jobId = jobData.id;

        // If job already tracked, update status; otherwise add new
        if (jobs[jobId]) {
            jobs[jobId].status = status;
            jobs[jobId].updatedAt = new Date().toISOString();
        } else {
            jobs[jobId] = {
                id: jobId,
                title: jobData.title,
                company: jobData.company,
                location: jobData.location,
                applyUrl: jobData.applyUrl,
                pageUrl: jobData.pageUrl,
                postedDate: jobData.postedDate,
                category: jobData.category,
                status: status,
                notes: '',
                savedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        saveAllJobs(jobs);
        dispatchUpdate(jobId, status);
        return jobs[jobId];
    }

    // Update job status
    function updateStatus(jobId, status) {
        const jobs = getAllJobs();
        if (jobs[jobId]) {
            jobs[jobId].status = status;
            jobs[jobId].updatedAt = new Date().toISOString();
            saveAllJobs(jobs);
            dispatchUpdate(jobId, status);
            return true;
        }
        return false;
    }

    // Update job notes
    function updateNotes(jobId, notes) {
        const jobs = getAllJobs();
        if (jobs[jobId]) {
            jobs[jobId].notes = notes;
            jobs[jobId].updatedAt = new Date().toISOString();
            saveAllJobs(jobs);
            return true;
        }
        return false;
    }

    // Remove a job from tracking
    function removeJob(jobId) {
        const jobs = getAllJobs();
        if (jobs[jobId]) {
            delete jobs[jobId];
            saveAllJobs(jobs);
            dispatchUpdate(jobId, null);
            return true;
        }
        return false;
    }

    // Get a single job's tracking data
    function getJob(jobId) {
        const jobs = getAllJobs();
        return jobs[jobId] || null;
    }

    // Get all jobs as array, sorted by updated date
    function getJobsArray() {
        const jobs = getAllJobs();
        return Object.values(jobs).sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
    }

    // Get jobs filtered by status
    function getJobsByStatus(status) {
        return getJobsArray().filter(job => job.status === status);
    }

    // Get statistics
    function getStats() {
        const jobs = getJobsArray();
        const stats = {
            total: jobs.length,
            saved: 0,
            applied: 0,
            interview: 0,
            offer: 0,
            rejected: 0
        };
        jobs.forEach(job => {
            if (stats[job.status] !== undefined) {
                stats[job.status]++;
            }
        });
        return stats;
    }

    // Export to CSV
    function exportToCSV() {
        const jobs = getJobsArray();
        if (jobs.length === 0) {
            alert('No tracked jobs to export.');
            return;
        }

        const headers = ['Title', 'Company', 'Location', 'Status', 'Notes', 'Apply URL', 'Posted Date', 'Saved Date'];
        const rows = jobs.map(job => [
            job.title,
            job.company,
            job.location,
            STATUSES[job.status]?.label || job.status,
            job.notes.replace(/"/g, '""'),
            job.applyUrl,
            job.postedDate,
            job.savedAt.split('T')[0]
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    // Dispatch custom event for UI updates
    function dispatchUpdate(jobId, status) {
        window.dispatchEvent(new CustomEvent('jobTrackerUpdate', {
            detail: { jobId, status }
        }));
    }

    // Initialize tracker buttons on page
    function initTrackerButtons() {
        document.querySelectorAll('[data-tracker-job]').forEach(container => {
            const jobData = JSON.parse(container.dataset.trackerJob);
            const tracked = getJob(jobData.id);
            renderTrackerUI(container, jobData, tracked);
        });
    }

    // Render tracker UI for a job
    function renderTrackerUI(container, jobData, tracked) {
        container.innerHTML = '';

        if (tracked) {
            // Show current status and change options
            const statusInfo = STATUSES[tracked.status] || STATUSES.saved;

            const wrapper = document.createElement('div');
            wrapper.className = 'tracker-active';
            wrapper.innerHTML = `
                <span class="tracker-status" style="background-color: ${statusInfo.color}">
                    ${statusInfo.icon} ${statusInfo.label}
                </span>
                <div class="tracker-actions">
                    ${Object.entries(STATUSES).map(([key, val]) =>
                        key !== tracked.status ?
                        `<button class="tracker-btn tracker-btn-sm" data-status="${key}" title="${val.label}">${val.icon}</button>` : ''
                    ).join('')}
                    <button class="tracker-btn tracker-btn-remove" data-action="remove" title="Remove">🗑️</button>
                </div>
            `;
            container.appendChild(wrapper);

            // Add event listeners
            wrapper.querySelectorAll('[data-status]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateStatus(jobData.id, btn.dataset.status);
                    renderTrackerUI(container, jobData, getJob(jobData.id));
                });
            });

            wrapper.querySelector('[data-action="remove"]')?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('Remove this job from tracking?')) {
                    removeJob(jobData.id);
                    renderTrackerUI(container, jobData, null);
                }
            });
        } else {
            // Show save button
            const saveBtn = document.createElement('button');
            saveBtn.className = 'tracker-btn tracker-btn-save';
            saveBtn.innerHTML = '💾 Save Job';
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                trackJob(jobData, 'saved');
                renderTrackerUI(container, jobData, getJob(jobData.id));
            });
            container.appendChild(saveBtn);
        }
    }

    // Get status info
    function getStatusInfo(status) {
        return STATUSES[status] || { label: status, icon: '❓', color: '#6b7280' };
    }

    // Public API
    return {
        trackJob,
        updateStatus,
        updateNotes,
        removeJob,
        getJob,
        getAllJobs,
        getJobsArray,
        getJobsByStatus,
        getStats,
        exportToCSV,
        initTrackerButtons,
        getStatusInfo,
        STATUSES
    };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    JobTracker.initTrackerButtons();
});
