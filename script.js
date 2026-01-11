// عناصر DOM
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const emptyMessage = document.getElementById('emptyMessage');
const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
const categoryFilterBtns = document.querySelectorAll('.filter-btn[data-category]');
const darkModeBtn = document.getElementById('darkModeBtn');
const undoToast = document.getElementById('undoToast');
const bulkActions = document.getElementById('bulkActions');
const selectedCount = document.getElementById('selectedCount');

// المتغيرات
let tasks = [];
let currentFilter = 'all';
let currentCategory = 'all';
let editingTaskId = null;
let deletedTask = null;
let deleteTimeout = null;

// تهيئة التطبيق
function init() {
    loadTasks();
    loadDarkMode();
    updateStats();
    updateProgress();
    setupEventListeners();
    showWelcomeMessage();
}

// تحميل الوضع الداكن
function loadDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', darkMode);
    updateDarkModeIcon();
}

// حفظ الوضع الداكن
function saveDarkMode() {
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// تبديل الوضع الداكن
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    saveDarkMode();
    updateDarkModeIcon();
}

// تحديث أيقونة الوضع الداكن
function updateDarkModeIcon() {
    const icon = darkModeBtn.querySelector('.mode-icon');
    if (document.body.classList.contains('dark-mode')) {
        icon.textContent = '☀️';
    } else {
        icon.textContent = '🌙';
    }
}

// حفظ المهام في التخزين المحلي
function saveTasks() {
    localStorage.setItem('enhancedTasks', JSON.stringify(tasks));
}

// تحميل المهام من التخزين المحلي
function loadTasks() {
    const savedTasks = localStorage.getItem('enhancedTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    renderTasks();
}

// إضافة مهمة جديدة
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        showNotification('الرجاء إدخال نص المهمة', 'error');
        return;
    }
    
    if (taskText.length > 100) {
        showNotification('المهمة طويلة جداً (الحد الأقصى 100 حرف)', 'error');
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        category: categorySelect.value,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || null,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
    updateProgress();
    
    // إعادة تعيين الحقول
    taskInput.value = '';
    dueDateInput.value = '';
    categorySelect.value = 'work';
    prioritySelect.value = 'normal';
    taskInput.focus();
    
    showNotification('تمت إضافة المهمة بنجاح', 'success');
}

// تبديل حالة المهمة
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        
        if (task.completed) {
            showNotification('تم إنجاز المهمة! 🎉', 'success');
        }
    }
}

// حذف مهمة
function deleteTask(id, undoable = true) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        if (undoable) {
            deletedTask = { ...task, index: tasks.findIndex(t => t.id === id) };
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            updateProgress();
            showUndoToast();
        } else {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            updateProgress();
            showNotification('تم حذف المهمة', 'info');
        }
    }
}

// إظهار إشعار التراجع عن الحذف
function showUndoToast() {
    undoToast.classList.add('visible');
    
    if (deleteTimeout) {
        clearTimeout(deleteTimeout);
    }
    
    deleteTimeout = setTimeout(() => {
        hideUndoToast();
        deletedTask = null;
    }, 5000);
}

// إخفاء إشعار التراجع عن الحذف
function hideUndoToast() {
    undoToast.classList.remove('visible');
}

// التراجع عن الحذف
function undoDelete() {
    if (deletedTask) {
        tasks.splice(deletedTask.index, 0, { ...deletedTask });
        delete deletedTask.index;
        deletedTask = null;
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        hideUndoToast();
        showNotification('تم استعادة المهمة', 'success');
    }
}

// تعديل مهمة
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const newText = prompt('تعديل المهمة:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
            showNotification('تم تعديل المهمة', 'success');
        }
    }
}

// عرض المهام
function renderTasks() {
    let filteredTasks = tasks.filter(task => {
        // التصفية حسب الحالة
        if (currentFilter === 'pending' && task.completed) return false;
        if (currentFilter === 'completed' && !task.completed) return false;
        
        // التصفية حسب الفئة
        if (currentCategory !== 'all' && task.category !== currentCategory) return false;
        
        // البحث
        if (searchInput.value.trim()) {
            const searchTerm = searchInput.value.trim().toLowerCase();
            return task.text.toLowerCase().includes(searchTerm);
        }
        
        return true;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '';
        emptyMessage.style.display = 'block';
        return;
    }

    emptyMessage.style.display = 'none';
    
    taskList.innerHTML = filteredTasks.map(task => {
        const dueDateDisplay = task.dueDate ? formatDueDate(task.dueDate) : '';
        const dueDateClass = task.dueDate ? getDueDateClass(task.dueDate, task.completed) : '';
        
        return `
            <li class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority} category-${task.category} ${task._selected ? 'selected' : ''}" data-id="${task.id}" onclick="handleTaskClick(event, ${task.id})">
                <input type="checkbox" class="task-select ${task._selected ? 'selected' : ''}" ${task._selected ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelect(${task.id})">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="event.stopPropagation(); toggleTask(${task.id})"></div>
                <span class="task-text">${escapeHtml(task.text)}</span>
                ${dueDateDisplay ? `<span class="due-date ${dueDateClass}">${dueDateDisplay}</span>` : ''}
                <div class="task-actions">
                    <button class="task-btn edit-btn" onclick="event.stopPropagation(); editTask(${task.id})" title="تعديل">✏️</button>
                    <button class="task-btn delete-btn" onclick="event.stopPropagation(); deleteTask(${task.id})" title="حذف">🗑️</button>
                </div>
            </li>
        `;
    }).join('');
}

// معالجة النقر على المهمة
function handleTaskClick(event, id) {
    // إذا كان النقر على زر أو مربع اختيار، لا تفعل شيئاً هنا
    if (event.target.closest('.task-btn') || event.target.closest('.task-checkbox') || event.target.closest('.task-select')) {
        return;
    }
    toggleSelect(id);
}

// تبديل التحديد
function toggleSelect(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task._selected = !task._selected;
        updateBulkActions();
        renderTasks();
    }
}

