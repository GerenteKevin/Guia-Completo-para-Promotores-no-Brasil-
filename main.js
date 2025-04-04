import { init } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    await init();
    
    document.getElementById('knowledgeItems').addEventListener('click', (e) => {
        const item = e.target.closest('.knowledge-item');
        if (item && !e.target.closest('.item-actions')) {
            const id = parseInt(item.getAttribute('data-id'));
            openKnowledgeModal(id);
        }
    });
});

function openKnowledgeModal(id) {
    const modal = document.getElementById('knowledgeModal');
    modal.style.display = 'block';
    
    const event = new CustomEvent('knowledgeModalOpened', { detail: { id } });
    document.dispatchEvent(event);
}

export { openKnowledgeModal };