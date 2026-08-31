export function renderKanban(containerId, columns, onCardMove) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `<div class="kanban-board">`;
    columns.forEach(col => {
        html += `
            <div class="kanban-column" data-col-id="${col.id}" style="border-top-color: ${col.color}">
                <div class="kanban-column-header">
                    <h3>${col.title}</h3>
                    <span class="kanban-badge" style="background-color: ${col.color}">${col.cards.length}</span>
                </div>
                <div class="kanban-cards">
                    ${col.cards.map(card => `
                        <div class="kanban-card" draggable="true" data-card-id="${card.id}" data-col-id="${col.id}">
                            <h4>${card.title}</h4>
                            <p>${card.subtitle}</p>
                            <div class="kanban-card-footer">
                                <div class="kanban-card-badges">
                                    ${(card.badges || []).map(b => `<span class="badge">${b}</span>`).join('')}
                                </div>
                                ${card.score ? `<span class="kanban-score">${card.score}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;

    initKanban(container, onCardMove);
}

export function initKanban(container, onCardMove) {
    const cards = container.querySelectorAll('.kanban-card');
    const columns = container.querySelectorAll('.kanban-column');
    
    let draggedCard = null;
    let sourceColId = null;

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            sourceColId = card.getAttribute('data-col-id');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.getAttribute('data-card-id'));
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            if(draggedCard) draggedCard.classList.remove('dragging');
            draggedCard = null;
            columns.forEach(c => c.classList.remove('drag-over'));
        });
    });

    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (col.getAttribute('data-col-id') !== sourceColId) {
                col.classList.add('drag-over');
            }
        });

        col.addEventListener('dragleave', () => {
            col.classList.remove('drag-over');
        });

        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            
            const cardId = e.dataTransfer.getData('text/plain');
            const targetColId = col.getAttribute('data-col-id');
            
            if (sourceColId && targetColId && sourceColId !== targetColId) {
                if (onCardMove) {
                    onCardMove(cardId, sourceColId, targetColId);
                }
            }
        });
    });
}

export default {
    renderKanban,
    initKanban,
    init: function(container, columns, options = {}) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;
        if (!el.id) el.id = 'kanban-view';
        renderKanban(el.id, columns, options.onCardMove);
    }
};
