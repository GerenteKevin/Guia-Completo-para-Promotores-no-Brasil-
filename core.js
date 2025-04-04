import { getKnowledgeBase, saveKnowledgeBaseToFirebase } from './auth.js';

function addKnowledgeItem(item) {
    if (!item.category) {
        throw new Error('必须选择分类');
    }
    
    const knowledgeBase = getKnowledgeBase();
    const newId = knowledgeBase.items.length > 0 ? 
        Math.max(...knowledgeBase.items.map(i => i.id)) + 1 : 1;
    
    const newItem = { id: newId, ...item };
    knowledgeBase.items.push(newItem);
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return newItem;
}

function updateKnowledgeItem(id, updates) {
    const knowledgeBase = getKnowledgeBase();
    const index = knowledgeBase.items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    knowledgeBase.items[index] = { ...knowledgeBase.items[index], ...updates };
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return knowledgeBase.items[index];
}

function deleteKnowledgeItem(id) {
    const knowledgeBase = getKnowledgeBase();
    const index = knowledgeBase.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    knowledgeBase.items.splice(index, 1);
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return true;
}

function getKnowledgeItem(id) {
    return getKnowledgeBase().items.find(item => item.id === id);
}

function getAllKnowledgeItems(filterCategory = null) {
    const items = getKnowledgeBase().items;
    return filterCategory 
        ? items.filter(item => item.category === filterCategory)
        : items;
}

function getAllCategories() {
    return getKnowledgeBase().categories;
}

function addAnnouncement(announcement) {
    if (!announcement.title || !announcement.content) {
        throw new Error('标题和内容为必填项');
    }
    
    const knowledgeBase = getKnowledgeBase();
    const newId = knowledgeBase.announcements.length > 0 ? 
        Math.max(...knowledgeBase.announcements.map(a => a.id)) + 1 : 1;
    
    const newAnnouncement = { 
        id: newId,
        ...announcement,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    knowledgeBase.announcements.push(newAnnouncement);
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return newAnnouncement;
}

function updateAnnouncement(id, updates) {
    const knowledgeBase = getKnowledgeBase();
    const index = knowledgeBase.announcements.findIndex(a => a.id === id);
    
    if (index === -1) {
        throw new Error('公告不存在');
    }
    
    knowledgeBase.announcements[index] = { 
        ...knowledgeBase.announcements[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return knowledgeBase.announcements[index];
}

function deleteAnnouncement(id) {
    const knowledgeBase = getKnowledgeBase();
    const index = knowledgeBase.announcements.findIndex(a => a.id === id);
    
    if (index === -1) {
        throw new Error('公告不存在');
    }
    
    knowledgeBase.announcements.splice(index, 1);
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return true;
}

function getAllAnnouncements() {
    const announcements = getKnowledgeBase().announcements;
    return announcements.length > 0 
        ? announcements.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
}

export {
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    getKnowledgeItem,
    getAllKnowledgeItems,
    getAllCategories,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAllAnnouncements
};