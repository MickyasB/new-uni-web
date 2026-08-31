import state from '../state.js';
import api from '../api.js';
import { showModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { renderKanban } from '../components/kanban.js';
import { sendTelegramAlert, sendTestMessage, getChatId, BOT_LINK } from '../telegram.js';

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

const Admin = {
    render: function (container, params) {
        if (!state.user || (state.user.role !== 'ADMIN' && state.user.role !== 'REVIEWER')) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
                    <h2 class="text-2xl font-['Playfair_Display'] text-[#10263B] mb-4">Access Denied</h2>
                    <p class="text-[#61615F] mb-6">You do not have permission to view this page. Please log in with admin or reviewer credentials.</p>
                    <a href="#/login" class="bg-[#10263B] text-white px-6 py-2 rounded font-semibold hover:bg-[#D4AF37] transition-colors">Login</a>
                </div>
            `;
            return this.init();
        }

        container.innerHTML = `
            <div class="p-4 md:p-8 max-w-[1600px] mx-auto font-['Inter']">
                <header class="mb-8 flex justify-between items-end border-b border-[#E9ECEF] pb-4">
                    <div>
                        <h1 class="text-3xl font-['Playfair_Display'] text-[#10263B] font-bold">${state.user.role === 'ADMIN' ? 'Admin Dashboard' : 'Reviewer Dashboard'}</h1>
                        <p class="text-[#61615F] mt-1">Manage applications and scholarship allocations</p>
                    </div>
                    <div class="text-sm font-semibold text-[#10263B] bg-[#F8F9FA] px-3 py-1 rounded border border-[#E9ECEF]">
                        Current Cycle: 2024/2025
                    </div>
                </header>

                <!-- Telegram Live Alerts Control Console -->
                <div class="p-5 rounded-lg shadow-sm border border-[#D50032] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style="background: linear-gradient(135deg, #021230 0%, #041E42 70%, #0A2E5C 100%); color: white;">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center text-2xl shrink-0 shadow-md">
                            ✈️
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-base text-white">Telegram Real-Time Dispatch Channel (@assistmetobot)</h3>
                                <span class="px-2 py-0.5 rounded text-xs font-bold bg-[#28A745] text-white">ACTIVE</span>
                            </div>
                            <p class="text-xs text-[#CBD2D9] mt-1">Live bot alert stream for student sign-ups, personal statements, and application submissions.</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <a href="https://t.me/assistmetobot" target="_blank" class="bg-[#0088cc] hover:bg-[#0077b5] text-white px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                            <span>🤖 Connect Bot (/start)</span>
                        </a>
                        <button id="tg-test-btn" class="bg-[#D50032] hover:bg-[#B30029] text-white px-4 py-2 rounded text-xs font-bold transition-all shadow-sm">
                            ⚡ Send Test Alert
                        </button>
                    </div>
                </div>

                <!-- Metrics Row -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-[#E9ECEF] relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div class="absolute right-[-10px] bottom-[-10px] text-7xl opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">📋</div>
                        <h3 class="text-[#61615F] text-xs font-bold uppercase tracking-wider mb-2">Total Applications</h3>
                        <div class="text-3xl font-['JetBrains_Mono'] text-[#10263B] font-bold mb-2 counter" data-target="1245">0</div>
                        <div class="text-[#28A745] text-xs font-semibold flex items-center gap-1">
                            <span class="bg-[#28A745]/20 text-[#28A745] px-1 rounded">↑</span> +12 this week
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-[#E9ECEF] relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div class="absolute right-[-10px] bottom-[-10px] text-7xl opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">💰</div>
                        <h3 class="text-[#61615F] text-xs font-bold uppercase tracking-wider mb-2">Total Funds Allocated</h3>
                        <div class="text-3xl font-['JetBrains_Mono'] text-[#10263B] font-bold mb-2">£<span class="counter" data-target="450000">0</span></div>
                        <div class="text-[#28A745] text-xs font-semibold flex items-center gap-1">
                            <span class="bg-[#28A745]/20 text-[#28A745] px-1 rounded">↑</span> +£50k this month
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-[#E9ECEF] relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div class="absolute right-[-10px] bottom-[-10px] text-7xl opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">⏳</div>
                        <h3 class="text-[#61615F] text-xs font-bold uppercase tracking-wider mb-2">Pending Reviews</h3>
                        <div class="text-3xl font-['JetBrains_Mono'] text-[#10263B] font-bold mb-2 counter" data-target="86">0</div>
                        <div class="text-[#DC3545] text-xs font-semibold flex items-center gap-1">
                            <span class="bg-[#DC3545]/20 text-[#DC3545] px-1 rounded">↓</span> -5 from yesterday
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-[#E9ECEF] relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div class="absolute right-[-10px] bottom-[-10px] text-7xl opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">🎓</div>
                        <h3 class="text-[#61615F] text-xs font-bold uppercase tracking-wider mb-2">Awarded This Cycle</h3>
                        <div class="text-3xl font-['JetBrains_Mono'] text-[#10263B] font-bold mb-2"><span class="counter" data-target="42">0</span> <span class="text-lg text-[#61615F] font-['Inter'] font-normal">(12%)</span></div>
                        <div class="text-[#28A745] text-xs font-semibold flex items-center gap-1">
                            <span class="bg-[#28A745]/20 text-[#28A745] px-1 rounded">↑</span> +2 this week
                        </div>
                    </div>
                </div>

                <!-- Quick Actions Bar -->
                <div class="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm border border-[#E9ECEF]">
                    <div class="flex gap-3">
                        <button id="add-scholarship-btn" class="bg-[#D4AF37] text-[#10263B] px-4 py-2 rounded font-bold hover:bg-[#F0D78C] transition-colors shadow-sm flex items-center gap-2">
                            <span>+</span> Add Scholarship
                        </button>
                        <button class="bg-white text-[#10263B] border border-[#E9ECEF] px-4 py-2 rounded font-semibold hover:bg-[#F8F9FA] transition-colors shadow-sm flex items-center gap-2">
                            <span>📥</span> Export Report
                        </button>
                    </div>
                    <div class="flex items-center gap-4 flex-1 justify-end min-w-[300px]">
                        <div class="relative w-full max-w-sm">
                            <input type="text" id="search-input" placeholder="Search applications by name or ID..." class="w-full pl-10 pr-4 py-2 rounded bg-[#F8F9FA] border border-[#E9ECEF] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all">
                            <span class="absolute left-3 top-2.5 text-[#61615F]">🔍</span>
                        </div>
                        <div class="flex bg-[#E9ECEF] rounded p-1">
                            <button id="view-kanban-btn" class="px-4 py-1.5 rounded bg-white shadow-sm font-semibold text-[#10263B] text-sm transition-all">Board View</button>
                            <button id="view-list-btn" class="px-4 py-1.5 rounded font-semibold text-[#61615F] hover:text-[#10263B] text-sm transition-all">List View</button>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col xl:flex-row gap-8">
                    <!-- Main Content Area -->
                    <div class="flex-1 min-w-0" id="main-content-area">
                        <!-- Kanban View -->
                        <div id="kanban-view" class="h-[calc(100vh-400px)] min-h-[600px] overflow-x-auto overflow-y-hidden pb-4">
                            <!-- Kanban will be injected here -->
                        </div>

                        <!-- List View (Hidden by default) -->
                        <div id="list-view" class="hidden bg-white rounded-lg shadow-sm border border-[#E9ECEF] overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr class="bg-[#F8F9FA] border-b border-[#E9ECEF] text-xs uppercase tracking-wider text-[#61615F]">
                                            <th class="p-4 font-bold cursor-pointer hover:bg-[#E9ECEF] transition-colors">Applicant ↕</th>
                                            <th class="p-4 font-bold cursor-pointer hover:bg-[#E9ECEF] transition-colors">Scholarship ↕</th>
                                            <th class="p-4 font-bold">Status</th>
                                            <th class="p-4 font-bold cursor-pointer hover:bg-[#E9ECEF] transition-colors">GPA/Score ↕</th>
                                            <th class="p-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="list-view-body">
                                        ${mockKanbanCards.map(c => `
                                            <tr class="border-b border-[#E9ECEF] hover:bg-[#F8F9FA] transition-colors group cursor-pointer" onclick="document.querySelector('.review-btn[data-id=\\'${c.id}\\']').click()">
                                                <td class="p-4 font-semibold text-[#10263B]">${c.title}</td>
                                                <td class="p-4 text-[#61615F]">${c.subtitle}</td>
                                                <td class="p-4">
                                                    <span class="px-2 py-1 rounded text-xs font-bold border 
                                                        ${c.status === 'Submitted' ? 'bg-[#17A2B8]/10 text-[#17A2B8] border-[#17A2B8]/20' : 
                                                          c.status === 'Under Review' ? 'bg-[#FD7E14]/10 text-[#FD7E14] border-[#FD7E14]/20' : 
                                                          c.status.includes('Decision') ? 'bg-[#28A745]/10 text-[#28A745] border-[#28A745]/20' : 
                                                          'bg-[#E9ECEF] text-[#61615F] border-[#61615F]/20'}">
                                                        ${c.status}
                                                    </span>
                                                </td>
                                                <td class="p-4 font-['JetBrains_Mono'] text-sm font-semibold">${c.extra}</td>
                                                <td class="p-4 text-right">
                                                    <button class="bg-[#10263B] text-white px-3 py-1 rounded text-sm font-semibold hover:bg-[#D4AF37] transition-colors review-btn" data-id="${c.id}" data-name="${c.title}" data-extra="${c.extra}" onclick="event.stopPropagation()">Review</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar: Recent Activity -->
                    <div class="w-full xl:w-80 bg-[#F8F9FA] rounded-lg shadow-inner border border-[#E9ECEF] p-5 self-start h-[calc(100vh-400px)] min-h-[600px] overflow-y-auto">
                        <h2 class="text-lg font-bold text-[#10263B] mb-5 flex items-center gap-2">
                            <span>⚡</span> Recent Activity
                        </h2>
                        <div class="relative border-l-2 border-[#E9ECEF] ml-3 pl-5 space-y-6">
                            <div class="relative">
                                <span class="absolute -left-[27px] bg-[#F0D78C] p-1.5 rounded-full text-[10px] border-4 border-[#F8F9FA]">📝</span>
                                <p class="text-sm text-[#10263B] mb-1">Dr. Chen reviewed <strong>Aisha Patel's</strong> application <span class="font-['JetBrains_Mono'] font-bold text-[#28A745]">(8.2)</span></p>
                                <span class="text-xs text-[#61615F] font-semibold">2 hours ago</span>
                            </div>
                            <div class="relative">
                                <span class="absolute -left-[27px] bg-[#FD7E14]/20 text-[#FD7E14] p-1.5 rounded-full text-[10px] border-4 border-[#F8F9FA]">🔄</span>
                                <p class="text-sm text-[#10263B] mb-1">Application from <strong>Marcus Johnson</strong> moved to <span class="text-[#FD7E14] font-semibold">Under Review</span></p>
                                <span class="text-xs text-[#61615F] font-semibold">4 hours ago</span>
                            </div>
                            <div class="relative">
                                <span class="absolute -left-[27px] bg-[#17A2B8]/20 text-[#17A2B8] p-1.5 rounded-full text-[10px] border-4 border-[#F8F9FA]">🆕</span>
                                <p class="text-sm text-[#10263B] mb-1">New application received for <strong>Developing Solutions</strong></p>
                                <span class="text-xs text-[#61615F] font-semibold">1 day ago</span>
                            </div>
                            <div class="relative">
                                <span class="absolute -left-[27px] bg-[#28A745]/20 text-[#28A745] p-1.5 rounded-full text-[10px] border-4 border-[#F8F9FA]">🎓</span>
                                <p class="text-sm text-[#10263B] mb-1"><strong>Sarah O'Brien</strong> awarded Dean's Scholarship <span class="text-[#28A745] font-bold">(£5,000)</span></p>
                                <span class="text-xs text-[#61615F] font-semibold">2 days ago</span>
                            </div>
                            <div class="relative">
                                <span class="absolute -left-[27px] bg-[#DC3545]/20 text-[#DC3545] p-1.5 rounded-full text-[10px] border-4 border-[#F8F9FA]">⚠️</span>
                                <p class="text-sm text-[#10263B] mb-1">Document re-upload requested for <strong>Li Wei</strong></p>
                                <span class="text-xs text-[#61615F] font-semibold">3 days ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.init();
    },

    init: function () {
        if (!state.user || (state.user.role !== 'ADMIN' && state.user.role !== 'REVIEWER')) return;

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

        // Telegram Live Test Alert Action
        const tgTestBtn = document.getElementById('tg-test-btn');
        tgTestBtn?.addEventListener('click', async () => {
            tgTestBtn.textContent = 'Sending...';
            try {
                const res = await sendTestMessage();
                if (res.ok) {
                    showToast('Live test alert successfully dispatched to Telegram! ✓', 'success');
                    tgTestBtn.textContent = '✓ Alert Sent';
                } else if (res.reason === 'NO_CHAT_ID') {
                    showToast('Please open https://t.me/smartscholarshipbot and click START first!', 'warning');
                    window.open(BOT_LINK, '_blank');
                    tgTestBtn.textContent = '⚡ Send Test Alert';
                } else {
                    showToast(`Telegram status: ${res.reason}`, 'info');
                    tgTestBtn.textContent = '⚡ Send Test Alert';
                }
            } catch (err) {
                showToast(`Telegram alert error: ${err.message}`, 'error');
                tgTestBtn.textContent = '⚡ Send Test Alert';
            }
            setTimeout(() => { if (tgTestBtn) tgTestBtn.textContent = '⚡ Send Test Alert'; }, 3500);
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
        const columns = [
            { id: 'col-submitted', title: 'Submitted', color: '#17A2B8', cards: mockKanbanCards.filter(c => c.status === 'Submitted') },
            { id: 'col-shortlisted', title: 'Shortlisted', color: '#FFC107', cards: mockKanbanCards.filter(c => c.status === 'Shortlisted') },
            { id: 'col-review', title: 'Under Review', color: '#FD7E14', cards: mockKanbanCards.filter(c => c.status === 'Under Review') },
            { id: 'col-interview', title: 'Interviewing', color: '#D4AF37', cards: mockKanbanCards.filter(c => c.status === 'Interviewing') },
            { id: 'col-decision', title: 'Decision Made', color: '#28A745', cards: mockKanbanCards.filter(c => c.status.includes('Decision Made')) }
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