// تحديث قسم الإجراءات الجماعية
function updateBulkActions() {
    const selected = tasks.filter(t => t._selected);
    const count = selected.length;
    
    selectedCount.textContent = count;
    bulkActions.classList.toggle('visible', count > 0);
}

// إتمام المهام المحددة
function completeSelected() {
    const selected = tasks.filter(t => t._selected);
    let completed = 0;
    
    selected.forEach(task => {
        if (!task.completed) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
            completed++;
        }
    });
    
    if (completed > 0) {
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        showNotification(`تم إتمام ${completed} مهمة`, 'success');
    }
    
    clearSelection();
}

// حذف المهام المحددة
function deleteSelected() {
    const selected = tasks.filter(t => t._selected);
    
    if (confirm(`هل أنت متأكد من حذف ${selected.length} مهمة؟`)) {
        tasks = tasks.filter(t => !t._selected);
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        showNotification(`تم حذف ${selected.length} مهمة`, 'info');
    }
    
    clearSelection();
}

// مسح التحديد
function clearSelection() {
    tasks.forEach(task => {
        task._selected = false;
    });
    updateBulkActions();
    renderTasks();
}

// تنسيق تاريخ الاستحقاق
function formatDueDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'اليوم';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'غداً';
    } else {
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    }
}

// الحصول على فئة تاريخ الاستحقاق
function getDueDateClass(dateString, isCompleted) {
    if (isCompleted || !dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'soon';
    return '';
}

// تحديث الإحصائيات
function updateStats() {
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('completedTasks').textContent = tasks.filter(t => t.completed).length;
    document.getElementById('pendingTasks').textContent = tasks.filter(t => !t.completed).length;
    
    // حساب نسبة الإنتاجية
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('productivityRate').textContent = `${productivity}%`;
}

// تحديث شريط التقدم
function updateProgress() {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(t => 
        new Date(t.createdAt).toDateString() === today || 
        (t.completedAt && new Date(t.completedAt).toDateString() === today)
    );
    
    const completedToday = todayTasks.filter(t => t.completed).length;
    const totalToday = todayTasks.length || 1;
    const progress = Math.round((completedToday / totalToday) * 100);
    
    document.getElementById('progressPercent').textContent = `${progress}%`;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

// تصفية المهام
function filterTasks(filter) {
    currentFilter = filter;
    
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    renderTasks();
}

// تصفية حسب الفئة
function filterByCategory(category) {
    currentCategory = category;
    
    categoryFilterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    renderTasks();
}

// البحث في المهام
function searchTasks() {
    renderTasks();
}

// تصدير المهام
function exportTasks() {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('تم تصدير المهام بنجاح', 'success');
}

// استيراد المهام
function importTasks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedTasks = JSON.parse(event.target.result);
                    if (Array.isArray(importedTasks)) {
                        tasks = [...importedTasks, ...tasks];
                        saveTasks();
                        renderTasks();
                        updateStats();
                        updateProgress();
                        showNotification(`تم استيراد ${importedTasks.length} مهمة`, 'success');
                    } else {
                        showNotification('ملف غير صالح', 'error');
                    }
                } catch (error) {
                    showNotification('حدث خطأ أثناء قراءة الملف', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// حذف المهام المكتملة
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    
    if (completedCount === 0) {
        showNotification('لا توجد مهام مكتملة للحذف', 'info');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف ${completedCount} مهمة مكتملة؟`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        showNotification(`تم حذف ${completedCount} مهمة مكتملة`, 'success');
    }
}

// حذف جميع المهام
function clearAllTasks() {
    if (tasks.length === 0) {
        showNotification('لا توجد مهام للحذف', 'info');
        return;
    }
    
    if (confirm('هل أنت متأكد من حذف جميع المهام؟ لا يمكن التراجع عن هذا الإجراء.')) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        showNotification('تم حذف جميع المهام', 'success');
    }
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 30px;
        border-radius: 10px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideDown 0.3s ease;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
        max-width: 90%;
        text-align: center;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// رسالة الترحيب
function showWelcomeMessage() {
    const lastVisit = localStorage.getItem('lastVisit');
    const today = new Date().toDateString();
    
    if (lastVisit !== today) {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) greeting = 'صباح الخير';
        else if (hour < 18) greeting = 'ظهراً';
        else greeting = 'مساء الخير';
        
        showNotification(`${greeting} 👋`, 'info');
        localStorage.setItem('lastVisit', today);
    }
}

// حماية من XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// إضافة الأنيميشنات
function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    searchInput.addEventListener('input', searchTasks);
    
    darkModeBtn.addEventListener('click', toggleDarkMode);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterTasks(btn.dataset.filter);
        });
    });
    
    categoryFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterByCategory(btn.dataset.category);
        });
    });
    
    // إخفاء إشعار التراجع عند النقر خارجياً
    document.addEventListener('click', (e) => {
        if (!undoToast.contains(e.target)) {
            hideUndoToast();
        }
    });
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    addAnimations();
    init();
});
