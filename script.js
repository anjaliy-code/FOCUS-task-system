// ========================
  // DATA LAYER
  // ========================
  const STORAGE_KEY = 'focus_tasks_v1';

  function getTasks() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Seed with example data if empty
  function seedData() {
    const today = new Date();
    const fmt = d => d.toISOString().split('T')[0];
    const addDays = n => { const d = new Date(today); d.setDate(d.getDate()+n); return fmt(d); };

    const tasks = [
      { id: generateId(), name: 'Review Q1 budget proposal', desc: 'Finance sent over the draft on Monday', priority: 'Critical', status: 'In Progress', deadline: addDays(-2), followup: addDays(-1), assigned: 'Sarah K.', category: 'Finance', recurring: 'none', notes: 'Check variance vs forecast', created: Date.now() },
      { id: generateId(), name: 'Send client contract', desc: 'Awaiting legal sign-off first', priority: 'High', status: 'Waiting', deadline: fmt(today), followup: addDays(1), assigned: 'Me', category: 'Legal', recurring: 'none', notes: 'Follow up with legal team', created: Date.now() },
      { id: generateId(), name: 'Weekly team standup', desc: 'Prepare agenda items', priority: 'Medium', status: 'Not Started', deadline: fmt(today), followup: null, assigned: 'Me', category: 'Management', recurring: 'weekly', notes: '', created: Date.now() },
      { id: generateId(), name: 'Update product roadmap', desc: 'Incorporate feedback from last sprint', priority: 'High', status: 'Not Started', deadline: addDays(2), followup: addDays(3), assigned: 'Tom R.', category: 'Product', recurring: 'none', notes: 'Add Q2 features', created: Date.now() },
      { id: generateId(), name: 'Vendor invoice approval', desc: '', priority: 'Low', status: 'Not Started', deadline: addDays(5), followup: null, assigned: 'Me', category: 'Finance', recurring: 'monthly', notes: '', created: Date.now() },
      { id: generateId(), name: 'Onboarding doc for new hire', desc: 'Dev team addition starting next week', priority: 'Medium', status: 'In Progress', deadline: addDays(3), followup: null, assigned: 'HR', category: 'HR', recurring: 'none', notes: 'Need IT to provision accounts', created: Date.now() },
      { id: generateId(), name: 'Close support ticket #4821', desc: 'Customer waiting on resolution', priority: 'High', status: 'Waiting', deadline: addDays(-1), followup: fmt(today), assigned: 'Dev', category: 'Support', recurring: 'none', notes: 'Bug confirmed, fix in staging', created: Date.now() },
    ];
    saveTasks(tasks);
  }

  if (getTasks().length === 0) seedData();

  // ========================
  // UTILS
  // ========================
  const TODAY = new Date(); TODAY.setHours(0,0,0,0);
  const TODAY_STR = TODAY.toISOString().split('T')[0];

  function parseDate(str) {
    if (!str) return null;
    const d = new Date(str + 'T00:00:00');
    return d;
  }

  function isOverdue(task) {
    if (!task.deadline || task.status === 'Done') return false;
    const d = parseDate(task.deadline);
    return d && d < TODAY;
  }

  function isDueToday(task) {
    if (!task.deadline || task.status === 'Done') return false;
    return task.deadline === TODAY_STR;
  }

  function isDueThisWeek(task) {
    if (!task.deadline || task.status === 'Done') return false;
    const d = parseDate(task.deadline);
    const weekEnd = new Date(TODAY); weekEnd.setDate(weekEnd.getDate() + 7);
    return d && d > TODAY && d <= weekEnd;
  }

  function needsFollowUp(task) {
    if (!task.followup || task.status === 'Done') return false;
    const d = parseDate(task.followup);
    return d && d <= TODAY;
  }

  function formatDate(str) {
    if (!str) return '—';
    const d = parseDate(str);
    const opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== TODAY.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('en-US', opts);
  }

  function daysUntil(str) {
    if (!str) return null;
    const d = parseDate(str);
    const diff = Math.round((d - TODAY) / (1000*60*60*24));
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Today';
    return `in ${diff}d`;
  }

  // ========================
  // RENDER
  // ========================
  let currentFilter = 'all';

  function getPriorityClass(p) {
    return { Critical: 'prio-critical', High: 'prio-high', Medium: 'prio-medium', Low: 'prio-low' }[p] || 'prio-low';
  }
  function getStatusClass(s) {
    return { 'Not Started': 'status-not-started', 'In Progress': 'status-in-progress', 'Waiting': 'status-waiting', 'Done': 'status-done' }[s] || 'status-not-started';
  }

  function renderTaskRow(task) {
    const overdue = isOverdue(task);
    const today = isDueToday(task);
    const done = task.status === 'Done';
    const fu = needsFollowUp(task);

    const rowClass = done ? 'task-row done-row' : overdue ? 'task-row overdue' : today ? 'task-row due-today' : 'task-row';
    const dueCls = overdue ? 'due-date overdue-text' : today ? 'due-date today-text' : 'due-date normal-text';
    const checkCls = done ? 'task-check checked' : 'task-check';
    const recIcon = task.recurring !== 'none' ? '<span class="recurring-dot" title="Recurring"></span>' : '';
    const catTag = task.category ? `<span class="tag" style="background:var(--surface2);color:var(--text3)">${task.category}</span>` : '';

    const dueLabel = daysUntil(task.deadline);

    return `<div class="${rowClass}" onclick="openEditModal('${task.id}')">
      <div class="${checkCls}" onclick="event.stopPropagation(); toggleDone('${task.id}')"></div>
      <div class="task-name">
        <div class="name">${escHtml(task.name)}${recIcon}</div>
        ${task.desc ? `<div class="desc">${escHtml(task.desc)}</div>` : ''}
        <div class="tags">${catTag}</div>
      </div>
      <span class="priority-badge ${getPriorityClass(task.priority)}">${task.priority}</span>
      <span class="status-badge ${getStatusClass(task.status)}">${task.status}</span>
      <div class="${dueCls}">${formatDate(task.deadline)}<br><span style="font-size:10px;opacity:0.7">${dueLabel || ''}</span></div>
      <div class="follow-up-cell">${fu ? `<span class="badge">⟳ Follow up</span>` : (task.followup ? formatDate(task.followup) : '—')}</div>
    </div>`;
  }

  function escHtml(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderFollowUpCard(task) {
    return `<div class="followup-card">
      <div>
        <div class="name">${escHtml(task.name)}</div>
        <div class="meta">${task.category ? task.category + ' · ' : ''}${task.assigned ? 'Assigned: ' + task.assigned : ''}</div>
        <div class="meta" style="margin-top:4px;color:var(--orange)">Follow-up: ${formatDate(task.followup)}</div>
      </div>
      <span class="status-badge ${getStatusClass(task.status)}">${task.status}</span>
      <div class="followup-actions">
        <button class="btn btn-ghost btn-sm" onclick="markFollowUpDone('${task.id}')">Snoozed</button>
        <button class="btn btn-sm" onclick="openEditModal('${task.id}')">Update</button>
      </div>
    </div>`;
  }

  function renderAll() {
    const tasks = getTasks();
    const overdueTasks = tasks.filter(isOverdue);
    const todayTasks = tasks.filter(isDueToday);
    const upcomingTasks = tasks.filter(isDueThisWeek);
    const followUpTasks = tasks.filter(needsFollowUp);
    const doneTasks = tasks.filter(t => t.status === 'Done');

    // Update nav counts
    document.getElementById('nav-all-count').textContent = tasks.filter(t => t.status !== 'Done').length;
    document.getElementById('nav-followup-count').textContent = followUpTasks.length;
    document.getElementById('nav-overdue-count').textContent = overdueTasks.length;

    // Stats
    document.getElementById('stat-overdue').textContent = overdueTasks.length;
    document.getElementById('stat-today').textContent = todayTasks.length;
    document.getElementById('stat-done').textContent = doneTasks.length;

    // Overdue banner
    const banner = document.getElementById('overdue-banner');
    if (overdueTasks.length > 0) {
      banner.style.display = 'flex';
      document.getElementById('overdue-count-text').textContent = overdueTasks.length + ' task' + (overdueTasks.length > 1 ? 's' : '') + ' overdue';
    } else {
      banner.style.display = 'none';
    }

    // Dashboard lists
    renderList('dash-overdue-list', overdueTasks, 'Overdue — Act Now', 'red', '⚠ No overdue tasks. Nice work.');
    renderList('dash-today-list', todayTasks, 'Due Today', 'orange', 'Nothing due today.');
    renderList('dash-upcoming-list', upcomingTasks, 'Upcoming This Week', '', 'No upcoming tasks this week.');

    // Follow-ups section
    const fuContainer = document.getElementById('dash-followup-list');
    fuContainer.innerHTML = `<div class="section-header"><div class="section-title">Follow-Ups Pending</div></div>`;
    if (followUpTasks.length === 0) {
      fuContainer.innerHTML += `<div class="empty-state"><small>No pending follow-ups.</small></div>`;
    } else {
      followUpTasks.forEach(t => fuContainer.innerHTML += renderFollowUpCard(t));
    }

    // All tasks
    let filtered = tasks;
    if (currentFilter !== 'all') filtered = tasks.filter(t => t.status === currentFilter);
    const allList = document.getElementById('all-tasks-list');
    if (filtered.length === 0) {
      allList.innerHTML = `<div class="empty-state"><p>Nothing here.</p><small>No tasks match this filter.</small></div>`;
    } else {
      allList.innerHTML = filtered.sort((a,b) => {
        const order = {Critical:0, High:1, Medium:2, Low:3};
        return (order[a.priority]||3) - (order[b.priority]||3);
      }).map(renderTaskRow).join('');
    }

    // Follow-ups view
    const fuList = document.getElementById('followup-list');
    if (followUpTasks.length === 0) {
      fuList.innerHTML = `<div class="empty-state"><p>All caught up.</p><small>No follow-ups pending.</small></div>`;
    } else {
      fuList.innerHTML = followUpTasks.map(renderFollowUpCard).join('');
    }

    // Overdue view
    const ovList = document.getElementById('overdue-list');
    if (overdueTasks.length === 0) {
      ovList.innerHTML = `<div class="empty-state"><p>You're on top of it.</p><small>No overdue tasks.</small></div>`;
    } else {
      ovList.innerHTML = overdueTasks.map(renderTaskRow).join('');
    }
  }

  function renderList(containerId, tasks, title, color, emptyMsg) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="section-header"><div class="section-title ${color}">${title}</div></div>`;
    if (tasks.length === 0) {
      container.innerHTML += `<div class="empty-state"><small>${emptyMsg}</small></div>`;
    } else {
      tasks.forEach(t => container.innerHTML += renderTaskRow(t));
    }
  }

  // ========================
  // INTERACTIONS
  // ========================
  function toggleDone(id) {
    const tasks = getTasks();
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.status = t.status === 'Done' ? 'Not Started' : 'Done';
    saveTasks(tasks);
    renderAll();
  }

  function markFollowUpDone(id) {
    const tasks = getTasks();
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    // Snooze follow-up by 2 days
    const d = new Date(); d.setDate(d.getDate() + 2);
    t.followup = d.toISOString().split('T')[0];
    saveTasks(tasks);
    renderAll();
  }

  let currentView = 'dashboard';
  function showView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    currentView = view;
    renderAll();
  }

  function filterByStatus(status) {
    showView('all-tasks');
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    renderAll();
  }

  function setFilter(f, el) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    renderAll();
  }

  // ========================
  // MODAL
  // ========================
  function openAddModal() {
    document.getElementById('modal-title').textContent = 'New Task';
    document.getElementById('edit-id').value = '';
    document.getElementById('f-name').value = '';
    document.getElementById('f-desc').value = '';
    document.getElementById('f-priority').value = 'Medium';
    document.getElementById('f-status').value = 'Not Started';
    document.getElementById('f-deadline').value = '';
    document.getElementById('f-followup').value = '';
    document.getElementById('f-assigned').value = '';
    document.getElementById('f-category').value = '';
    document.getElementById('f-recurring').value = 'none';
    document.getElementById('f-notes').value = '';
    document.getElementById('delete-btn').style.display = 'none';
    document.getElementById('modal-overlay').classList.add('open');
  }

  function openEditModal(id) {
    const tasks = getTasks();
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('edit-id').value = id;
    document.getElementById('f-name').value = t.name || '';
    document.getElementById('f-desc').value = t.desc || '';
    document.getElementById('f-priority').value = t.priority || 'Medium';
    document.getElementById('f-status').value = t.status || 'Not Started';
    document.getElementById('f-deadline').value = t.deadline || '';
    document.getElementById('f-followup').value = t.followup || '';
    document.getElementById('f-assigned').value = t.assigned || '';
    document.getElementById('f-category').value = t.category || '';
    document.getElementById('f-recurring').value = t.recurring || 'none';
    document.getElementById('f-notes').value = t.notes || '';
    document.getElementById('delete-btn').style.display = 'inline-flex';
    document.getElementById('modal-overlay').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  }

  function saveTask() {
    const name = document.getElementById('f-name').value.trim();
    if (!name) { document.getElementById('f-name').focus(); return; }

    const id = document.getElementById('edit-id').value;
    const tasks = getTasks();

    const taskData = {
      name,
      desc: document.getElementById('f-desc').value.trim(),
      priority: document.getElementById('f-priority').value,
      status: document.getElementById('f-status').value,
      deadline: document.getElementById('f-deadline').value,
      followup: document.getElementById('f-followup').value,
      assigned: document.getElementById('f-assigned').value.trim(),
      category: document.getElementById('f-category').value.trim(),
      recurring: document.getElementById('f-recurring').value,
      notes: document.getElementById('f-notes').value.trim(),
    };

    if (id) {
      const idx = tasks.findIndex(x => x.id === id);
      if (idx > -1) tasks[idx] = { ...tasks[idx], ...taskData };
    } else {
      tasks.push({ id: generateId(), created: Date.now(), ...taskData });
    }

    saveTasks(tasks);
    closeModal();
    renderAll();
  }

  function deleteTask() {
    const id = document.getElementById('edit-id').value;
    if (!id) return;
    if (!confirm('Delete this task?')) return;
    const tasks = getTasks().filter(x => x.id !== id);
    saveTasks(tasks);
    closeModal();
    renderAll();
  }

  // Close modal on overlay click
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // ========================
  // INIT
  // ========================
  function init() {
    // Greeting
    const h = new Date().getHours();
    document.getElementById('greeting-time').textContent = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

    // Today date
    const today = new Date();
    document.getElementById('today-display').textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    renderAll();
  }

  init();