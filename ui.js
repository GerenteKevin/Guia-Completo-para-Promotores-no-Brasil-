import { 
    verifyPassword, 
    changePassword, 
    toggleEditMode, 
    isEditMode,
    getKnowledgeBase,
    loadKnowledgeBaseFromFirebase,
    setupRealtimeListener,
    addCategory,
    deleteCategory
} from './auth.js';
import { 
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
} from './core.js';
import { openKnowledgeModal } from './main.js';

const elements = {
    addKnowledgeBtn: document.getElementById('addKnowledgeBtn'),
    addAnnouncementBtn: document.getElementById('addAnnouncementBtn'),
    changePasswordBtn: document.getElementById('changePasswordBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    announcementsList: document.getElementById('announcementsList'),
    announcementNavDots: document.getElementById('announcementNavDots'),
    manageCategoriesBtn: document.getElementById('manageCategoriesBtn'),
    knowledgeItemsContainer: document.getElementById('knowledgeItems'),
    categoryTabsContainer: document.getElementById('categoryTabs'),
    searchInput: document.getElementById('search'),
    clearSearchBtn: document.getElementById('clearSearch'),
    searchResultsContainer: document.getElementById('searchResults'),
    knowledgeModal: document.getElementById('knowledgeModal'),
    closeModal: document.getElementById('closeModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    editKnowledgeModal: document.getElementById('editKnowledgeModal'),
    closeEditModal: document.getElementById('closeEditModal'),
    knowledgeForm: document.getElementById('knowledgeForm'),
    passwordModal: document.getElementById('passwordModal'),
    closePasswordModal: document.getElementById('closePasswordModal'),
    passwordForm: document.getElementById('passwordForm'),
    passwordInput: document.getElementById('passwordInput'),
    newPasswordInput: document.getElementById('newPasswordInput'),
    confirmPasswordInput: document.getElementById('confirmPasswordInput'),
    newPasswordGroup: document.getElementById('newPasswordGroup'),
    confirmPasswordGroup: document.getElementById('confirmPasswordGroup'),
    passwordSubmitBtn: document.getElementById('passwordSubmitBtn'),
    passwordModalTitle: document.getElementById('passwordModalTitle'),
    announcementModal: document.getElementById('announcementModal'),
    closeAnnouncementModal: document.getElementById('closeAnnouncementModal'),
    announcementForm: document.getElementById('announcementForm'),
    announcementImageInput: document.getElementById('announcementImage'),
    imagePreview: document.getElementById('imagePreview'),
    announcementNavPrev: document.querySelector('.announcement-nav-prev'),
    announcementNavNext: document.querySelector('.announcement-nav-next')
};

// 检测移动设备
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

// 在 setupAnnouncementNavigation 函数中添加箭头导航功能
function setupAnnouncementNavigation() {
    const list = document.getElementById('announcementsList');
    const cards = document.querySelectorAll('.announcement-card');
    const dotsContainer = document.getElementById('announcementNavDots');
    
    if (cards.length === 0) return;

    // 创建导航点
    dotsContainer.innerHTML = Array.from(cards).map((_, index) => 
        `<div class="nav-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
    ).join('');

    // 导航点点击事件
    document.querySelectorAll('.nav-dot').forEach(dot => {
        dot.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            scrollToCard(index);
            updateActiveDot(index);
        });
    });

    // 左箭头点击事件
    elements.announcementNavPrev.addEventListener('click', () => {
        const currentIndex = getCurrentVisibleCardIndex();
        if (currentIndex > 0) {
            scrollToCard(currentIndex - 1);
        }
    });

    // 右箭头点击事件
    elements.announcementNavNext.addEventListener('click', () => {
        const currentIndex = getCurrentVisibleCardIndex();
        if (currentIndex < cards.length - 1) {
            scrollToCard(currentIndex + 1);
        }
    });

    // 观察卡片可见性
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeIndex = parseInt(entry.target.dataset.index);
                updateActiveDot(activeIndex);
            }
        });
    }, {
        threshold: 0.7,
        root: list
    });

    // 为每个卡片添加索引并观察
    Array.from(cards).forEach((card, index) => {
        card.dataset.index = index;
        observer.observe(card);
    });

    // 滚动到指定卡片
    function scrollToCard(index) {
        if (index >= 0 && index < cards.length) {
            cards[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'start'
            });
            updateActiveDot(index);
        }
    }

    // 更新活动导航点
    function updateActiveDot(index) {
        document.querySelectorAll('.nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
}

function renderAnnouncements() {
    const announcements = getAllAnnouncements();
    
    if (announcements.length === 0) {
        elements.announcementsList.innerHTML = `
            <div class="empty-announcement">
                <i class="fas fa-info-circle"></i>
                暂无公告，${isEditMode ? '点击底部按钮添加' : '请等待管理员发布'}
            </div>
        `;
        elements.announcementNavDots.innerHTML = '';
        return;
    }

    elements.announcementsList.innerHTML = announcements.map((ann, index) => `
        <div class="announcement-card" data-id="${ann.id}" data-index="${index}">
            ${ann.image ? `
            <div class="announcement-image">
                <img src="${ann.image}" alt="${ann.title}">
                ${ann.badge ? `<span class="announcement-badge ${ann.badge}">${getBadgeText(ann.badge)}</span>` : ''}
            </div>` : ''}
            <div class="announcement-content">
                <p class="announcement-title">${ann.title}</p>
                <div class="announcement-excerpt">
                    ${ann.content.substring(0, 100)}${ann.content.length > 100 ? '...' : ''}
                </div>
                ${isEditMode ? `
                <div class="announcement-actions">
                    <button class="btn-icon edit-announcement" data-id="${ann.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-announcement" data-id="${ann.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>` : ''}
            </div>
        </div>
    `).join('');

    // 添加事件监听
    document.querySelectorAll('.edit-announcement').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            openAnnouncementModal(id);
        });
    });

    document.querySelectorAll('.delete-announcement').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('确定要删除此公告吗？')) {
                await deleteAnnouncement(parseInt(btn.dataset.id));
                renderAnnouncements();
            }
        });
    });

    // 添加公告卡片交互事件
    document.querySelectorAll('.announcement-card').forEach(card => {
        const announcement = announcements.find(a => a.id === parseInt(card.dataset.id));
        
        if (isMobileDevice()) {
            // 移动端长按显示内容
            let pressTimer;
            
            card.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    card.querySelector('.announcement-excerpt').innerHTML = 
                        `<p>${announcement.content.substring(0, 100)}${announcement.content.length > 100 ? '...' : ''}</p>`;
                }, 500);
            });
            
            card.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });
            
            card.addEventListener('touchmove', () => {
                clearTimeout(pressTimer);
            });
        } else {
            // 桌面端hover显示内容
            card.addEventListener('mouseenter', () => {
                card.querySelector('.announcement-excerpt').innerHTML = 
                    `<p>${announcement.content.substring(0, 100)}${announcement.content.length > 100 ? '...' : ''}</p>`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.querySelector('.announcement-excerpt').innerHTML = '';
            });
        }

        // 点击跳转链接
        if (announcement?.link) {
            card.addEventListener('click', () => {
                window.open(announcement.link, '_blank');
            });
        }
    });

    // 添加导航箭头事件
    elements.announcementNavPrev.addEventListener('click', () => {
        const currentIndex = getCurrentVisibleCardIndex();
        if (currentIndex > 0) {
            scrollToCard(currentIndex - 1);
        }
    });

    elements.announcementNavNext.addEventListener('click', () => {
        const currentIndex = getCurrentVisibleCardIndex();
        if (currentIndex < announcements.length - 1) {
            scrollToCard(currentIndex + 1);
        }
    });

    setupAnnouncementNavigation();
}

function getBadgeText(badgeType) {
    switch(badgeType) {
        case 'urgent': return '紧急';
        case 'warning': return '警告';
        case 'info': return '信息';
        default: return '';
    }
}

function getCurrentVisibleCardIndex() {
    const list = document.getElementById('announcementsList');
    const cards = document.querySelectorAll('.announcement-card');
    
    for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        
        if (rect.left >= listRect.left && rect.right <= listRect.right) {
            return i;
        }
    }
    return 0;
}

function renderKnowledgeItems(category = null) {
    const items = getAllKnowledgeItems(category);
    if (items.length === 0) {
        elements.knowledgeItemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>${category ? `当前分类"${category}"下没有知识条目` : '知识库中还没有内容'}</p>
                ${isEditMode ? '<p>点击右下角"+"按钮添加新知识</p>' : ''}
            </div>
        `;
        return;
    }

    elements.knowledgeItemsContainer.innerHTML = items.map(item => `
        <div class="knowledge-item" data-id="${item.id}">
            ${item.badge ? `<span class="item-badge ${item.badge}">${getBadgeText(item.badge)}</span>` : ''}
            <div class="item-header">
                <h3>${item.title}</h3>
            </div>
            <div class="item-body">
                <div class="item-meta">
                    <span class="item-category">${item.category}</span>
                    ${item.tags && item.tags.length > 0 ? `
                    <div class="item-tags">
                        ${item.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                    </div>` : ''}
                </div>
            </div>
            ${isEditMode ? `
            <div class="item-actions">
                <button class="btn-icon edit-btn" data-id="${item.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>` : ''}
        </div>
    `).join('');

    // 添加编辑和删除事件
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            openEditModal(getKnowledgeItem(id));
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('确定要删除此条目吗？')) {
                await deleteKnowledgeItem(parseInt(btn.dataset.id));
                renderKnowledgeItems(category);
                renderCategoryTabs();
            }
        });
    });
}

function renderCategoryTabs() {
    const categories = getAllCategories();
    const categoryCounts = {};
    getAllKnowledgeItems().forEach(item => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
    
    elements.categoryTabsContainer.innerHTML = `
        <div class="category-tab active" data-category="全部">全部 (${getKnowledgeBase().items.length})</div>
        ${categories.map(category => `
            <div class="category-tab" data-category="${category}">
                ${category} (${categoryCounts[category] || 0})
            </div>
        `).join('')}
    `;
    
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.dataset.category === "全部" ? null : tab.dataset.category;
            renderKnowledgeItems(category);
        });
    });
}

async function init() {
    try {
        await loadKnowledgeBaseFromFirebase();
        renderAnnouncements();
        renderKnowledgeItems();
        renderCategoryTabs();
        setupEventListeners();
        
        setupRealtimeListener(() => {
            renderAnnouncements();
            renderKnowledgeItems();
            renderCategoryTabs();
        });
        
        updateUIForEditMode();
    } catch (error) {
        console.error('初始化错误:', error);
        alert('初始化失败: ' + error.message);
    }
}

function setupEventListeners() {
    elements.addKnowledgeBtn.addEventListener('click', onAddKnowledgeClick);
    elements.addAnnouncementBtn.addEventListener('click', onAddAnnouncementClick);
    elements.changePasswordBtn.addEventListener('click', onChangePasswordClick);
    elements.logoutBtn.addEventListener('click', onLogoutClick);
    elements.closeModal.addEventListener('click', closeKnowledgeModal);
    elements.closeEditModal.addEventListener('click', closeEditModal);
    elements.closePasswordModal.addEventListener('click', closePasswordModal);
    elements.closeAnnouncementModal.addEventListener('click', closeAnnouncementModal);
    elements.knowledgeForm.addEventListener('submit', onKnowledgeFormSubmit);
    elements.passwordForm.addEventListener('submit', onPasswordSubmit);
    elements.announcementForm.addEventListener('submit', onAnnouncementFormSubmit);
    elements.manageCategoriesBtn.addEventListener('click', openCategoryManagementModal);
    elements.searchInput.addEventListener('input', onSearchInput);
    elements.clearSearchBtn.addEventListener('click', onClearSearchClick);
    
    // 图片上传预览
    elements.announcementImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                elements.imagePreview.src = event.target.result;
                elements.imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === elements.knowledgeModal) closeKnowledgeModal();
        if (e.target === elements.editKnowledgeModal) closeEditModal();
        if (e.target === elements.passwordModal) closePasswordModal();
        if (e.target === elements.announcementModal) closeAnnouncementModal();
    });
    
    document.addEventListener('knowledgeModalOpened', (e) => {
        const item = getKnowledgeItem(e.detail.id);
        if (!item) return;
        
        elements.modalTitle.textContent = item.title;
        elements.modalBody.innerHTML = `
            <div class="modal-meta">
                <span class="modal-category">${item.category}</span>
                ${item.tags && item.tags.length > 0 ? `
                <div class="modal-tags">
                    ${item.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('')}
                </div>` : ''}
            </div>
            <div class="modal-content-text">
                ${item.content}
            </div>
            ${isEditMode ? `
            <div class="modal-actions">
                <button class="btn edit-from-modal" data-id="${item.id}" style="margin-right: 10px;">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-danger delete-from-modal" data-id="${item.id}">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>` : ''}
        `;
        
        if (isEditMode) {
            document.querySelector('.edit-from-modal').addEventListener('click', (e) => {
                e.preventDefault();
                closeKnowledgeModal();
                openEditModal(item);
            });
            
            document.querySelector('.delete-from-modal').addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('确定要删除此条目吗？')) {
                    deleteKnowledgeItem(item.id);
                    closeKnowledgeModal();
                    renderKnowledgeItems();
                    renderCategoryTabs();
                }
            });
        }
    });
}

function closeKnowledgeModal() {
    elements.knowledgeModal.style.display = 'none';
}

function openEditModal(item = null) {
    elements.editKnowledgeModal.style.display = 'block';
    elements.knowledgeForm.reset();
    
    const categorySelect = document.getElementById('knowledgeCategory');
    categorySelect.innerHTML = `
        <option value="">-- 请选择分类 --</option>
        ${getAllCategories().map(category => `
            <option value="${category}">${category}</option>
        `).join('')}
    `;
    
    if (item) {
        document.getElementById('editModalTitle').textContent = '编辑知识';
        document.getElementById('knowledgeId').value = item.id;
        document.getElementById('knowledgeTitle').value = item.title;
        document.getElementById('knowledgeCategory').value = item.category;
        document.getElementById('knowledgeTags').value = item.tags ? item.tags.join(', ') : '';
        document.getElementById('knowledgeContent').value = item.content;
        document.getElementById('knowledgeBadge').value = item.badge || '';
    } else {
        document.getElementById('editModalTitle').textContent = '添加新知识';
    }
}

function closeEditModal() {
    elements.editKnowledgeModal.style.display = 'none';
}

function openAnnouncementModal(id = null) {
    elements.announcementModal.style.display = 'block';
    elements.announcementForm.reset();
    elements.imagePreview.style.display = 'none';
    elements.imagePreview.src = '';
    
    if (id) {
        const announcement = getAllAnnouncements().find(a => a.id === id);
        if (announcement) {
            document.getElementById('announcementModalTitle').textContent = '编辑公告';
            document.getElementById('announcementId').value = announcement.id;
            document.getElementById('announcementTitle').value = announcement.title;
            document.getElementById('announcementLink').value = announcement.link || '';
            document.getElementById('announcementContent').value = announcement.content;
            document.getElementById('announcementBadge').value = announcement.badge || '';
            
            if (announcement.image) {
                elements.imagePreview.src = announcement.image;
                elements.imagePreview.style.display = 'block';
            }
        }
    } else {
        document.getElementById('announcementModalTitle').textContent = '添加新公告';
    }
}

function closeAnnouncementModal() {
    elements.announcementModal.style.display = 'none';
}

function openPasswordModal(isChangePassword = false) {
    elements.passwordModalTitle.textContent = isChangePassword ? '修改密码' : '请输入编辑密码';
    elements.newPasswordGroup.style.display = isChangePassword ? 'block' : 'none';
    elements.confirmPasswordGroup.style.display = isChangePassword ? 'block' : 'none';
    elements.passwordSubmitBtn.textContent = isChangePassword ? '修改密码' : '验证';
    elements.passwordModal.style.display = 'block';
}

function closePasswordModal() {
    elements.passwordModal.style.display = 'none';
    elements.passwordForm.reset();
}

function onAddKnowledgeClick() {
    if (!isEditMode) {
        openPasswordModal(false);
        return;
    }
    openEditModal();
}

function onAddAnnouncementClick() {
    if (!isEditMode) {
        openPasswordModal(false);
        return;
    }
    openAnnouncementModal();
}

function onChangePasswordClick() {
    openPasswordModal(true);
}

async function onPasswordSubmit(e) {
    e.preventDefault();
    
    try {
        const password = elements.passwordInput.value;
        const isChangePassword = elements.newPasswordGroup.style.display === 'block';
        
        if (isChangePassword) {
            const newPassword = elements.newPasswordInput.value;
            const confirmPassword = elements.confirmPasswordInput.value;
            
            if (newPassword !== confirmPassword) {
                throw new Error('新密码与确认密码不一致');
            }
            
            await changePassword(password, newPassword);
            alert('密码修改成功');
        } else {
            const isValid = await verifyPassword(password);
            if (!isValid) {
                throw new Error('密码错误');
            }
            
            toggleEditMode(true);
            updateUIForEditMode();
        }
        
        closePasswordModal();
    } catch (error) {
        alert(error.message);
    }
}

function onKnowledgeFormSubmit(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('knowledgeId').value;
        const title = document.getElementById('knowledgeTitle').value;
        const category = document.getElementById('knowledgeCategory').value;
        const tags = document.getElementById('knowledgeTags').value.split(',').map(t => t.trim()).filter(t => t);
        const content = document.getElementById('knowledgeContent').value;
        const badge = document.getElementById('knowledgeBadge').value;
        
        if (!title || !category || !content) {
            throw new Error('请填写所有必填字段');
        }
        
        const itemData = { title, category, tags, content };
        if (badge) itemData.badge = badge;
        
        if (id) {
            updateKnowledgeItem(Number(id), itemData);
        } else {
            addKnowledgeItem(itemData);
        }
        
        closeEditModal();
        renderKnowledgeItems();
        renderCategoryTabs();
    } catch (error) {
        alert(error.message);
    }
}

async function onAnnouncementFormSubmit(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('announcementId').value;
        const title = document.getElementById('announcementTitle').value;
        const link = document.getElementById('announcementLink').value;
        const imageFile = elements.announcementImageInput.files[0];
        const content = document.getElementById('announcementContent').value;
        const badge = document.getElementById('announcementBadge').value;
        
        if (!title || !content) {
            throw new Error('标题和内容为必填项');
        }
        
        // 如果有新图片上传，读取为DataURL
        let imageDataUrl = '';
        if (imageFile) {
            imageDataUrl = await readFileAsDataURL(imageFile);
        } else if (id) {
            // 如果是编辑且没有新图片，保留原有图片
            const existingAnnouncement = getAllAnnouncements().find(a => a.id === parseInt(id));
            if (existingAnnouncement?.image) {
                imageDataUrl = existingAnnouncement.image;
            }
        }
        
        const announcementData = { 
            title, 
            content,
            ...(badge && { badge }),
            ...(link && { link }),
            ...(imageDataUrl && { image: imageDataUrl })
        };
        
        if (id) {
            await updateAnnouncement(parseInt(id), announcementData);
        } else {
            await addAnnouncement(announcementData);
        }
        
        renderAnnouncements();
        closeAnnouncementModal();
    } catch (error) {
        alert(error.message);
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function onLogoutClick() {
    toggleEditMode(false);
    updateUIForEditMode();
}

function updateUIForEditMode() {
    elements.changePasswordBtn.style.display = isEditMode ? 'flex' : 'none';
    elements.logoutBtn.style.display = isEditMode ? 'flex' : 'none';
    elements.manageCategoriesBtn.style.display = isEditMode ? 'flex' : 'none';
    elements.addAnnouncementBtn.style.display = isEditMode ? 'flex' : 'none';
    renderKnowledgeItems();
    renderAnnouncements();
}

function openCategoryManagementModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>管理分类</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="newCategoryName">添加新分类</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="newCategoryName" class="form-control" placeholder="输入分类名称">
                        <button id="addCategoryBtn" class="btn">添加</button>
                    </div>
                </div>
                <div class="category-list" style="margin-top: 20px;">
                    <h3>现有分类</h3>
                    <ul id="categoriesList" style="list-style: none; padding: 0; margin-top: 10px;"></ul>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    const categoriesList = modal.querySelector('#categoriesList');
    renderCategoriesList(categoriesList);
    
    modal.querySelector('#addCategoryBtn').addEventListener('click', async () => {
        const nameInput = modal.querySelector('#newCategoryName');
        const name = nameInput.value.trim();
        
        try {
            await addCategory(name);
            nameInput.value = '';
            renderCategoriesList(categoriesList);
            renderCategoryTabs();
        } catch (error) {
            alert(error.message);
        }
    });
}

function renderCategoriesList(container) {
    const categories = getAllCategories();
    container.innerHTML = categories.map(category => `
        <li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <span>${category}</span>
            <button class="btn delete-category-btn" data-category="${category}" style="padding: 5px 10px; background-color: var(--danger-color);">
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
    
    container.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const category = btn.dataset.category;
            if (confirm(`确定要删除分类 "${category}" 吗？`)) {
                try {
                    await deleteCategory(category);
                    renderCategoriesList(container);
                    renderCategoryTabs();
                    renderKnowledgeItems();
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    });
}

function onSearchInput(e) {
    const query = e.target.value.toLowerCase().trim();
    elements.clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
    
    if (query.length < 2) {
        elements.searchResultsContainer.style.display = 'none';
        return;
    }
    
    const results = getAllKnowledgeItems().filter(item => 
        item.title.toLowerCase().includes(query) || 
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
    );
    
    if (results.length > 0) {
        elements.searchResultsContainer.innerHTML = results.map(item => `
            <div class="search-result-item" data-id="${item.id}">
                <h4>${item.title}</h4>
                <div>
                    <span class="search-result-category">${item.category}</span>
                    ${item.tags && item.tags.length > 0 ? `
                    <div class="search-result-tags">
                        ${item.tags.map(tag => `<span class="search-result-tag">${tag}</span>`).join('')}
                    </div>` : ''}
                </div>
            </div>
        `).join('');
        
        elements.searchResultsContainer.style.display = 'block';
        
        // 确保搜索结果不被公告栏盖住
        elements.searchResultsContainer.style.zIndex = '100';
        elements.searchResultsContainer.style.position = 'absolute';
        elements.searchResultsContainer.style.background = 'white';
        elements.searchResultsContainer.style.width = 'calc(100% - 30px)';
        elements.searchResultsContainer.style.marginTop = '5px';
        
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                openKnowledgeModal(id);
                elements.searchResultsContainer.style.display = 'none';
                elements.searchInput.value = '';
                elements.clearSearchBtn.style.display = 'none';
            });
        });
    } else {
        elements.searchResultsContainer.innerHTML = '<div class="search-result-item">没有找到匹配的结果</div>';
        elements.searchResultsContainer.style.display = 'block';
    }
}

function onClearSearchClick() {
    elements.searchInput.value = '';
    elements.searchResultsContainer.style.display = 'none';
    elements.clearSearchBtn.style.display = 'none';
}

export { init };