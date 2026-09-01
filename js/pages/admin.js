import state from '../state.js';
import api from '../api.js';
import { showModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { renderKanban } from '../components/kanban.js';

const mockKanbanCards = [
    { id: 'app1', title: "Aisha Patel", subtitle: "Vice-Chancellor's Scholarship", status: "Submitted", extra: "GPA: 3.8" },
    { id: 'app2', title: "Marcus Johnson", subtitle: "Developing Solutions", status: "Under Review", extra: "GPA: 3.6" },
    { id: 'app3', title: "Li Wei", subtitle: "Chinese Government Scholarship", status: "Shortlisted", extra: "GPA: 3.9" },
    { id: 'app4', title: "Emma Thompson", subtitle: "Dean's Scholarship", status: "Interviewing", extra: "GPA: 3.7" },
    { id: 'app5', title: "Ahmed Hassan", subtitle: "STEM Excellence", status: "Submitted", extra: "GPA: 3.5" },
    { id: 'app6', title: "Sarah O'Brien", subtitle: "Undergraduate Merit", status: "Decision Made", extra: "Score: 8.5" },
    { id: 'app7', title: "Chen Min", subtitle: "Commonwealth Shared", status: "Under Review", extra: "GPA: 3.4" },
    { id: 'app8', title: "Raj Patel", subtitle: "Engineering Excellence", status: "Submitted", extra: "GPA: 3.6" }
];

function getAdminCards() {
    try {
        const local = JSON.parse(localStorage.getItem('all_applications') || '[]');
        return [...local, ...mockKanbanCards];
    } catch (e) {
        return mockKanbanCards;
    }
}

function getRegisteredUsers() {
    try {
        return JSON.parse(localStorage.getItem('registered_users') || '[]');
    } catch (e) {
        return [];
    }
}

function getAdminLogs() {
    const defaultLogs = [
        { icon: '📝', text: 'Dr. Chen reviewed <strong>Aisha Patel\'s</strong> application <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-success);">(8.2)</span>', time: '2 hours ago' },
        { icon: '🔄', text: 'Application from <strong>Marcus Johnson</strong> moved to <span style="color: #D97706; font-weight: 700;">Under Review</span>', time: '4 hours ago' },
        { icon: '🆕', text: 'New application received for <strong>Developing Solutions</strong>', time: '1 day ago' },
        { icon: '🎓', text: '<strong>Sarah O\'Brien</strong> awarded Dean\'s Scholarship <span style="color: var(--color-success); font-weight: 700;">(£5,000)</span>', time: '2 days ago' },
        { icon: '⚠️', text: 'Document re-upload requested for <strong>Li Wei</strong>', time: '3 days ago' }
    ];
    try {
        const local = JSON.parse(localStorage.getItem('admin_activity_log') || '[]');
        return [...local, ...defaultLogs];
    } catch (e) {
        return defaultLogs;
    }
}

const Admin = {
    render: function (container, params) {
        const cards = getAdminCards();
        const logs = getAdminLogs();
        const users = getRegisteredUsers();

        container.innerHTML = `
            <div style="padding: 1.5rem; max-width: 1600px; margin: 0 auto; font-family: var(--font-body);">
                <header style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--color-light-grey); padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 style="font-family: var(--font-heading); color: var(--color-primary); font-size: 2rem; margin: 0 0 4px; font-weight: 700;">Applicant Inputs &amp; Submissions Console</h1>
                        <p style="color: var(--color-slate); margin: 0; font-size: 0.95rem;">Comprehensive dashboard showing all student user inputs, account sign-ups, and scholarship applications</p>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary); background: var(--color-bg-alt); padding: 6px 14px; border-radius: 6px; border: 1px solid var(--color-light-grey);">
                        Current Cycle: 2026/2027
                    </div>
                </header>

                <!-- User Account Inputs Live Section -->
                ${users.length > 0 ? `
                <div style="background: white; padding: 1.25rem 1.5rem; border-radius: 12px; border: 1px solid var(--color-primary); margin-bottom: 2rem; box-shadow: var(--shadow-sm);">
                    <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary); margin: 0 0 0.75rem; display: flex; align-items: center; gap: 8px;">
                        <span>👤</span> Live Registered User Account Inputs (${users.length} Student Sign-Ups)
                    </h3>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                            <thead>
                                <tr style="background: var(--color-bg-alt); border-bottom: 1px solid var(--color-light-grey); color: var(--color-slate); font-size: 0.78rem; text-transform: uppercase;">
                                    <th style="padding: 8px 12px;">Full Name</th>
                                    <th style="padding: 8px 12px;">Email Address</th>
                                    <th style="padding: 8px 12px;">Phone</th>
                                    <th style="padding: 8px 12px;">Country</th>
                                    <th style="padding: 8px 12px;">Registered At</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr style="border-bottom: 1px solid var(--color-light-grey);">
                                        <td style="padding: 8px 12px; font-weight: 700; color: var(--color-primary);">${u.fullName || 'Student'}</td>
                                        <td style="padding: 8px 12px; color: var(--color-slate);">${u.email}</td>
                                        <td style="padding: 8px 12px;">${u.phone || 'N/A'}</td>
                                        <td style="padding: 8px 12px;">🌍 ${u.country || 'Global'}</td>
                                        <td style="padding: 8px 12px; font-size: 0.78rem; color: var(--color-slate);">${u.registeredAt ? new Date(u.registeredAt).toLocaleString() : 'Recent'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <!-- Metrics Row -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="card" style="position: relative; overflow: hidden; background: white; padding: 1.25rem; border-radius: 10px; border: 1px solid var(--color-light-grey);">
                        <div style="position: absolute; right: -10px; bottom: -10px; font-size: 4.5rem; opacity: 0.04; pointer-events: none;">📋</div>
                        <h3 style="color: var(--color-slate); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px;">Total Applications</h3>
                        <div style="font-size: 2rem; font-family: var(--font-mono); color: var(--color-primary); font-weight: 800; margin-bottom: 6px;" class="counter" data-target="${1245 + cards.length}">0</div>
                        <div style="color: var(--color-success); font-size: 0.8rem; font-weight: 600;">
                            <span style="background: rgba(40,167,69,0.15); padding: 2px 6px; border-radius: 4px;">↑</span> +${cards.length} new
                        </div>
                    </div>
                    <div class="card" style="position: relative; overflow: hidden; background: white; padding: 1.25rem; border-radius: 10px; border: 1px solid var(--color-light-grey);">
                        <div style="position: absolute; right: -10px; bottom: -10px; font-size: 4.5rem; opacity: 0.04; pointer-events: none;">💰</div>
                        <h3 style="color: var(--color-slate); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px;">Total Funds Allocated</h3>
                        <div style="font-size: 2rem; font-family: var(--font-mono); color: var(--color-primary); font-weight: 800; margin-bottom: 6px;">£<span class="counter" data-target="450000">0</span></div>
                        <div style="color: var(--color-success); font-size: 0.8rem; font-weight: 600;">
                            <span style="background: rgba(40,167,69,0.15); padding: 2px 6px; border-radius: 4px;">↑</span> +£50k this month
                        </div>
                    </div>
                    <div class="card" style="position: relative; overflow: hidden; background: white; padding: 1.25rem; border-radius: 10px; border: 1px solid var(--color-light-grey);">
                        <div style="position: absolute; right: -10px; bottom: -10px; font-size: 4.5rem; opacity: 0.04; pointer-events: none;">⏳</div>
                        <h3 style="color: var(--color-slate); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px;">Pending Reviews</h3>
                        <div style="font-size: 2rem; font-family: var(--font-mono); color: var(--color-primary); font-weight: 800; margin-bottom: 6px;" class="counter" data-target="${86 + cards.length}">0</div>
                        <div style="color: var(--color-urgent); font-size: 0.8rem; font-weight: 600;">
                            <span style="background: rgba(220,53,69,0.15); padding: 2px 6px; border-radius: 4px;">↓</span> active review queue
                        </div>
                    </div>
                    <div class="card" style="position: relative; overflow: hidden; background: white; padding: 1.25rem; border-radius: 10px; border: 1px solid var(--color-light-grey);">
                        <div style="position: absolute; right: -10px; bottom: -10px; font-size: 4.5rem; opacity: 0.04; pointer-events: none;">🎓</div>
                        <h3 style="color: var(--color-slate); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px;">Awarded This Cycle</h3>
                        <div style="font-size: 2rem; font-family: var(--font-mono); color: var(--color-primary); font-weight: 800; margin-bottom: 6px;"><span class="counter" data-target="42">0</span> <span style="font-size: 1.1rem; color: var(--color-slate); font-weight: 400;">(12%)</span></div>
                        <div style="color: var(--color-success); font-size: 0.8rem; font-weight: 600;">
                            <span style="background: rgba(40,167,69,0.15); padding: 2px 6px; border-radius: 4px;">↑</span> +2 this week
                        </div>
                    </div>
                </div>

                <!-- Quick Actions Bar -->
                <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; background: white; padding: 1rem 1.25rem; border-radius: 10px; border: 1px solid var(--color-light-grey);">
                    <div style="display: flex; gap: 10px;">
                        <button id="add-scholarship-btn" class="btn btn-secondary" style="font-weight: 700;">
                            <span>+</span> Add Scholarship
                        </button>
                        <button class="btn btn-outline" style="font-weight: 600;">
                            <span>📥</span> Export Report
                        </button>
                    </div>
                    <div style="display: flex; items-center: center; gap: 12px; flex-wrap: wrap;">
                        <div style="position: relative;">
                            <input type="text" id="search-input" placeholder="Search applications by name or ID..." style="padding: 8px 12px 8px 34px; border-radius: 6px; background: var(--color-bg-alt); border: 1px solid var(--color-medium-grey); font-size: 0.88rem; width: 260px;">
                            <span style="position: absolute; left: 10px; top: 8px; color: var(--color-slate);">🔍</span>
                        </div>
                        <div style="display: flex; background: var(--color-light-grey); border-radius: 6px; padding: 3px;">
                            <button id="view-kanban-btn" class="btn" style="padding: 6px 14px; border-radius: 4px; background: white; font-weight: 700; color: var(--color-primary); font-size: 0.85rem;">Board View</button>
                            <button id="view-list-btn" class="btn" style="padding: 6px 14px; border-radius: 4px; background: transparent; font-weight: 600; color: var(--color-slate); font-size: 0.85rem;">List View</button>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem;" class="admin-main-grid">
                    <!-- Main Content Area -->
                    <div id="main-content-area">
                        <!-- Kanban View -->
                        <div id="kanban-view" style="overflow-x: auto; padding-bottom: 1rem;">
                            <!-- Kanban will be injected here -->
                        </div>

                        <!-- List View (Hidden by default) -->
                        <div id="list-view" style="display: none; background: white; border-radius: 10px; border: 1px solid var(--color-light-grey); overflow: hidden;">
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                                    <thead>
                                        <tr style="background: var(--color-bg-alt); border-bottom: 1px solid var(--color-light-grey); font-size: 0.78rem; text-transform: uppercase; color: var(--color-slate);">
                                            <th style="padding: 12px 16px; font-weight: 700;">Applicant</th>
                                            <th style="padding: 12px 16px; font-weight: 700;">Scholarship</th>
                                            <th style="padding: 12px 16px; font-weight: 700;">Status</th>
                                            <th style="padding: 12px 16px; font-weight: 700;">GPA/Score</th>
                                            <th style="padding: 12px 16px; font-weight: 700; text-align: right;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="list-view-body">
                                        ${cards.map(c => `
                                            <tr style="border-bottom: 1px solid var(--color-light-grey); cursor: pointer;" onclick="document.querySelector('.review-btn[data-id=\\'${c.id}\\']').click()">
                                                <td style="padding: 12px 16px; font-weight: 700; color: var(--color-primary);">${c.title}</td>
                                                <td style="padding: 12px 16px; color: var(--color-slate);">${c.subtitle}</td>
                                                <td style="padding: 12px 16px;">
                                                    <span class="badge ${c.status === 'Submitted' ? 'badge-info' : c.status === 'Under Review' ? 'badge-warning' : c.status.includes('Decision') ? 'badge-success' : 'badge-grey'}">
                                                        ${c.status}
                                                    </span>
                                                </td>
                                                <td style="padding: 12px 16px; font-family: var(--font-mono); font-weight: 700; font-size: 0.88rem;">${c.extra}</td>
                                                <td style="padding: 12px 16px; text-align: right;">
                                                    <button class="btn btn-primary review-btn" data-id="${c.id}" data-name="${c.title}" data-extra="${c.extra}" style="padding: 6px 14px; font-size: 0.82rem;" onclick="event.stopPropagation()">Review</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar: Recent Activity -->
                    <div style="background: white; border-radius: 10px; border: 1px solid var(--color-light-grey); padding: 1.25rem; height: fit-content;">
                        <h2 style="font-size: 1.05rem; font-weight: 700; color: var(--color-primary); margin: 0 0 1rem; display: flex; align-items: center; gap: 8px;">
                            <span>⚡</span> Recent Activity
                        </h2>
                        <div style="display: flex; flex-direction: column; gap: 1rem; border-left: 2px solid var(--color-light-grey); padding-left: 1rem; margin-left: 0.5rem;">
                            ${logs.map(log => `
                                <div>
                                    <p style="font-size: 0.88rem; color: var(--color-primary); margin: 0 0 2px;">${log.text}</p>
                                    <span style="font-size: 0.75rem; color: var(--color-slate);">${log.time}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @media (max-width: 960px) {
                    .admin-main-grid { grid-template-columns: 1fr !important; }
                }
            </style>
        `;

        this.init();
    },

    init: function () {

        // Counter Animation
        const counters = document.querySelectorAll('.counter');
        const speed = 40;
        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText.replace(/,/g, '');
                const inc = target / speed;
                if (count < target) {
                    counter.innerText = Math.ceil(count + inc).toLocaleString();
                    setTimeout(updateCount, 30);
                } else {
                    counter.innerText = target.toLocaleString();
                }
            };
            updateCount();
        });

        // Toggle View
        const kanbanBtn = document.getElementById('view-kanban-btn');
        const listBtn = document.getElementById('view-list-btn');
        const kanbanView = document.getElementById('kanban-view');
        const listView = document.getElementById('list-view');

        kanbanBtn.addEventListener('click', () => {
            kanbanBtn.classList.add('bg-white', 'shadow-sm', 'text-[#10263B]');
            kanbanBtn.classList.remove('text-[#61615F]');
            listBtn.classList.remove('bg-white', 'shadow-sm', 'text-[#10263B]');
            listBtn.classList.add('text-[#61615F]');
            kanbanView.classList.remove('hidden');
            listView.classList.add('hidden');
        });

        listBtn.addEventListener('click', () => {
            listBtn.classList.add('bg-white', 'shadow-sm', 'text-[#10263B]');
            listBtn.classList.remove('text-[#61615F]');
            kanbanBtn.classList.remove('bg-white', 'shadow-sm', 'text-[#10263B]');
            kanbanBtn.classList.add('text-[#61615F]');
            listView.classList.remove('hidden');
            kanbanView.classList.add('hidden');
        });

        // Search Functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            
            // Filter List View
            const rows = document.querySelectorAll('#list-view-body tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'hidden';
            });
            
            // Note: Kanban filtering would require re-initializing or updating the kanban component
            // For now we rely on the component's internal capabilities if any, or list view.
        });

        // Initialize Kanban
        const cards = getAdminCards();
        const columns = [
            { id: 'col-submitted', title: 'Submitted', color: '#17A2B8', cards: cards.filter(c => c.status === 'Submitted') },
            { id: 'col-shortlisted', title: 'Shortlisted', color: '#FFC107', cards: cards.filter(c => c.status === 'Shortlisted') },
            { id: 'col-review', title: 'Under Review', color: '#FD7E14', cards: cards.filter(c => c.status === 'Under Review') },
            { id: 'col-interview', title: 'Interviewing', color: '#D4AF37', cards: cards.filter(c => c.status === 'Interviewing') },
            { id: 'col-decision', title: 'Decision Made', color: '#28A745', cards: cards.filter(c => c.status.includes('Decision Made')) }
        ];

        renderKanban('kanban-view', columns, (cardId, sourceCol, targetCol) => {
            showToast(`Application moved to ${targetCol}`, 'success');
                
                // If moved to decision, prompt for award/reject
                if (targetCol.id === 'col-decision') {
                    showModal({
                        title: 'Final Decision Required',
                        content: `
                            <div class="mb-4">
                                <p class="text-[#10263B] mb-4">You moved an application to <strong>Decision Made</strong>. What is the final outcome?</p>
                                <div class="bg-[#F8F9FA] p-4 rounded border border-[#E9ECEF]">
                                    <label class="block text-sm font-semibold text-[#10263B] mb-2">Internal Notes (Optional)</label>
                                    <textarea class="w-full p-2 border border-[#E9ECEF] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none" rows="2"></textarea>
                                </div>
                            </div>
                        `,
                        actions: `
                            <button class="bg-transparent border border-[#61615F] text-[#61615F] px-4 py-2 rounded font-semibold modal-close mr-auto">Cancel</button>
                            <button class="bg-[#DC3545] text-white px-6 py-2 rounded font-bold hover:bg-[#c82333] transition-colors modal-close" onclick="document.dispatchEvent(new CustomEvent('toast',{detail:{message:'Application Rejected',type:'info'}}))">Reject</button>
                            <button class="bg-[#28A745] text-white px-6 py-2 rounded font-bold hover:bg-[#218838] transition-colors modal-close" onclick="document.dispatchEvent(new CustomEvent('toast',{detail:{message:'Application Awarded!',type:'success'}}))">Award</button>
                        `
                    });
                }
            },
            onCardClick: (card) => {
                this.openScorecard(card.title, card.extra);
            },
            renderCardExtras: (card) => `
                <div class="mt-3 pt-3 border-t border-[#E9ECEF] flex justify-between items-center">
                    <span class="bg-[#F8F9FA] text-[#10263B] text-xs px-2 py-1 rounded font-['JetBrains_Mono'] font-semibold">${card.extra}</span>
                    <button class="text-[#10263B] text-xs font-bold hover:text-[#D4AF37] bg-transparent border border-[#10263B] hover:border-[#D4AF37] px-2 py-1 rounded transition-colors review-btn" data-id="${card.id}" data-name="${card.title}" data-extra="${card.extra}">Review ➔</button>
                </div>
            `
        });

        // Attach review button events in list view & kanban (delegated)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.review-btn');
            if (btn) {
                const name = btn.dataset.name;
                const extra = btn.dataset.extra;
                this.openScorecard(name, extra);
            }
        });

        // Add Scholarship Modal
        const addBtn = document.getElementById('add-scholarship-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                showModal({
                    title: 'Create New Scholarship Program',
                    content: `
                        <form id="add-scholarship-form" class="space-y-5 font-['Inter']">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="col-span-2">
                                    <label class="block text-sm font-semibold text-[#10263B] mb-1">Scholarship Title <span class="text-[#DC3545]">*</span></label>
                                    <input type="text" placeholder="e.g. Global Excellence Award" class="w-full p-2 border border-[#E9ECEF] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-[#10263B] mb-1">Award Amount <span class="text-[#DC3545]">*</span></label>
                                    <input type="text" placeholder="e.g. £5,000" class="w-full p-2 border border-[#E9ECEF] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-[#10263B] mb-1">Total Available Slots</label>
                                    <input type="number" placeholder="10" class="w-full p-2 border border-[#E9ECEF] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none">
                                </div>
                                <div class="col-span-2">
                                    <label class="block text-sm font-semibold text-[#10263B] mb-1">Description & Eligibility</label>
                                    <textarea class="w-full p-2 border border-[#E9ECEF] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none" rows="3" placeholder="Briefly describe the criteria..."></textarea>
                                </div>
                            </div>
                        </form>
                    `,
                    actions: `
                        <button class="bg-transparent border border-[#61615F] text-[#61615F] px-4 py-2 rounded font-semibold hover:bg-[#E9ECEF] transition-colors modal-close mr-2">Cancel</button>
                        <button class="bg-[#10263B] text-white px-6 py-2 rounded font-bold hover:bg-[#D4AF37] transition-colors modal-close" onclick="document.dispatchEvent(new CustomEvent('toast',{detail:{message:'Scholarship created successfully',type:'success'}}))">Create Program</button>
                    `
                });
            });
        }
    },

    openScorecard: function (name, extra) {
        showModal({
            title: `Review Application`,
            content: `
                <div class="font-['Inter']">
                    <div class="mb-6 p-4 bg-[#F8F9FA] rounded border border-[#E9ECEF] flex justify-between items-center">
                        <div>
                            <p class="text-xs text-[#61615F] uppercase tracking-wider font-bold mb-1">Applicant</p>
                            <p class="text-lg text-[#10263B] font-bold">${name}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-[#61615F] uppercase tracking-wider font-bold mb-1">Academic Metric</p>
                            <p class="text-lg text-[#10263B] font-['JetBrains_Mono'] font-bold">${extra}</p>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <!-- Academic Merit -->
                        <div class="bg-white p-4 rounded border border-[#E9ECEF]">
                            <div class="flex justify-between items-center mb-3">
                                <div>
                                    <label class="font-bold text-[#10263B] block">Academic Merit</label>
                                    <span class="text-xs text-[#61615F] font-semibold">Weight: 40%</span>
                                </div>
                                <div class="bg-[#10263B] text-white w-10 h-10 rounded flex items-center justify-center font-['JetBrains_Mono'] font-bold text-lg" id="score-academic-val">5</div>
                            </div>
                            <input type="range" id="score-academic" min="1" max="10" value="5" class="w-full accent-[#D4AF37] h-2 bg-[#E9ECEF] rounded-lg appearance-none cursor-pointer">
                            <div class="flex justify-between text-xs text-[#61615F] mt-1 font-semibold"><span>Poor (1)</span><span>Excellent (10)</span></div>
                        </div>

                        <!-- Statement Quality -->
                        <div class="bg-white p-4 rounded border border-[#E9ECEF]">
                            <div class="flex justify-between items-center mb-3">
                                <div>
                                    <label class="font-bold text-[#10263B] block">Statement Quality</label>
                                    <span class="text-xs text-[#61615F] font-semibold">Weight: 30%</span>
                                </div>
                                <div class="bg-[#10263B] text-white w-10 h-10 rounded flex items-center justify-center font-['JetBrains_Mono'] font-bold text-lg" id="score-statement-val">5</div>
                            </div>
                            <input type="range" id="score-statement" min="1" max="10" value="5" class="w-full accent-[#D4AF37] h-2 bg-[#E9ECEF] rounded-lg appearance-none cursor-pointer">
                            <div class="flex justify-between text-xs text-[#61615F] mt-1 font-semibold"><span>Poor (1)</span><span>Excellent (10)</span></div>
                        </div>

                        <!-- Financial Need -->
                        <div class="bg-white p-4 rounded border border-[#E9ECEF]">
                            <div class="flex justify-between items-center mb-3">
                                <div>
                                    <label class="font-bold text-[#10263B] block">Financial Need Assessment</label>
                                    <span class="text-xs text-[#61615F] font-semibold">Weight: 30%</span>
                                </div>
                                <div class="bg-[#10263B] text-white w-10 h-10 rounded flex items-center justify-center font-['JetBrains_Mono'] font-bold text-lg" id="score-financial-val">5</div>
                            </div>
                            <input type="range" id="score-financial" min="1" max="10" value="5" class="w-full accent-[#D4AF37] h-2 bg-[#E9ECEF] rounded-lg appearance-none cursor-pointer">
                            <div class="flex justify-between text-xs text-[#61615F] mt-1 font-semibold"><span>Low Need (1)</span><span>High Need (10)</span></div>
                        </div>

                        <!-- Total Computation -->
                        <div class="mt-6 pt-6 border-t-2 border-[#10263B] flex items-center justify-between bg-[#F8F9FA] p-4 rounded-b">
                            <div>
                                <span class="text-lg font-bold text-[#10263B] block">Computed Final Score</span>
                                <span class="text-xs text-[#61615F] font-semibold">Formula: (Ac×0.4) + (St×0.3) + (Fi×0.3)</span>
                            </div>
                            <div id="total-score-display" class="text-5xl font-['JetBrains_Mono'] font-bold text-[#FD7E14] drop-shadow-sm">5.0</div>
                        </div>

                        <!-- Comments -->
                        <div>
                            <label class="block text-sm font-bold text-[#10263B] mb-2">Reviewer Notes & Justification <span class="text-[#DC3545]">*</span></label>
                            <textarea class="w-full p-3 border border-[#E9ECEF] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none" rows="3" placeholder="Provide context for your scores..."></textarea>
                        </div>
                    </div>
                </div>
            `,
            actions: `
                <button class="bg-transparent border border-[#61615F] text-[#61615F] px-4 py-2 rounded font-semibold hover:bg-[#E9ECEF] transition-colors modal-close mr-auto">Cancel</button>
                <button id="submit-review-btn" class="bg-[#D4AF37] text-[#10263B] px-8 py-2 rounded font-bold hover:bg-[#F0D78C] transition-colors shadow-sm">Submit Final Score</button>
            `
        });

        // Score auto-compute logic
        const sAcad = document.getElementById('score-academic');
        const sStmt = document.getElementById('score-statement');
        const sFin = document.getElementById('score-financial');
        const vAcad = document.getElementById('score-academic-val');
        const vStmt = document.getElementById('score-statement-val');
        const vFin = document.getElementById('score-financial-val');
        const totalDisp = document.getElementById('total-score-display');

        const updateTotal = () => {
            const a = parseInt(sAcad.value);
            const s = parseInt(sStmt.value);
            const f = parseInt(sFin.value);
            
            vAcad.innerText = a;
            vStmt.innerText = s;
            vFin.innerText = f;
            
            const total = (a * 0.4) + (s * 0.3) + (f * 0.3);
            totalDisp.innerText = total.toFixed(1);

            // Color coding based on score
            if (total < 4) {
                totalDisp.className = "text-5xl font-['JetBrains_Mono'] font-bold text-[#DC3545] drop-shadow-sm transition-colors";
            } else if (total < 6) {
                totalDisp.className = "text-5xl font-['JetBrains_Mono'] font-bold text-[#FD7E14] drop-shadow-sm transition-colors";
            } else if (total < 8) {
                totalDisp.className = "text-5xl font-['JetBrains_Mono'] font-bold text-[#FFC107] drop-shadow-sm transition-colors";
            } else {
                totalDisp.className = "text-5xl font-['JetBrains_Mono'] font-bold text-[#28A745] drop-shadow-sm transition-colors";
            }
        };

        sAcad.addEventListener('input', updateTotal);
        sStmt.addEventListener('input', updateTotal);
        sFin.addEventListener('input', updateTotal);

        document.getElementById('submit-review-btn').addEventListener('click', () => {
            // Here you would normally validate the textarea and send data to API
            closeModal();
            showToast(`Review for ${name} submitted successfully`, 'success');
        });
    }
};

export default Admin;
