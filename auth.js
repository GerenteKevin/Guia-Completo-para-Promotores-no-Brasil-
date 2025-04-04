import { sha256 } from './utils.js';

let _knowledgeBase = {
    passwordHash: "",
    items: [],
    categories: [],
    announcements: []
};

let isEditMode = false;

async function initializeDefaultData() {
    if (!_knowledgeBase.passwordHash) {
        _knowledgeBase.passwordHash = await sha256("admin123");
        await saveKnowledgeBaseToFirebase(_knowledgeBase);
    }
}

async function loadKnowledgeBaseFromFirebase() {
    return new Promise((resolve) => {
        const dbRef = window.firebase.ref(window.firebase.database, 'knowledgeBase');
        window.firebase.onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                // 转换对象为数组
                if (data.announcements && typeof data.announcements === 'object') {
                    data.announcements = Object.values(data.announcements);
                }
                if (data.items && typeof data.items === 'object') {
                    data.items = Object.values(data.items);
                }
                if (data.categories && typeof data.categories === 'object') {
                    data.categories = Object.values(data.categories);
                }
                Object.assign(_knowledgeBase, data);
            }
            initializeDefaultData().then(resolve);
        });
    });
}
async function saveKnowledgeBaseToFirebase(data) {
    try {
        const dbRef = window.firebase.ref(window.firebase.database, 'knowledgeBase');
        await window.firebase.set(dbRef, data);
        return true;
    } catch (error) {
        console.error("保存失败:", error);
        return false;
    }
}

function setupRealtimeListener(callback) {
    const dbRef = window.firebase.ref(window.firebase.database, 'knowledgeBase');
    window.firebase.onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // 转换对象为数组
            if (data.announcements && typeof data.announcements === 'object') {
                data.announcements = Object.values(data.announcements);
            }
            if (data.items && typeof data.items === 'object') {
                data.items = Object.values(data.items);
            }
            if (data.categories && typeof data.categories === 'object') {
                data.categories = Object.values(data.categories);
            }
            Object.assign(_knowledgeBase, data);
            if (callback) callback();
        }
    });
}

async function verifyPassword(password) {
    const passwordHash = await sha256(password);
    return passwordHash === _knowledgeBase.passwordHash;
}

async function changePassword(currentPassword, newPassword) {
    if (!await verifyPassword(currentPassword)) {
        throw new Error('当前密码错误');
    }
    
    if (newPassword.length < 6) {
        throw new Error('密码长度至少为6位');
    }
    
    _knowledgeBase.passwordHash = await sha256(newPassword);
    await saveKnowledgeBaseToFirebase(_knowledgeBase);
}

function toggleEditMode(enable) {
    isEditMode = enable;
    return isEditMode;
}

function getKnowledgeBase() {
    return _knowledgeBase;
}

async function addCategory(categoryName) {
    if (!categoryName.trim()) {
        throw new Error('分类名称不能为空');
    }
    
    if (_knowledgeBase.categories.includes(categoryName)) {
        throw new Error('分类已存在');
    }
    
    _knowledgeBase.categories.push(categoryName);
    await saveKnowledgeBaseToFirebase(_knowledgeBase);
}

async function deleteCategory(categoryName) {
    if (!_knowledgeBase.categories.includes(categoryName)) {
        throw new Error('分类不存在');
    }
    
    const itemsWithCategory = _knowledgeBase.items.filter(item => item.category === categoryName);
    if (itemsWithCategory.length > 0) {
        throw new Error('该分类下有知识条目，无法删除');
    }
    
    _knowledgeBase.categories = _knowledgeBase.categories.filter(cat => cat !== categoryName);
    await saveKnowledgeBaseToFirebase(_knowledgeBase);
}

export { 
    _knowledgeBase as knowledgeBase,
    isEditMode,
    verifyPassword,
    changePassword,
    toggleEditMode,
    loadKnowledgeBaseFromFirebase,
    saveKnowledgeBaseToFirebase,
    setupRealtimeListener,
    getKnowledgeBase,
    addCategory,
    deleteCategory
};