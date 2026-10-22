<script>
  import GlassPanel from '$lib/GlassPanel.svelte';
  import { fileUrl } from '$lib/api.js';
  import TaskList from '$lib/pages/tasks/TaskList.svelte';
  import { getDashboard, registryStatusLabel, updateDashboard } from '$lib/registryStore.svelte.js';
  import {
    addTaskComment,
    addTaskEvidenceFiles,
    approveModuleTask,
    approveStatusMove,
    canCreateDashboard,
    canCreateRequirement,
    canCreateTask,
    canEditField,
    canUpdateTaskProgress,
    currentUserRole,
    isCurrentUserPmOf,
    isOverdue,
    listInboxTasks,
    listModuleTasks,
    loadModuleTaskDetail,
    moveModuleTask,
    readEvidenceFile,
    rejectStatusMove,
    requestRevisionModuleTask,
    resubmitModuleTask,
    statusForProgress,
    tasksForRequirement,
    taskModuleStore,
    tasksByColumn,
    updateModuleTask,
    workflowColumns,
    workflowLabel,
    workflowStatusColor,
  } from '$lib/taskModuleStore.svelte.js';
  import {
    createRequirementVersion,
    groupByVersionRoot,
    listRequirements,
    requirementTeamRoster,
    requirementStore,
  } from '$lib/requirementStore.svelte.js';
  import { formatDate } from '$lib/format.js';
  import { activityLogStore, listActivityLogs, loadActivityLogsFromApi } from '$lib/activityLogStore.svelte.js';
  import { attachmentKindLabel, attachmentStore, listAttachments, loadAttachmentsFromApi, useAttachment } from '$lib/attachmentStore.svelte.js';
  import { portal } from '$lib/portal.js';
  import AttachmentPanel from '$lib/AttachmentPanel.svelte';
  import RegistryInviteModal from './RegistryInviteModal.svelte';
  import RegistryEditModal from './RegistryEditModal.svelte';
  import PmCreateTaskModal from '$lib/PmCreateTaskModal.svelte';

  /** @type {{ selectedDetail: any, detailActiveTab: string, selectedSopItem: any, autoFocusTaskId?: string }} */
  let { selectedDetail = $bindable(), detailActiveTab = $bindable("overview"), selectedSopItem = $bindable(), autoFocusTaskId = '' } = $props();
  void detailActiveTab;

  let inviteOpen = $state(false);
  let editOpen = $state(false);
  /** @type {Record<string, { id: string, name: string, role: string, perm: string }[]>} */
  let membersByDashboard = $state({});
  const members = $derived(membersByDashboard[selectedDetail?.id] ?? []);

  /** @param {{ name: string, role: string, perm: string }} member */
  function addMember(member) {
    const dashboardId = selectedDetail?.id;
    if (!dashboardId) return;
    const current = membersByDashboard[dashboardId] ?? [];
    membersByDashboard = {
      ...membersByDashboard,
      [dashboardId]: [
        ...current,
        { id: crypto.randomUUID(), name: member.name, role: member.role, perm: member.perm },
      ],
    };
  }

  /** @param {string} id */
  function removeMember(id) {
    const dashboardId = selectedDetail?.id;
    if (!dashboardId) return;
    membersByDashboard = {
      ...membersByDashboard,
      [dashboardId]: (membersByDashboard[dashboardId] ?? []).filter((member) => member.id !== id),
    };
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr.replace(" ", "T"));
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /** @param {string} name */
  function initials(name) {
    return String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  const canEdit = $derived(canEditField() || canCreateDashboard() || isPicOrManager);
  const dashboardCode = $derived.by(() => {
    let raw = String(selectedDetail?.code || '').trim().toUpperCase();
    if (raw.startsWith('EDM-')) raw = raw.slice(4);
    if (!raw || raw.length === 1) {
      const clean = String(selectedDetail?.name || '').trim().replace(/([a-z])([A-Z])/, '$1 $2');
      const words = clean.split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        raw = words.map((w) => w[0]).join('').slice(0, 6).toUpperCase();
      } else if (words.length === 1) {
        raw = words[0].replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
      }
    }
    return `EDM-${raw || 'DB'}`;
  });

  let editingKey = $state('');
  let draftValue = $state('');
  let saveError = $state('');
  let saving = $state(false);
  let showSecret = $state('');

  const envSpec = [
    { key: 'db', label: 'Database Engine' },
    { key: 'ip', label: 'IP Address' },
    { key: 'db_name', label: 'Database Name' },
    { key: 'db_user', label: 'Database Username' },
    { key: 'db_pass', label: 'Password', secret: true },
  ];

  const profileSpec = [
    { key: 'framework', label: 'Framework' },
    { key: 'framework_version', label: 'Framework Version' },
    { key: 'backend', label: 'Backend' },
    { key: 'backend_version', label: 'Backend Version' },
    { key: 'frontend', label: 'Front End' },
  ];

  const picName = $derived(String(selectedDetail?.metadata?.pm || selectedDetail?.pm || selectedDetail?.owner || '').trim());
  const ownerField = $derived.by(() => {
    if (!selectedDetail) return null;
    return { id: 'core:owner', key: 'owner', label: 'PIC', value: picName, kind: 'pic', editable: true };
  });

  function syncDetail() {
    if (!selectedDetail) return;
    const fresh = getDashboard(selectedDetail.id);
    if (fresh) selectedDetail = fresh;
  }

  /** @param {{ id: string, value: string }} field */
  function startEdit(field) {
    saveError = '';
    editingKey = field.id;
    draftValue = field.value === '—' ? '' : field.value;
  }

  function cancelEdit() {
    editingKey = '';
    saveError = '';
  }

  /** @param {HTMLElement} node */
  function autoFocusSelect(node) {
    requestAnimationFrame(() => {
      node.focus();
      if (node instanceof HTMLInputElement) {
        node.select();
      }
    });
  }

  /** @param {SubmitEvent} event */
  async function saveEdit(event) {
    event.preventDefault();
    if (!selectedDetail || saving) return;
    const value = draftValue.trim();
    saving = true;
    saveError = '';
    let ok = false;
    if (editingKey.startsWith('meta:')) {
      const key = editingKey.slice('meta:'.length);
      ok = await updateDashboard(selectedDetail.id, { metadata: { [key]: value } });
    } else if (editingKey === 'core:code' && value === '') {
      saveError = 'Code cannot be empty.';
      saving = false;
      return;
    } else {
      const key = editingKey.slice('core:'.length);
      ok = await updateDashboard(selectedDetail.id, key === 'owner' ? { owner: value, pm: value } : { [key]: value });
    }
    saving = false;
    if (!ok) {
      saveError = 'Could not save this field. Check your permission and the value.';
      return;
    }
    syncDetail();
    editingKey = '';
  }

  const devLink = $derived(String(selectedDetail?.metadata?.development_link || '').trim());
  const prodLink = $derived(String(selectedDetail?.metadata?.production_link || '').trim());

  /** @param {string} value */
  function linkHref(value) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  /**
   * @param {'development' | 'production'} env
   * @param {string} value
   */
  function startLink(env, value) {
    saveError = '';
    editingKey = `link:${env}`;
    draftValue = value;
  }

  /**
   * @param {SubmitEvent} event
   * @param {'development_link' | 'production_link'} key
   */
  async function saveLink(event, key) {
    event.preventDefault();
    if (!selectedDetail || saving) return;
    saving = true;
    saveError = '';
    const ok = await updateDashboard(selectedDetail.id, { metadata: { [key]: draftValue.trim() } });
    saving = false;
    if (!ok) {
      saveError = 'Could not save the link. Check your permission and the address.';
      return;
    }
    syncDetail();
    editingKey = '';
  }

  const dashName = $derived(String(selectedDetail?.name || '').trim());

  /** @type {'overview' | 'requirement' | 'source' | 'activity' | 'tasks' | 'task'} */
  let work = $state('overview');
  let focusTaskId = $state('');
  /** @type {'kanban' | 'tasks' | 'requirement'} */
  let taskFrom = $state('kanban');
  let seenDash = $state('');
  let selectedVersionId = $state('');
  let activityQuery = $state('');
  /** Supaya auto-focus (dari notifikasi) cuma diproses sekali per taskId, bukan diulang terus tiap effect jalan lagi. @type {string} */
  let autoFocusHandledFor = $state('');

  $effect(() => {
    if (dashName === seenDash) return;
    seenDash = dashName;
    work = 'overview';
    attachReqId = '';
    focusTaskId = '';
    // Jangan reset kalau lagi ada auto-focus (dari klik notifikasi) yang belum selesai diproses —
    // efek di bawah ini perlu selectedVersionId tetap kosong sampai dia sendiri yang mengisi.
    if (!autoFocusTaskId || autoFocusTaskId === autoFocusHandledFor) {
      selectedVersionId = '';
    }
    showSecret = '';
  });

  /**
   * Klik notifikasi → lompat ke task yang bersangkutan: pilih versi requirement yang benar
   * lalu expand accordion task-nya, persis seperti kalau user buka manual lewat Dashboard List.
   */
  $effect(() => {
    if (!autoFocusTaskId || autoFocusTaskId === autoFocusHandledFor) return;
    void taskModuleStore.items;
    const task = taskModuleStore.items.find((t) => String(t.id) === autoFocusTaskId);
    if (!task) return; // data task belum ke-load, effect ini otomatis jalan lagi pas taskModuleStore.items berubah
    selectedVersionId = String(task.requirement_id || '');
    expandedTaskId = String(task.id);
    loadModuleTaskDetail(task.id);
    autoFocusHandledFor = autoFocusTaskId;
  });

  /**
   * @param {number | string} id
   * @param {'kanban' | 'tasks' | 'requirement'} [from]
   */
  function openTask(id, from) {
    work = 'overview';
    expandedTaskId = String(id);
    openJourneyMap[String(id)] = false;
    loadModuleTaskDetail(id);
  }

  function closeTask() {
    focusTaskId = '';
    work = 'overview';
  }

  /** Accordion: grup task (judul sama) di "List Task" bisa di-expand di tempat. @type {string} */
  let expandedTaskId = $state('');
  let lastSyncedDraftKey = $state('');

  /** State penentu apakah "Riwayat & Journey Progress Task" terbuka. Default: tertutup / hide */
  let openJourneyMap = $state(/** @type {Record<string, boolean>} */ ({}));

  /** @param {string | number} taskId */
  function toggleTaskJourney(taskId) {
    const key = String(taskId);
    openJourneyMap[key] = !openJourneyMap[key];
  }

  /**
   * Pastikan progressDraft dan kanbanDraftStatus selalu tersinkronisasi dengan posisi
   * approval terakhir dari PM saat task dibuka (baik lewat klik row, notification, atau role switch).
   */
  $effect(() => {
    if (!expandedTaskId) {
      lastSyncedDraftKey = '';
      return;
    }
    const currentTask = versionTasks.find((t) => String(t.id) === String(expandedTaskId))
      || taskModuleStore.items.find((t) => String(t.id) === String(expandedTaskId));
    if (currentTask) {
      const approvedPct = displayProgress(currentTask);
      const syncKey = `${currentTask.id}:${currentTask.status}:${approvedPct}`;
      if (lastSyncedDraftKey !== syncKey) {
        progressDraft = approvedPct;
        kanbanDraftStatus = currentTask.status;
        lastSyncedDraftKey = syncKey;
      }
    }
  });

  /** @param {string} key @param {any[]} tasks */
  function toggleTaskRow(key, tasks) {
    resetAccordionDrafts();
    if (expandedTaskId === key) {
      expandedTaskId = '';
      return;
    }
    expandedTaskId = key;
    // Riwayat & Journey Progress Task selalu tertutup (hide) secara default saat detail task dibuka
    openJourneyMap[key] = false;
    const opened = tasks.find((t) => String(t.id) === String(key));
    if (opened) {
      const approvedPct = displayProgress(opened);
      progressDraft = approvedPct;
      kanbanDraftStatus = opened.status;
      lastSyncedDraftKey = `${opened.id}:${opened.status}:${approvedPct}`;
    }
    // List endpoint ringan — tarik detail lengkap (deskripsi/komentar/evidence) tiap task di grup ini sekali waktu di-expand.
    for (const t of tasks) loadModuleTaskDetail(t.id);
  }

  /** Modal Accept Task (+) */
  let acceptModalTaskId = $state('');
  let acceptNote = $state('');
  /** @type {any} */
  let acceptEvidence = $state(null);
  let acceptEvidenceError = $state('');
  let acceptBusy = $state(false);

  /** Modal Return Task (-) */
  let returnModalTaskId = $state('');
  let returnDescription = $state('');
  /** @type {any} */
  let returnEvidence = $state(null);
  let returnEvidenceError = $state('');
  let returnValidationError = $state('');
  let returnBusy = $state(false);

  /** @param {string} taskId */
  function openAcceptModal(taskId) {
    acceptModalTaskId = String(taskId);
    acceptNote = '';
    acceptEvidence = null;
    acceptEvidenceError = '';
  }
  function closeAcceptModal() {
    acceptModalTaskId = '';
    acceptNote = '';
    acceptEvidence = null;
    acceptEvidenceError = '';
  }

  /** @param {string} taskId */
  function openReturnModal(taskId) {
    returnModalTaskId = String(taskId);
    returnDescription = '';
    returnEvidence = null;
    returnEvidenceError = '';
    returnValidationError = '';
  }
  function closeReturnModal() {
    returnModalTaskId = '';
    returnDescription = '';
    returnEvidence = null;
    returnEvidenceError = '';
    returnValidationError = '';
  }

  /** @param {any} task */
  function hasPendingApproval(task) {
    return false;
  }

  /** @param {any} task */
  function canDecideApproval(task) {
    return false;
  }

  const isPicOrManager = $derived.by(() => {
    void taskModuleStore.session;
    const role = currentUserRole();
    if (role === 'manager' || role === 'admin') return true;
    const isPmRole =
      role === 'pm' ||
      role === 'pic' ||
      taskModuleStore.session.label?.toLowerCase() === 'pic' ||
      taskModuleStore.session.label?.toLowerCase() === 'pm';
    if (isPmRole) {
      if (!dashName) return true;
      if (selectedDetail?.pm && selectedDetail.pm.toLowerCase() === (taskModuleStore.session.name || '').toLowerCase()) return true;
      if (selectedDetail?.pm_id && String(selectedDetail.pm_id) === String(taskModuleStore.session.id)) return true;
      return isCurrentUserPmOf(dashName);
    }
    return false;
  });
  const isAdminOrManager = $derived(isPicOrManager);

  /** Pembuat task, pemilik requirement, PIC dashboard, atau assignee task itu berhak ajukan ulang task yang diminta revisi. @param {any} task */
  function canResubmit(task) {
    if (canDecideApproval(task)) return true;
    const name = taskModuleStore.session.name || '';
    if (task.created_by === name) return true;
    if (task.requirement_owner === name) return true;
    const userId = String(taskModuleStore.session.id || '');
    if (Array.isArray(task.assignee_ids) && userId && task.assignee_ids.map(String).includes(userId)) return true;
    return false;
  }

  /** @param {string} taskId */
  async function onResubmitTask(taskId) {
    await resubmitModuleTask(taskId);
  }


  /** Modal Read-Only Return untuk Tim Teknis */
  let readOnlyReturnTaskId = $state('');

  /** Cek apakah task dalam status Return / Perlu Revisi */
  function isTaskReturned(task) {
    if (!task) return false;
    if (task.approval_state === 'revision' || Boolean(task.last_return)) return true;
    const latest = lastApprovalDecision(task);
    if (latest && (latest.action?.toLowerCase().includes('revisi') || latest.action?.toLowerCase().includes('return') || latest.action?.toLowerCase().includes('ditolak'))) {
      return true;
    }
    return false;
  }

  /** Ambil detail catatan return terakhir dari admin */
  function getReturnInfo(task) {
    if (!task) return null;
    if (task.last_return) {
      return task.last_return;
    }
    const acts = task.activity || [];
    const returnAct = acts.find((a) => 
      a.action_type === 'approval' && 
      (a.action?.toLowerCase().includes('revisi') || a.action?.toLowerCase().includes('return') || a.action?.toLowerCase().includes('ditolak'))
    );
    if (!returnAct) {
      if (task.approval_state === 'revision') {
        return {
          actor: 'Admin',
          at: task.updated_at || '',
          action: 'Perlu revisi / task dikembalikan oleh Admin',
          note: 'Task ini telah dikembalikan oleh Admin untuk diperbaiki oleh tim teknis.',
          evidence_id: null
        };
      }
      return null;
    }
    let noteText = returnAct.action;
    noteText = noteText.replace(/^Owner minta revisi\.\s*/i, '');
    noteText = noteText.replace(/^Minta revisi\.\s*/i, '');
    noteText = noteText.replace(/^Task dikembalikan\.\s*/i, '');
    return {
      actor: returnAct.actor || 'Admin',
      at: returnAct.at,
      action: returnAct.action,
      note: noteText || 'Perlu perbaikan dari tim teknis.',
      evidence_id: returnAct.evidence_id || null
    };
  }

  /** @param {number} bytes */
  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /** @param {Event} e */
  async function pickAcceptEvidence(e) {
    const input = /** @type {HTMLInputElement} */ (e.currentTarget);
    const file = input.files?.[0];
    if (!file) return;
    acceptEvidenceError = '';
    try {
      acceptEvidence = await readEvidenceFile(file);
    } catch (err) {
      acceptEvidenceError = err instanceof Error ? err.message : String(err);
    }
  }

  /** @param {Event} e */
  async function pickReturnEvidence(e) {
    const input = /** @type {HTMLInputElement} */ (e.currentTarget);
    const file = input.files?.[0];
    if (!file) return;
    returnEvidenceError = '';
    try {
      returnEvidence = await readEvidenceFile(file);
    } catch (err) {
      returnEvidenceError = err instanceof Error ? err.message : String(err);
    }
  }

  /** Submit Accept task dari modal (+) @param {any} task */
  async function submitAccept(task) {
    if (!canDecideApproval(task)) return;
    const note = acceptNote;
    const evidence = acceptEvidence;
    closeAcceptModal();
    try {
      if (task.status_move) {
        await approveStatusMove(task.id, note, evidence);
      } else {
        await approveModuleTask(task.id, note, evidence);
      }
    } catch (err) {
      console.error('Gagal menyetujui task:', err);
    }
  }

  /** Submit Return task ke tim teknis dari modal (-) @param {any} task */
  async function submitReturn(task) {
    if (!returnDescription.trim()) {
      returnValidationError = 'Deskripsi / alasan return ke tim teknis wajib diisi.';
      return;
    }
    if (!canDecideApproval(task)) return;
    const desc = returnDescription.trim();
    const evidence = returnEvidence;
    returnValidationError = '';
    closeReturnModal();
    try {
      if (task.status_move) {
        await rejectStatusMove(task.id, desc, evidence);
      } else {
        await requestRevisionModuleTask(task.id, desc, evidence);
      }
    } catch (err) {
      console.error('Gagal mengembalikan task:', err);
    }
  }

  /** Popup kelola assignee (+ / −) untuk task. @type {number | string | null} */
  let manageAssigneeTaskId = $state(/** @type {number | string | null} */ (null));
  let assigneeModalTab = $state(/** @type {'add' | 'remove'} */ ('add'));
  let newAssigneeName = $state('');
  let removeAssigneeName = $state('');
  let addAssigneeError = $state('');
  let removeAssigneeError = $state('');
  let addingAssignee = $state(false);
  let removingAssignee = $state(false);

  /** @param {any} taskId @param {'add' | 'remove'} [defaultTab] */
  function openManageAssignee(taskId, defaultTab = 'add') {
    manageAssigneeTaskId = taskId;
    assigneeModalTab = defaultTab;
    newAssigneeName = '';
    removeAssigneeName = '';
    addAssigneeError = '';
    removeAssigneeError = '';
  }

  function closeManageAssignee() {
    manageAssigneeTaskId = null;
    newAssigneeName = '';
    removeAssigneeName = '';
    addAssigneeError = '';
    removeAssigneeError = '';
  }

  /** @param {any} task */
  async function submitAddAssignee(task) {
    if (!newAssigneeName.trim()) {
      addAssigneeError = 'Pilih assignee dulu.';
      return;
    }
    const current = Array.isArray(task.assignees) ? task.assignees : [];
    if (current.includes(newAssigneeName)) {
      addAssigneeError = 'Orang ini sudah jadi assignee task ini.';
      return;
    }
    addingAssignee = true;
    addAssigneeError = '';
    const ok = await updateModuleTask(task.id, {
      assignees: [...current, newAssigneeName],
    });
    addingAssignee = false;
    if (ok) {
      newAssigneeName = '';
      addAssigneeError = '';
    } else {
      addAssigneeError = 'Gagal menambah assignee.';
    }
  }

  /** @param {any} task @param {string} nameToRemove */
  async function deleteSpecificAssignee(task, nameToRemove) {
    if (!nameToRemove) return;
    removingAssignee = true;
    removeAssigneeError = '';
    const current = Array.isArray(task.assignees) ? task.assignees : [];
    const ok = await updateModuleTask(task.id, {
      assignees: current.filter((n) => n !== nameToRemove),
    });
    removingAssignee = false;
    if (!ok) {
      removeAssigneeError = 'Gagal menghapus assignee.';
    }
  }

  /** @param {any} task */
  async function submitRemoveAssignee(task) {
    if (!removeAssigneeName) {
      removeAssigneeError = 'Pilih assignee yang mau dihapus.';
      return;
    }
    await deleteSpecificAssignee(task, removeAssigneeName);
    removeAssigneeName = '';
  }

  // --- Accordion: progress slider + mini kanban ---
  // Progress (0-100%) dan posisi kanban adalah 2 field independen, sama-sama manual
  // (bukan satu diturunkan dari yang lain) — Apply selalu bisa diklik terlepas keduanya cocok atau tidak.
  // (hanya 1 row yang bisa terbuka, jadi state ini boleh scalar)
  let progressDraft = $state(0);
  /** @type {string} Posisi kolom kanban hasil drag-drop card, independen dari progressDraft. */
  let kanbanDraftStatus = $state('');
  let progressBusy = $state(false);
  let progressError = $state('');

  /**
   * Progress % yang beneran dipakai buat ditampilkan di mana pun (baris List Task, slider accordion, dst).
   * progress_percent di DB default 0 untuk task yang belum pernah digeser manual — jatuhkan ke posisi status
   * di kanban sebagai perkiraan awal. Begitu progress_percent pernah diisi (> 0), itu yang jadi acuan utama,
   * bukan posisi status lagi — makanya baris list HARUS baca lewat fungsi ini, bukan taskProgress() langsung,
   * supaya nggak kelihatan "Apply nggak ngaruh" padahal progress_percent-nya sudah benar kesimpen.
   * @param {any} task
   */
  function displayProgress(task) {
    if (task.status === 'selesai') return 100;
    const stored = Number(task.progress_percent || 0);
    return stored > 0 ? stored : taskProgress(task.status);
  }

  /** @param {DragEvent} e */
  function onKanbanCardDragStart(e) {
    e.dataTransfer?.setData('text/plain', 'task');
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }
  /** @param {DragEvent} e */
  function onKanbanColDragOver(e) {
    e.preventDefault();
  }
  /** @param {DragEvent} e @param {string} colKey */
  function onKanbanColDrop(e, colKey) {
    e.preventDefault();
    kanbanDraftStatus = colKey;
    progressDraft = progressForStatus(colKey);
  }

  const canApplyProgress = $derived.by(() => {
    const currentTask = versionTasks.find((t) => String(t.id) === String(expandedTaskId))
      || taskModuleStore.items.find((t) => String(t.id) === String(expandedTaskId));
    if (!currentTask || !canUpdateTaskProgress(currentTask)) return false;
    return true;
  });

  /** @param {any} task */
  async function applyProgress(task) {
    if (!canApplyProgress || !canUpdateTaskProgress(task)) return;
    progressBusy = true;
    progressError = '';
    const pct = progressDraft;
    const targetStatus = kanbanDraftStatus || task.status;

    // Jika ada file evidence yang sudah dipilih tapi belum diupload, upload sekalian bersama pengajuan
    if (pickedEvidenceFiles.length > 0) {
      try {
        const evidences = await Promise.all(pickedEvidenceFiles.map((f) => readEvidenceFile(f)));
        await addTaskEvidenceFiles(task.id, evidences, evidenceNote.trim(), pct);
        pickedEvidenceFiles = [];
        evidenceNote = '';
      } catch {
        /* non-fatal, move tetap diproses */
      }
    }

    const result = await moveModuleTask(task.id, targetStatus, {
      note: `Update progress ke ${pct}%`,
      progressPercent: pct,
    });
    const ok = result !== false;
    progressBusy = false;
    if (!ok) progressError = describeActionError();
  }

  /** Terjemahkan pesan error asli dari backend jadi bahasa yang jelas — bukan cuma "cek permission" generik, karena kadang penyebabnya bukan soal izin sama sekali (misal masih ada request lain yang pending). */
  function describeActionError() {
    const raw = taskModuleStore.lastActionError || '';
    if (raw.includes('still waiting')) return 'Masih ada request lain yang menunggu keputusan PIC — tunggu itu diproses dulu sebelum mengajukan lagi.';
    if (raw.includes('Only a PM') || raw.includes('not allowed')) return 'Gagal menerapkan — cek permission Anda.';
    return raw || 'Gagal menerapkan — cek permission Anda.';
  }

  // --- Accordion: upload evidence/screenshot, bisa lebih dari 1 file ---
  // File dipilih dulu (staged) agar user bisa mengisi catatan evidence terlebih dahulu,
  // lalu diunggah via tombol "Upload Evidence" atau otomatis saat klik "Apply".
  /** @type {File[]} */
  let pickedEvidenceFiles = $state([]);
  let evidenceNote = $state('');
  let evidenceUploading = $state(false);
  let evidenceError = $state('');

  /** @param {Event} e */
  function onSelectEvidenceFiles(e) {
    const input = /** @type {HTMLInputElement} */ (e.currentTarget);
    const files = Array.from(input.files || []);
    if (!files.length) return;
    pickedEvidenceFiles = [...pickedEvidenceFiles, ...files];
    evidenceError = '';
    input.value = '';
  }

  /** @param {number} idx */
  function removePickedEvidenceFile(idx) {
    pickedEvidenceFiles = pickedEvidenceFiles.filter((_, i) => i !== idx);
  }

  function cancelPickedEvidence() {
    pickedEvidenceFiles = [];
    evidenceError = '';
  }

  /** @param {any} task */
  async function submitEvidenceFiles(task) {
    if (!pickedEvidenceFiles.length || !canUpdateTaskProgress(task)) return;
    evidenceUploading = true;
    evidenceError = '';
    try {
      const evidences = await Promise.all(pickedEvidenceFiles.map((f) => readEvidenceFile(f)));
      const ok = await addTaskEvidenceFiles(task.id, evidences, evidenceNote.trim(), progressDraft);
      if (ok) {
        pickedEvidenceFiles = [];
        evidenceNote = '';
      } else {
        evidenceError = taskModuleStore.lastActionError || 'Sebagian/semua file gagal diupload.';
      }
    } catch (err) {
      evidenceError = err instanceof Error ? err.message : String(err);
    }
    evidenceUploading = false;
  }

  /** Reset semua draft accordion saat pindah/tutup row supaya tidak bocor ke task lain. */
  function resetAccordionDrafts() {
    progressError = '';
    pickedEvidenceFiles = [];
    evidenceNote = '';
    evidenceError = '';
  }

  /**
   * Susun riwayat journey progres task dari awal pembuatan, seluruh status_moves,
   * bukti evidence per milestone, hingga respon persetujuan/return PM.
   * @param {any} task
   */
  function getTaskJourney(task) {
    if (!task) return [];
    /** @type {any[]} */
    const moves = task.status_moves || [];
    /** @type {any[]} */
    const evidences = task.evidences || [];
    /** @type {any[]} */
    const activities = (task.activity || []).filter((a) => a.action_type === 'approval');

    const steps = [];

    // Step 1: Titik awal pembuatan task (0% / Backlog)
    const initEvidences = evidences.filter(
      (e) => e.progress_percent === 0 || (e.progress_percent === null && moves.length === 0),
    );
    steps.push({
      id: `init-${task.id}`,
      stepNum: 1,
      pct: 0,
      toStatus: 'backlog',
      status: 'approved',
      statusLabel: 'Backlog (Awal)',
      requestedBy: task.created_by || 'Creator',
      at: task.created_at,
      note: task.description || 'Task dibuat.',
      evidences: initEvidences,
      feedback: null,
    });

    if (moves.length === 0) {
      const currentPct = displayProgress(task);
      if (currentPct > 0 || task.status !== 'backlog') {
        const remainingEvidences = evidences.filter((e) => !initEvidences.includes(e));
        steps.push({
          id: `curr-${task.id}`,
          stepNum: 2,
          pct: currentPct,
          toStatus: task.status,
          status: isTaskReturned(task) ? 'rejected' : 'approved',
          statusLabel: workflowLabel(task.status),
          requestedBy: task.assignees?.join(', ') || task.created_by || 'Tim Teknis',
          at: task.updated_at || task.created_at,
          note: `Progress berjalan di ${currentPct}% (${workflowLabel(task.status)})`,
          evidences: remainingEvidences,
          feedback: isTaskReturned(task)
            ? {
                type: 'return',
                actor: getReturnInfo(task)?.actor || 'PM',
                at: getReturnInfo(task)?.at,
                text: getReturnInfo(task)?.note || 'Perlu revisi.',
                evidenceId: getReturnInfo(task)?.evidence_id,
              }
            : null,
        });
      }
      return steps;
    }

    moves.forEach((m, idx) => {
      const targetPct = m.to_progress_percent !== null ? Number(m.to_progress_percent) : (taskProgress(m.to) || 0);
      const moveEvidences = evidences.filter((e) => Number(e.progress_percent) === targetPct);

      let feedback = null;
      if (m.status !== 'pending') {
        // Tiap move dicariin respon PIC-nya sendiri — dibatasi antara waktu move ini dibuat
        // sampai move berikutnya dibuat (atau sekarang kalau ini move terakhir), supaya respon
        // yang lebih baru buat move lain gak ikut "nempel" ke riwayat yang sudah lama.
        const moveTime = m.at ? new Date(m.at).getTime() : null;
        const nextMoveAt = moves[idx + 1]?.at;
        const windowEnd = nextMoveAt ? new Date(nextMoveAt).getTime() : Infinity;
        const feedbackAct = moveTime === null
          ? null
          : activities
              .filter((a) => {
                const actTime = new Date(a.at).getTime();
                return actTime >= moveTime - 5000 && actTime < windowEnd;
              })
              .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())[0];

        if (feedbackAct) {
          feedback = {
            type: m.status === 'approved' ? 'approved' : 'return',
            actor: feedbackAct.actor || 'PIC/Admin',
            at: feedbackAct.at,
            text: feedbackAct.reason || feedbackAct.description || (m.status === 'approved' ? 'Disetujui oleh PIC.' : 'Dikembalikan untuk revisi.'),
            evidenceId: feedbackAct.evidence_id,
          };
        } else if (m.status === 'rejected') {
          const ret = getReturnInfo(task);
          if (ret) {
            feedback = {
              type: 'return',
              actor: ret.actor || 'PM',
              at: ret.at,
              text: ret.note || 'Perlu revisi.',
              evidenceId: ret.evidence_id,
            };
          }
        }
      }

      steps.push({
        id: m.id,
        stepNum: idx + 2,
        pct: targetPct,
        toStatus: m.to,
        status: m.status,
        requestedBy: m.requested_by || 'Tim Teknis',
        at: m.at,
        note: m.note || `Pengajuan progress ke ${targetPct}% (${workflowLabel(m.to)})`,
        evidences: moveEvidences,
        feedback,
      });
    });

    return steps;
  }

  /**
   * Filter lampiran evidence milik progress tertentu.
   * @param {any} task
   * @param {number} pct
   */
  function evidencesForProgress(task, pct) {
    return (task?.evidences || []).filter((e) => Number(e.progress_percent) === pct);
  }

  /** Entry activity paling baru yang merupakan keputusan approve/reject (bukan sekadar status_change biasa). @param {any} task */
  function lastApprovalDecision(task) {
    /** @type {any[]} */
    const activity = task.activity || [];
    return activity.find((a) => a.action_type === 'approval') || null;
  }

  const dashRequirements = $derived.by(() => {
    void requirementStore.items;
    void taskModuleStore.items;
    if (!dashName) return [];
    return groupByVersionRoot(listRequirements({ dashboard: dashName }));
  });

  const activeGroup = $derived.by(() => {
    if (!dashRequirements.length) return null;
    const match = dashRequirements.find((group) =>
      group.versions.some((version) => String(version.id) === selectedVersionId),
    );
    return match || dashRequirements[0];
  });

  const activeVersion = $derived.by(() => {
    if (!activeGroup) return null;
    return (
      activeGroup.versions.find((version) => String(version.id) === selectedVersionId) ||
      activeGroup.latest
    );
  });

  const versionTasks = $derived.by(() => {
    void taskModuleStore.items;
    if (!activeVersion) return [];
    const id = String(activeVersion.id);
    return taskModuleStore.items.filter((task) => String(task.requirement_id) === id);
  });

  /**
   * Gabungan tim requirement (requirement_team_members) + semua assignee task
   * di bawah requirement ini — biar orang yang cuma di-assign ke task (tanpa
   * eksplisit ditambah ke tim requirement) tetap kebaca di sini.
   */
  const requirementAssignees = $derived.by(() => {
    const names = new Set(activeVersion?.team || []);
    for (const task of versionTasks) {
      for (const name of task.assignees || []) names.add(name);
    }
    return Array.from(names);
  });

  const versionProgress = $derived.by(() => {
    const total = versionTasks.length;
    if (!total) return { total: 0, pct: 0 };
    const sum = versionTasks.reduce((acc, task) => acc + displayProgress(task), 0);
    return { total, pct: Math.round(sum / total) };
  });

  const dashboardActivity = $derived.by(() => {
    void activityLogStore.items;
    if (!dashName) return [];
    return listActivityLogs({ dashboard: dashName });
  });

  const visibleActivity = $derived.by(() => {
    const needle = activityQuery.trim().toLowerCase();
    if (!needle) return dashboardActivity;
    return dashboardActivity.filter((log) =>
      `${log.action} ${log.actor} ${log.objectLabel}`.toLowerCase().includes(needle),
    );
  });

  $effect(() => {
    if (work !== 'activity') return;
    loadActivityLogsFromApi();
  });

  /** @param {string} name */
  function activityInitials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  /** @param {string} name */
  function activityTone(name) {
    const tones = ['slate', 'rose', 'sky', 'amber'];
    let total = 0;
    for (const char of String(name || '')) total += char.charCodeAt(0);
    return tones[total % tones.length];
  }

  /** @param {string} stamp */
  function activityWhen(stamp) {
    if (!stamp) return '—';
    const date = formatDate(stamp.slice(0, 10));
    const time = stamp.slice(11, 16);
    return time ? `${date}, ${time}` : date;
  }

  /** @param {string | number} id */
  function pickVersion(id) {
    selectedVersionId = String(id);
  }

  $effect(() => {
    for (const group of dashRequirements) {
      loadAttachmentsFromApi('requirement', group.latest.id);
    }
  });

  /** @param {number | string} id */
  function filesFor(id) {
    void attachmentStore.items;
    return listAttachments('requirement', id);
  }

  let attachReqId = $state('');
  let attachTitle = $state('');
  const attachFiles = $derived(attachReqId ? filesFor(attachReqId) : []);

  /** @param {{ id: number | string, title: string }} req */
  function openAttach(req) {
    attachReqId = String(req.id);
    attachTitle = req.title;
  }

  function closeAttach() {
    attachReqId = '';
    attachTitle = '';
  }

  /** @param {{ versions: { id: number }[] }} group */
  function progressOfGroup(group) {
    const tasks = group.versions.flatMap((version) => tasksForRequirement(version.id));
    const total = tasks.length;
    if (!total) return { total: 0, pct: 0 };
    const sum = tasks.reduce((acc, task) => acc + displayProgress(task), 0);
    return { total, pct: Math.round(sum / total) };
  }
  /**
   * @param {'development' | 'production'} env
   */
  function envFields(env) {
    const meta = selectedDetail?.metadata || {};
    return envSpec.map((field) => ({
      id: `meta:${env}_${field.key}`,
      key: `${env}_${field.key}`,
      label: field.label,
      value: String(meta[`${env}_${field.key}`] || ''),
      kind: field.secret ? 'secret' : 'text',
      editable: true,
      meta: true,
    }));
  }

  const devFields = $derived(selectedDetail ? envFields('development') : []);
  const prodFields = $derived(selectedDetail ? envFields('production') : []);
  const profileFields = $derived.by(() => {
    const meta = selectedDetail?.metadata || {};
    const list = profileSpec.map((field) => ({
      id: `meta:${field.key}`,
      label: field.label,
      value: String(meta[field.key] || ''),
    }));
    const standardKeys = new Set([
      ...profileSpec.map((f) => f.key),
      'source_system', 'deploy', 'pm', 'refresh_cadence',
      'development_link', 'production_link',
      'development_db', 'development_ip', 'development_db_name', 'development_db_user', 'development_db_pass',
      'production_db', 'production_ip', 'production_db_name', 'production_db_user', 'production_db_pass',
    ]);
    for (const [k, v] of Object.entries(meta)) {
      if (!standardKeys.has(k) && !k.startsWith('development_') && !k.startsWith('production_')) {
        const readableLabel = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        list.push({
          id: `meta:${k}`,
          label: readableLabel,
          value: String(v || ''),
        });
      }
    }
    return list;
  });
  const teamPeople = $derived.by(() => {
    /** @type {{ id: string, name: string, role: string, removable: boolean }[]} */
    const people = [];
    const pm = selectedDetail?.metadata?.pm;
    if (pm) people.push({ id: 'pm', name: pm, role: 'Project Manager', removable: false });
    for (const member of members) {
      people.push({ id: member.id, name: member.name, role: member.role, removable: true });
    }
    return people;
  });

  const dashTasks = $derived.by(() => {
    void taskModuleStore.items;
    if (!dashName) return [];
    return listModuleTasks({ dashboard: dashName });
  });

  const kanbanCols = $derived.by(() => {
    void taskModuleStore.items;
    return workflowColumns.map((col) => ({
      key: col.key,
      label: col.label,
      color: workflowStatusColor(col.key),
      count: dashName ? tasksByColumn(col.key, dashName).length : 0,
    }));
  });

  const kanbanTotal = $derived(kanbanCols.reduce((sum, col) => sum + col.count, 0));
  const kanbanMax = $derived(Math.max(...kanbanCols.map((col) => col.count), 1));

  /** @param {string} status */
  function taskProgress(status) {
    const idx = workflowColumns.findIndex((col) => col.key === status);
    if (idx < 0 || workflowColumns.length < 2) return 0;
    return Math.round((idx / (workflowColumns.length - 1)) * 100);
  }

  const inboxCount = $derived.by(() => {
    void taskModuleStore.items;
    if (!dashName) return 0;
    return listInboxTasks(dashName).length;
  });

  const canAddReq = $derived.by(() => {
    void taskModuleStore.session;
    return canCreateRequirement();
  });
  const canAddTask = $derived.by(() => {
    void taskModuleStore.session;
    return canCreateTask();
  });
  let taskCreateOpen = $state(false);
  let versionOpen = $state(false);
  let versionTitle = $state('');
  let versionDescription = $state('');
  /** @type {string[]} */
  let versionTeam = $state([]);
  let versionError = $state('');
  let versionSaving = $state(false);

  const versionAssigneePool = $derived.by(() => requirementTeamRoster().map((member) => member.name));

  function openVersionCreate() {
    if (!activeVersion || !canAddReq) return;
    versionTitle = activeVersion.title || '';
    versionDescription = activeVersion.description || '';
    versionTeam = [...(activeVersion.team || [])];
    versionError = '';
    versionOpen = true;
  }

  function closeVersionCreate() {
    if (versionSaving) return;
    versionOpen = false;
  }

  /** @param {string} name */
  function toggleVersionAssignee(name) {
    versionTeam = versionTeam.includes(name)
      ? versionTeam.filter((item) => item !== name)
      : [...versionTeam, name];
  }

  /** @param {SubmitEvent} event */
  async function submitVersionCreate(event) {
    event.preventDefault();
    if (versionSaving || !activeVersion || !canAddReq) return;
    versionError = '';
    if (!versionTitle.trim()) {
      versionError = 'Title is required';
      return;
    }
    if (!versionDescription.trim()) {
      versionError = 'Description is required';
      return;
    }
    versionSaving = true;
    const created = await createRequirementVersion(activeVersion.id, {
      title: versionTitle,
      description: versionDescription,
      team: versionTeam,
    });
    versionSaving = false;
    if (!created) {
      versionError = 'Could not create the new version';
      return;
    }
    versionOpen = false;
    pickVersion(created.id);
  }
</script>

<GlassPanel class="detail-panel">
      {#snippet fieldCell(field)}
        <div class="sheet-pair">
          {#if editingKey === field.id}
            <form class="fact-edit" onsubmit={saveEdit}>
              <div class="fact-header">
                <span class="fact-label">{field.label}</span>
                <span class="fact-badge">Editing</span>
              </div>
              <input
                class="fact-input"
                use:autoFocusSelect
                onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                type={field.kind === 'secret' ? 'password' : 'text'}
                bind:value={draftValue}
                placeholder={field.kind === 'secret' ? 'Password' : 'Nilai'}
                maxlength="200"
                autocomplete="off"
              />
              <div class="fact-actions">
                <button type="submit" class="fact-btn fact-btn-save" disabled={saving}>
                  {#if saving}
                    <span class="fact-spin"></span>
                  {:else}
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="2.5 8 6.5 12 13.5 4" />
                    </svg>
                  {/if}
                  <span>Save</span>
                </button>
                <button type="button" class="fact-btn fact-btn-cancel" onclick={cancelEdit}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="3" x2="13" y2="13" />
                    <line x1="13" y1="3" x2="3" y2="13" />
                  </svg>
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          {:else}
            <span class="sheet-k">{field.label}</span>
            {#if field.kind === 'url' && field.value}
              <a class="sheet-v" href={field.value} target="_blank" rel="noopener noreferrer">{field.value}</a>
            {:else if field.kind === 'secret'}
              <strong class="sheet-v">{field.value ? (showSecret === field.id ? field.value : '••••••') : '—'}</strong>
            {:else}
              <strong class="sheet-v">{field.value || '—'}</strong>
            {/if}
            {#if (field.kind === 'secret' && field.value) || (field.editable && canEdit)}
              <span class="sheet-tools">
                {#if field.kind === 'secret' && field.value}
                  <button
                    type="button"
                    class="icon-edit"
                    aria-label={showSecret === field.id ? 'Hide password' : 'Show password'}
                    onclick={() => (showSecret = showSecret === field.id ? '' : field.id)}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
                  </button>
                {/if}
                {#if field.editable && canEdit}
                  <button type="button" class="icon-edit" aria-label="Edit" onclick={() => startEdit(field)}>
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.1 2.4a1.5 1.5 0 0 1 2.1 2.1L6.1 11.6l-2.6.7.7-2.6 6.9-7.3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                  </button>
                {/if}
              </span>
            {/if}
          {/if}
        </div>
      {/snippet}

      {#snippet taskJourneySnippet(task)}
        {@const journey = getTaskJourney(task)}
        {@const isJourneyOpen = Boolean(openJourneyMap[String(task.id)])}
        <div class="task-journey-container simplified" class:is-collapsed={!isJourneyOpen}>
          <button
            type="button"
            class="journey-header-toggle"
            onclick={() => toggleTaskJourney(task.id)}
            aria-expanded={isJourneyOpen}
          >
            <div class="journey-header-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Riwayat & Journey Progress Task</span>
              {#if journey.length > 0}
                <span class="journey-count-badge">{journey.length}</span>
              {/if}
            </div>

            <div class="journey-header-action">
              <span class="journey-toggle-hint">{isJourneyOpen ? 'Sembunyikan' : 'Tampilkan'}</span>
              <svg
                class="journey-chevron"
                class:rotated={isJourneyOpen}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>

          {#if isJourneyOpen}
            {#if journey.length === 0}
              <p class="journey-empty-hint">Belum ada riwayat pergerakan status untuk task ini.</p>
            {:else}
              <div class="task-journey-timeline">
                {#each journey as step, i (step.id)}
                  <div class="journey-step {step.status}">
                    <div class="journey-rail">
                      <div class="journey-badge-dot" title="Step {step.stepNum}: {step.pct}%">
                        {#if step.status === 'approved'}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        {:else if step.status === 'rejected'}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        {:else if step.status === 'pending'}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 14 14"/>
                          </svg>
                        {:else}
                          <span style="font-size: 9px; font-weight: 700;">{step.stepNum}</span>
                        {/if}
                      </div>
                      {#if i < journey.length - 1}
                        <div class="journey-line"></div>
                      {/if}
                    </div>

                    <div class="journey-content-card">
                      <div class="journey-card-top">
                        <div class="journey-step-tag">
                          <span class="step-pct-badge">{step.pct}%</span>
                          <span class="step-title">
                            {step.toStatus ? workflowLabel(step.toStatus) : (step.statusLabel || 'Progress Milestone')}
                          </span>
                          <span class="journey-author">
                            · Oleh: <strong>{step.requestedBy}</strong>
                            {#if step.at} · {formatDate(step.at)}{/if}
                          </span>
                        </div>
                        <span class="status-pill pill-{step.status}">
                          {#if step.status === 'approved'}
                            Disetujui PM
                          {:else if step.status === 'rejected'}
                            Perlu Revisi / Returned
                          {:else if step.status === 'pending'}
                            Menunggu Approval PM
                          {:else}
                            Status
                          {/if}
                        </span>
                      </div>

                      {#if step.note && !step.note.startsWith('Update progress ke')}
                        <div class="journey-simple-note">
                          <span class="journey-note-label">Catatan:</span>
                          <span class="journey-note-val">"{step.note}"</span>
                        </div>
                      {/if}

                      {#if step.evidences && step.evidences.length > 0}
                        <div class="journey-simple-evidences">
                          <span class="journey-ev-label">Evidence ({step.evidences.length}):</span>
                          <div class="journey-ev-inline-list">
                            {#each step.evidences as ev (ev.id)}
                              <span class="journey-ev-item">
                                <a href={fileUrl(ev.file_url)} target="_blank" rel="noopener noreferrer" class="journey-ev-link">{ev.name}</a>
                                {#if ev.note}
                                  <small class="journey-ev-item-note">("{ev.note}")</small>
                                {/if}
                              </span>
                            {/each}
                          </div>
                        </div>
                      {/if}

                      {#if step.feedback}
                        <div class="journey-simple-feedback feedback-{step.feedback.type}">
                          <span class="feedback-author">Respon PM ({step.feedback.actor}):</span>
                          <span class="feedback-text">"{step.feedback.text}"</span>
                          {#if step.feedback.evidenceId}
                            <a href="/api/evidences/{step.feedback.evidenceId}/file" target="_blank" rel="noopener noreferrer" class="feedback-link">
                              Lampiran PM
                            </a>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {/if}
        </div>
      {/snippet}
      <!-- ERP Standard Object Header -->
      <div class="erp-object-header">
        <div class="erp-header-top">
          <div class="erp-header-left">
            <button
              type="button"
              class="erp-back-btn"
              onclick={() => (selectedDetail = null)}
              aria-label="Back to list"
              title="Back"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                ><path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
            </button>
            <div class="erp-title-block">
              <span class="erp-eyebrow">Workspaces</span>
              <div class="erp-id-row">
                <span class="mono-id">{dashboardCode}</span>
                <span class={`badge status-${selectedDetail.status}`}>{registryStatusLabel(selectedDetail.status)}</span>
              </div>
              <h2>{selectedDetail.name}</h2>
              <p class="erp-subtitle">{selectedDetail.description || `${selectedDetail.platform} · ${selectedDetail.category}`}</p>
            </div>
          </div>

          <div class="erp-actions">
            {#if canEdit}
              <button
                type="button"
                class="btn-outline btn-edit-dash"
                onclick={() => (editOpen = true)}
                title="Edit informasi dashboard ini"
                style="display:inline-flex; align-items:center; gap:6px;"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Dashboard</span>
              </button>
            {/if}
            <AttachmentPanel
              ownerType="dashboard"
              ownerId={selectedDetail.id}
              triggerLabel="Attachment Dashboard"
            />
            <button type="button" class="btn-outline" onclick={() => (selectedSopItem = selectedDetail)}>View SOP</button>
          </div>
        </div>
        <div class="view-switch" role="tablist" aria-label="Dashboard view">
          <button
            type="button"
            class="view-tab"
            class:on={work !== 'source' && work !== 'activity'}
            onclick={() => { focusTaskId = ''; work = 'overview'; }}
          >Detail Information</button>
          <button type="button" class="view-tab" class:on={work === 'source'} onclick={() => (work = 'source')}>Data Source</button>
          <button type="button" class="view-tab" class:on={work === 'activity'} onclick={() => (work = 'activity')}>Activity history</button>
        </div>
      </div>

      <div class="detail-content">
        {#if work === 'source'}
          <div class="dev-placeholder">
            <img src="/on-development.gif" alt="" width="220" height="160" />
            <p>On Development</p>
          </div>
        {:else if work === 'activity'}
          <div class="activity-history">
            <h3>Activity History</h3>
            <label class="activity-search">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              <input type="search" placeholder="Search activity..." bind:value={activityQuery} />
            </label>
            {#if activityLogStore.loading && dashboardActivity.length === 0}
              <p class="sheet-empty">Loading activity...</p>
            {:else if visibleActivity.length === 0}
              <p class="sheet-empty">{activityQuery.trim() ? 'No matching activity.' : 'No activity on this dashboard yet.'}</p>
            {:else}
              <ul class="activity-feed">
                {#each visibleActivity as log (log.id)}
                  <li>
                    <span class="activity-avatar {activityTone(log.actor)}">{activityInitials(log.actor)}</span>
                    <div class="activity-body">
                      <strong>{log.action || 'Activity'}</strong>
                      {#if log.objectLabel}<p>{log.objectLabel}</p>{/if}
                      <time>{activityWhen(log.at)} · {log.actor || '—'}</time>
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {:else if work === 'tasks'}
          <button type="button" class="progress-link work-back" onclick={() => (work = 'overview')}>← Back</button>
          <div class="work-surface">
            <TaskList
              lockedDashboard={dashName}
              embedded
              onOpenTask={(id) => openTask(id, 'tasks')}
              onOpenBoard={() => (work = 'overview')}
            />
          </div>
        {:else if work !== 'source' && work !== 'activity'}
        <div class="sheet">
          <div class="sheet-facts">
            <div class="sheet-fact">
              <span>Unit</span>
              <strong>{selectedDetail.category || '—'}</strong>
            </div>
            <div class="sheet-fact">
              <span>Created</span>
              <strong>{formatDateDisplay(selectedDetail.created_at)}</strong>
            </div>
            <div class="sheet-fact sheet-fact-wide">
              <span>PIC</span>
              {#if ownerField && editingKey === ownerField.id}
                <form class="fact-edit" onsubmit={saveEdit}>
                  <div class="fact-header">
                    <span class="fact-label">PIC (Owner)</span>
                    <span class="fact-badge">Editing</span>
                  </div>
                  <input
                    class="fact-input"
                    use:autoFocusSelect
                    onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                    bind:value={draftValue}
                    placeholder="PIC name"
                    maxlength="200"
                  />
                  <div class="fact-actions">
                    <button type="submit" class="fact-btn fact-btn-save" disabled={saving}>
                      {#if saving}
                        <span class="fact-spin"></span>
                      {:else}
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="2.5 8 6.5 12 13.5 4" />
                        </svg>
                      {/if}
                      <span>Save</span>
                    </button>
                    <button type="button" class="fact-btn fact-btn-cancel" onclick={cancelEdit}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="3" x2="13" y2="13" />
                        <line x1="13" y1="3" x2="3" y2="13" />
                      </svg>
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              {:else}
                <div class="sheet-people">
                  {#if picName}
                    <span class="dash-avatar">
                      <i>{initials(picName)}</i>
                      <em>{picName}</em>
                    </span>
                  {:else}
                    <strong>—</strong>
                  {/if}
                  {#each teamPeople as person (person.id)}
                    {#if person.id !== 'pm' && person.name !== picName}
                      <span class="dash-avatar">
                        <i>{initials(person.name)}</i>
                        <em>{person.name}</em>
                      </span>
                    {/if}
                  {/each}
                  {#if ownerField && canEdit}
                    <button type="button" class="icon-edit" aria-label="Edit" onclick={() => startEdit(ownerField)}>
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.1 2.4a1.5 1.5 0 0 1 2.1 2.1L6.1 11.6l-2.6.7.7-2.6 6.9-7.3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                    </button>
                  {/if}
                  <button type="button" class="dash-assign" onclick={() => (inviteOpen = true)}>+ Assignee</button>
                </div>
              {/if}
            </div>
          </div>

          <div class="sheet-sub">
            {#each profileFields as field (field.id)}
              <div class="sheet-sub-item">
                {#if editingKey === field.id}
                  <form class="fact-edit" onsubmit={saveEdit}>
                    <div class="fact-header">
                      <span class="fact-label">{field.label}</span>
                      <span class="fact-badge">Editing</span>
                    </div>
                    <input
                      class="fact-input"
                      use:autoFocusSelect
                      onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                      bind:value={draftValue}
                      placeholder="Nilai"
                      maxlength="200"
                    />
                    <div class="fact-actions">
                      <button type="submit" class="fact-btn fact-btn-save" disabled={saving}>
                        {#if saving}
                          <span class="fact-spin"></span>
                        {:else}
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="2.5 8 6.5 12 13.5 4" />
                          </svg>
                        {/if}
                        <span>Save</span>
                      </button>
                      <button type="button" class="fact-btn fact-btn-cancel" onclick={cancelEdit}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="3" y1="3" x2="13" y2="13" />
                          <line x1="13" y1="3" x2="3" y2="13" />
                        </svg>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                {:else}
                  <span>{field.label}</span>
                  <strong>{field.value || '—'}</strong>
                  {#if canEdit}
                    <button type="button" class="icon-edit" aria-label="Edit {field.label}" onclick={() => startEdit(field)}>
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.1 2.4a1.5 1.5 0 0 1 2.1 2.1L6.1 11.6l-2.6.7.7-2.6 6.9-7.3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                    </button>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>

          <section class="sheet-block">
            <header class="sheet-head">
              <h3 class="sheet-section-title">Infrastructure</h3>
            </header>
            <div class="sheet-envs">
              <div class="sheet-env">
                <h4>Development</h4>
                {#if editingKey === 'link:development'}
                  <form class="fact-edit" onsubmit={(event) => saveLink(event, 'development_link')}>
                    <div class="fact-header">
                      <span class="fact-label">Development Link</span>
                      <span class="fact-badge">Editing</span>
                    </div>
                    <input
                      class="fact-input"
                      use:autoFocusSelect
                      onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                      bind:value={draftValue}
                      placeholder="https://..."
                      maxlength="500"
                    />
                    <div class="fact-actions">
                      <button type="submit" class="fact-btn fact-btn-save" disabled={saving}>
                        {#if saving}
                          <span class="fact-spin"></span>
                        {:else}
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="2.5 8 6.5 12 13.5 4" />
                          </svg>
                        {/if}
                        <span>Save</span>
                      </button>
                      <button type="button" class="fact-btn fact-btn-cancel" onclick={cancelEdit}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="3" y1="3" x2="13" y2="13" />
                          <line x1="13" y1="3" x2="3" y2="13" />
                        </svg>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                {:else}
                  <div class="env-link">
                    {#if devLink}
                      <a href={linkHref(devLink)} target="_blank" rel="noopener noreferrer">{devLink}</a>
                    {:else}
                      <span>No link yet.</span>
                    {/if}
                    {#if canEdit}
                      <button type="button" class="icon-edit" aria-label="Edit" onclick={() => startLink('development', devLink)}>
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.1 2.4a1.5 1.5 0 0 1 2.1 2.1L6.1 11.6l-2.6.7.7-2.6 6.9-7.3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                      </button>
                    {/if}
                  </div>
                {/if}
                {#each devFields as field (field.id)}
                  {@render fieldCell(field)}
                {/each}
              </div>
              <div class="sheet-env">
                <h4>Production</h4>
                {#if editingKey === 'link:production'}
                  <form class="fact-edit" onsubmit={(event) => saveLink(event, 'production_link')}>
                    <div class="fact-header">
                      <span class="fact-label">Production Link</span>
                      <span class="fact-badge">Editing</span>
                    </div>
                    <input
                      class="fact-input"
                      use:autoFocusSelect
                      onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                      bind:value={draftValue}
                      placeholder="https://..."
                      maxlength="500"
                    />
                    <div class="fact-actions">
                      <button type="submit" class="fact-btn fact-btn-save" disabled={saving}>
                        {#if saving}
                          <span class="fact-spin"></span>
                        {:else}
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="2.5 8 6.5 12 13.5 4" />
                          </svg>
                        {/if}
                        <span>Save</span>
                      </button>
                      <button type="button" class="fact-btn fact-btn-cancel" onclick={cancelEdit}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="3" y1="3" x2="13" y2="13" />
                          <line x1="13" y1="3" x2="3" y2="13" />
                        </svg>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                {:else}
                  <div class="env-link">
                    {#if prodLink}
                      <a href={linkHref(prodLink)} target="_blank" rel="noopener noreferrer">{prodLink}</a>
                    {:else}
                      <span>No link yet.</span>
                    {/if}
                    {#if canEdit}
                      <button type="button" class="icon-edit" aria-label="Edit" onclick={() => startLink('production', prodLink)}>
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.1 2.4a1.5 1.5 0 0 1 2.1 2.1L6.1 11.6l-2.6.7.7-2.6 6.9-7.3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                      </button>
                    {/if}
                  </div>
                {/if}
                {#each prodFields as field (field.id)}
                  {@render fieldCell(field)}
                {/each}
              </div>
            </div>
            {#if saveError}<p class="field-error">{saveError}</p>{/if}
          </section>

          <section class="sheet-block">
            <header class="sheet-head sheet-head-req">
              <div class="sheet-head-title">
                <h3 class="sheet-section-title">Requirement/Batch</h3>
                {#if activeGroup}
                  <div class="version-history" role="group" aria-label="Filter versi">
                    {#each [...activeGroup.versions].reverse() as version (version.id)}
                      <button
                        type="button"
                        class:on={activeVersion && String(version.id) === String(activeVersion.id)}
                        onclick={() => pickVersion(version.id)}
                      >v{version.version_no}</button>
                    {/each}
                    {#if canAddReq && activeVersion}
                      <button type="button" class="version-add" onclick={openVersionCreate}>+ Add Version</button>
                    {/if}
                  </div>
                {/if}
              </div>
              <div class="sheet-head-actions">
                {#if activeVersion}
                  <span class="req-progress-chart" title="Progress {versionProgress.pct}%">
                    <em>Progress</em>
                    <b>{versionProgress.pct}%</b>
                    <span class="req-meter" aria-hidden="true"><i style="width: {versionProgress.pct}%"></i></span>
                  </span>
                {/if}
                {#if canAddTask && activeVersion}
                  <button type="button" class="req-add" onclick={() => (taskCreateOpen = true)}>+ Add Task</button>
                {/if}
              </div>
            </header>
            {#if !activeGroup || !activeVersion}
              <p class="sheet-empty">No requirements yet.</p>
            {:else}
              {@const files = filesFor(activeVersion.id)}
              {#if dashRequirements.length > 1}
                <div class="req-picks" role="tablist" aria-label="Requirement/Batch">
                  {#each dashRequirements as group (group.root.id)}
                    <button
                      type="button"
                      class:on={group.root.id === activeGroup.root.id}
                      onclick={() => pickVersion(group.latest.id)}
                    >{group.latest.title}</button>
                  {/each}
                </div>
              {/if}
              <article class="req-sheet">
                <div class="req-sheet-main">
                  <h4 class="req-sheet-title">{activeVersion.title}</h4>
                  <p>{activeVersion.description || '—'}</p>
                  <div class="req-meta">
                    <span><em>Created</em> {formatDate(activeVersion.created_at)}</span>
                    <span><em>Due Date</em> {formatDate(activeVersion.due_date)}</span>
                    <span><em>Assignee</em> {requirementAssignees.length ? requirementAssignees.join(', ') : '—'}</span>
                  </div>
                </div>
                <div class="req-sheet-side">
                  <p class="sheet-k">List Attachment</p>
                  {#if files.length === 0}
                    <p class="sheet-empty">No attachments yet.</p>
                  {:else}
                    <ul class="sheet-files">
                      {#each files as file (file.id)}
                        <li>
                          <button type="button" onclick={() => useAttachment(file.id, 'open')}>{file.name}</button>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              </article>

              <header class="sheet-head sheet-task-head">
                <div class="sheet-task-head-left">
                  <h3>Task · V{activeVersion.version_no}</h3>
                  <span class="sheet-task-count-badge">{versionTasks.length} Task</span>
                </div>
              </header>
              {#if versionTasks.length === 0}
                <p class="sheet-empty">This version has no tasks yet.</p>
              {:else}
                <div class="req-scroll">
                  <table class="sheet-tasks">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Assignee</th>
                        <th>Att</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th class="task-actions-col"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each versionTasks as task (task.id)}
                        {@const isOpen = expandedTaskId === task.id}
                        {@const pct = displayProgress(task)}
                        <tr
                          class:late={isOverdue(task)}
                          class:pending-approval={hasPendingApproval(task)}
                          class="task-row-toggle"
                          class:open={isOpen}
                          onclick={() => toggleTaskRow(task.id, [task])}
                        >
                          <td>
                            <span class="task-title-cell">
                              <i class="row-chevron" class:open={isOpen} aria-hidden="true">▸</i>
                              {task.title}
                            </span>
                          </td>
                          <td>
                            <div class="assignee-cell">
                              <span class="assignee-names">
                                {task.assignees?.length ? task.assignees.join(', ') : '—'}
                              </span>
                              {#if isAdminOrManager}
                                <button
                                  type="button"
                                  class="assignee-pop-trigger icon-only"
                                  title="Kelola Assignee (+ / −)"
                                  aria-label="Kelola Assignee"
                                  onclick={(e) => { e.stopPropagation(); openManageAssignee(task.id); }}
                                >
                                  <svg class="trigger-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="16" y1="11" x2="22" y2="11" />
                                  </svg>
                                </button>
                              {/if}
                            </div>
                          </td>
                          <td>{task.evidences?.length || '—'}</td>
                          <td>
                            <span class="prog-bar" title="{pct}%">
                              <span class="prog-track"><i style="width: {pct}%; background: {workflowStatusColor(task.status)}"></i></span>
                              <b>{pct}%</b>
                            </span>
                          </td>
                          <td>
                            <span class="task-status" style="color: {workflowStatusColor(task.status)}; background: {workflowStatusColor(task.status)}22">{workflowLabel(task.status)}</span>
                          </td>
                          <td>{formatDate(task.deadline)}</td>
                          <td class="task-actions-col">
                            <button
                              type="button"
                              class="task-action-btn btn-ghost-view"
                              title={isOpen ? 'Tutup detail' : 'Buka detail & update progres'}
                              aria-label={isOpen ? 'Tutup detail' : 'Buka detail & update progres'}
                              onclick={(e) => { e.stopPropagation(); toggleTaskRow(task.id, [task]); }}
                            >
                              <span>{isOpen ? 'Tutup' : 'Update'}</span>
                            </button>
                          </td>
                        </tr>
                        {#if isOpen}
                          <tr class="task-row-detail">
                            <td colspan="7">
                              <div class="task-accordion">
                                {#if isTaskReturned(task)}
                                  {@const ret = getReturnInfo(task)}
                                  {#if ret}
                                    <div class="task-return-banner">
                                      <div class="return-banner-top">
                                        <div class="return-banner-title">
                                          <span class="return-banner-badge">TASK DIKEMBALIKAN (RETURN) OLEH ADMIN</span>
                                          <span class="return-banner-meta">Oleh: <strong>{ret.actor}</strong> {ret.at ? `· ${formatDate(ret.at)}` : ''}</span>
                                        </div>
                                        {#if !isAdminOrManager}
                                          <span class="return-readonly-tag">Mode Teknis · Hanya Lihat</span>
                                        {/if}
                                      </div>
                                      <div class="return-banner-body">
                                        <span class="return-banner-note-label">Catatan / Alasan Return untuk Tim Teknis:</span>
                                        <blockquote class="return-banner-quote">"{ret.note}"</blockquote>
                                        {#if ret.evidence_id}
                                          <div class="return-banner-evidence">
                                            <a href="/api/evidences/{ret.evidence_id}/file" target="_blank" rel="noopener noreferrer" class="return-evidence-btn">
                                              Buka File Lampiran Bukti dari Admin
                                            </a>
                                          </div>
                                        {/if}
                                      </div>
                                    </div>
                                  {/if}
                                {/if}
                                <div class="pm-task-detail-card">
                                  <!-- Header: Status % dan Posisi Task di Kanannya -->
                                  <div class="pm-task-header-row">
                                    <div class="pm-task-progress-box">
                                      <span class="pm-metric-label">Status & Progress</span>
                                      <div class="pm-progress-hero">
                                        <span class="pm-progress-pct" style="color: {workflowStatusColor(task.status)}">{pct}%</span>
                                        <div class="pm-progress-bar-track">
                                          <div class="pm-progress-bar-fill" style="width: {pct}%; background: {workflowStatusColor(task.status)}"></div>
                                        </div>
                                      </div>
                                      <div class="pm-status-pill-wrap">
                                        <span
                                          class="task-status"
                                          style="color: {workflowStatusColor(task.status)}; background: {workflowStatusColor(task.status)}22"
                                        >
                                          {workflowLabel(task.status)}
                                        </span>
                                        {#if isTaskReturned(task)}
                                          <span class="task-returned-badge" title="Task dalam status revisi">Returned</span>
                                        {/if}
                                      </div>
                                    </div>

                                    <!-- Posisi Task di Kanban Lifecycle -->
                                    <div class="pm-task-stage-tracker">
                                      <div class="pm-stage-header">
                                        <span class="pm-metric-label">Posisi Task (Kanban Lifecycle)</span>
                                        <span class="pm-current-pos-txt">Saat ini di: <strong>{workflowLabel(task.status)}</strong></span>
                                      </div>
                                      <div class="pm-pipeline-track">
                                        {#each workflowColumns as col, idx (col.key)}
                                          {@const isCurrent = task.status === col.key}
                                          {@const currentIdx = workflowColumns.findIndex((c) => c.key === task.status)}
                                          {@const isPast = idx < currentIdx}
                                          <div
                                            class="pm-pipeline-step"
                                            class:current={isCurrent}
                                            class:past={isPast}
                                            style="--step-col: {workflowStatusColor(col.key)}"
                                          >
                                            <div class="step-marker">
                                              {#if isCurrent}
                                                <span class="marker-dot current"></span>
                                              {:else if isPast}
                                                <span class="marker-dot past"></span>
                                              {:else}
                                                <span class="marker-dot"></span>
                                              {/if}
                                            </div>
                                            <span class="step-label">{col.label}</span>
                                            {#if isCurrent}
                                              <span class="step-sub-badge active">Posisi Sekarang</span>
                                            {/if}
                                          </div>
                                          {#if idx < workflowColumns.length - 1}
                                            <div class="pm-pipeline-connector" class:filled={idx < currentIdx}></div>
                                          {/if}
                                        {/each}
                                      </div>
                                    </div>
                                  </div>

                                  <!-- Deskripsi & Info Task -->
                                  <div class="pm-task-desc-strip">
                                    <div class="pm-desc-col">
                                      <span class="pm-metric-label">Deskripsi Task</span>
                                      <p class="pm-desc-text">{task.description || 'Tidak ada deskripsi.'}</p>
                                    </div>
                                    <div class="pm-meta-grid">
                                      <div class="meta-item">
                                        <span class="meta-lbl">Kode Task:</span>
                                        <strong>{task.code || '—'}</strong>
                                      </div>
                                      <div class="meta-item">
                                        <span class="meta-lbl">Prioritas:</span>
                                        <span class="prio-tag prio-{task.priority || 'medium'}">{task.priority || 'Medium'}</span>
                                      </div>
                                      <div class="meta-item">
                                        <span class="meta-lbl">Assignee:</span>
                                        <strong>{task.assignees?.length ? task.assignees.join(', ') : (task.assignee || '—')}</strong>
                                      </div>
                                      <div class="meta-item">
                                        <span class="meta-lbl">Deadline:</span>
                                        <strong>{formatDate(task.deadline)}</strong>
                                      </div>
                                      <div class="meta-item">
                                        <span class="meta-lbl">Dibuat Oleh:</span>
                                        <span>{task.created_by || '—'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <!-- File Evidence & Notes Evidences -->
                                  <div class="pm-section-card pm-evidence-fullwidth">
                                    <div class="pm-section-header">
                                      <div class="pm-sec-title">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                        </svg>
                                        <span>File Evidence & Notes Evidence</span>
                                      </div>
                                      <span class="pm-badge-count">{task.evidences?.length ?? 0} file</span>
                                    </div>

                                    {#if task.evidences?.length}
                                      <div class="pm-evidence-list">
                                        {#each task.evidences as ev (ev.id)}
                                          <div class="pm-evidence-item">
                                            <div class="ev-item-main">
                                              <div class="ev-file-icon">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                  <polyline points="14 2 14 8 20 8"/>
                                                </svg>
                                              </div>
                                              <div class="ev-file-texts">
                                                <a href={fileUrl(ev.file_url)} target="_blank" rel="noopener noreferrer" class="ev-filename" title={ev.name}>
                                                  {ev.name}
                                                </a>
                                                <span class="ev-uploader">
                                                  Oleh: <strong>{ev.actor || 'Teknis'}</strong>
                                                  {#if ev.size} · {formatFileSize(ev.size)}{/if}
                                                  {#if ev.at} · {formatDate(ev.at)}{/if}
                                                </span>
                                              </div>
                                              <div class="ev-item-actions">
                                                <a href={fileUrl(ev.file_url)} target="_blank" rel="noopener noreferrer" class="ev-btn-view" title="Buka / download lampiran">
                                                  <span>Buka</span>
                                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                                    <polyline points="15 3 21 3 21 9"/>
                                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                            <!-- Notes evidences -->
                                            <div class="ev-note-container" class:empty={!ev.note}>
                                              <span class="ev-note-badge">Catatan Evidence:</span>
                                              {#if ev.note}
                                                <span class="ev-note-quote">"{ev.note}"</span>
                                              {:else}
                                                <span class="ev-note-quote-empty">Tidak ada catatan untuk file ini.</span>
                                              {/if}
                                            </div>
                                          </div>
                                        {/each}
                                      </div>
                                    {:else}
                                      <div class="pm-empty-placeholder">
                                        <p>Belum ada file evidence yang dilampirkan pada task ini.</p>
                                      </div>
                                    {/if}
                                  </div>

                                  <!-- Interactive Update Form & Controls -->
                                  {#if !canUpdateTaskProgress(task)}
                                    <div class="task-readonly-notice">
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                      </svg>
                                      <span>Mode lihat — Anda memiliki hak akses pantau (read-only) untuk task ini.</span>
                                    </div>
                                  {:else}
                                    <div class="task-new-submission-box">
                                      <div class="submission-box-header">
                                        <div class="submission-title-wrap">
                                          <span class="submission-title">Update Progres & Status Task</span>
                                          <span class="submission-target-pill">Target: {progressDraft}% ({workflowLabel(statusForProgress(progressDraft))})</span>
                                        </div>
                                      </div>

                                      <div class="submission-box-grid">
                                        <!-- Kiri: Slider Target Progres -->
                                        <div class="task-form-field submission-slider-col">
                                          <span class="field-title">Geser Target Progres:</span>
                                          <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={progressDraft}
                                            oninput={(e) => {
                                              progressDraft = Number(e.currentTarget.value);
                                              kanbanDraftStatus = statusForProgress(progressDraft);
                                            }}
                                            onclick={(e) => e.stopPropagation()}
                                          />
                                          <div class="task-progress-readout">
                                            <b>{progressDraft}%</b>
                                            <span class="task-progress-hint">Posisi saat ini: <strong>{displayProgress(task)}% ({workflowLabel(task.status)})</strong></span>
                                          </div>
                                        </div>

                                        <!-- Kanan: Upload Evidence untuk Progres Ini -->
                                        <div class="task-form-field submission-evidence-col">
                                          <span class="field-title">Upload Evidence untuk Progres {progressDraft}%:</span>
                                          {#if pickedEvidenceFiles.length > 0}
                                            <div class="task-evidence-staged-box">
                                              <span class="staged-box-label">File Dipilih ({pickedEvidenceFiles.length}):</span>
                                              <div class="staged-file-chips">
                                                {#each pickedEvidenceFiles as file, idx}
                                                  <span class="staged-chip">
                                                    <span class="chip-name" title={file.name}>{file.name}</span>
                                                    <span class="chip-size">({formatFileSize(file.size)})</span>
                                                    <button
                                                      type="button"
                                                      class="btn-remove-staged"
                                                      onclick={() => removePickedEvidenceFile(idx)}
                                                      title="Hapus file ini"
                                                      style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; font-weight:700; padding:0 2px; line-height:1;"
                                                    >×</button>
                                                  </span>
                                                {/each}
                                              </div>
                                            </div>
                                          {/if}

                                          <div class="task-evidence-bar">
                                            <input
                                              type="text"
                                              class="task-evidence-note"
                                              placeholder={pickedEvidenceFiles.length > 0 ? "Catatan untuk file evidence ini..." : `Catatan evidence untuk ${progressDraft}% (opsional)...`}
                                              bind:value={evidenceNote}
                                              disabled={evidenceUploading}
                                            />
                                            <label class="task-evidence-file-btn" class:has-files={pickedEvidenceFiles.length > 0}>
                                              <input
                                                type="file"
                                                multiple
                                                accept="image/*,.pdf"
                                                onchange={onSelectEvidenceFiles}
                                                disabled={evidenceUploading}
                                              />
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                              </svg>
                                              <span>{pickedEvidenceFiles.length > 0 ? '+ Tambah File' : 'Pilih File Evidence'}</span>
                                            </label>

                                            {#if pickedEvidenceFiles.length > 0}
                                              <button
                                                type="button"
                                                class="task-evidence-btn-upload"
                                                disabled={evidenceUploading}
                                                onclick={() => submitEvidenceFiles(task)}
                                                title="Upload file evidence beserta catatannya"
                                              >
                                                {#if evidenceUploading}
                                                  <span class="btn-spinner sm"></span>
                                                  <span>Mengupload...</span>
                                                {:else}
                                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                    <polyline points="17 8 12 3 7 8"/>
                                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                                  </svg>
                                                  <span>Upload Evidence</span>
                                                {/if}
                                              </button>

                                              <button
                                                type="button"
                                                class="task-evidence-btn-cancel"
                                                disabled={evidenceUploading}
                                                onclick={cancelPickedEvidence}
                                                title="Batal pilih file"
                                              >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                                <span>Batal</span>
                                              </button>
                                            {/if}
                                          </div>
                                          {#if evidenceUploading}<p class="task-evidence-picked">Mengupload file evidence untuk {progressDraft}%...</p>{/if}
                                          {#if evidenceError}<p class="field-error">{evidenceError}</p>{/if}

                                          {#if evidencesForProgress(task, progressDraft).length > 0}
                                            <div class="task-draft-ev-list">
                                              {#each evidencesForProgress(task, progressDraft) as ev (ev.id)}
                                                <span class="task-draft-ev-item">
                                                  <a href={fileUrl(ev.file_url)} target="_blank" rel="noopener noreferrer">{ev.name}</a>
                                                  {#if ev.note}<small>("{ev.note}")</small>{/if}
                                                </span>
                                              {/each}
                                            </div>
                                          {:else}
                                            <p class="task-draft-ev-empty">Belum ada file evidence khusus untuk milestone {progressDraft}% ini.</p>
                                          {/if}
                                        </div>
                                      </div>

                                      <!-- Mini Kanban Track -->
                                      <div class="task-mini-kanban">
                                        <span class="task-accordion-label">Kanban — geser card atau klik kolom tujuan untuk update status langsung</span>
                                        <div class="task-mini-kanban-track">
                                          {#each workflowColumns as col (col.key)}
                                            {@const isCardHere = (kanbanDraftStatus || task.status) === col.key}
                                            <div
                                              class="task-mini-kanban-col"
                                              class:current={task.status === col.key}
                                              class:has-card={isCardHere}
                                              style="--col-color: {workflowStatusColor(col.key)}; cursor: pointer;"
                                              ondragover={onKanbanColDragOver}
                                              ondrop={(e) => onKanbanColDrop(e, col.key)}
                                              onclick={(e) => {
                                                e.stopPropagation();
                                                kanbanDraftStatus = col.key;
                                                progressDraft = progressForStatus(col.key);
                                              }}
                                              role="list"
                                              aria-label={col.label}
                                            >
                                              <span class="task-mini-kanban-col-label">{col.label}</span>
                                              {#if isCardHere}
                                                <div
                                                  class="task-mini-kanban-card"
                                                  draggable="true"
                                                  ondragstart={onKanbanCardDragStart}
                                                  onclick={(e) => e.stopPropagation()}
                                                  role="listitem"
                                                >{task.title}</div>
                                              {/if}
                                            </div>
                                          {/each}
                                        </div>
                                        {#if progressError}<p class="field-error">{progressError}</p>{/if}
                                        <div class="task-kanban-actions">
                                          <button
                                            type="button"
                                            class="task-action-btn task-progress-apply"
                                            disabled={progressBusy || !canApplyProgress}
                                            title="Terapkan perubahan progress dan status task langsung"
                                            onclick={(e) => { e.stopPropagation(); applyProgress(task); }}
                                          >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                              <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>{progressBusy ? 'Menerapkan...' : 'Terapkan (Apply)'}</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  {/if}

                                  <!-- Row Paling Bawah Accordion: Simplified Journey Progress Task -->
                                  {@render taskJourneySnippet(task)}
                                </div>
                            </td>
                          </tr>
                        {/if}
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            {/if}
          </section>
        </div>

        {/if}
      </div>
    </GlassPanel>

<RegistryInviteModal bind:inviteOpen bind:dashboard={selectedDetail} onInvite={addMember} />

{#if attachReqId}
  <div class="req-detail-backdrop" use:portal role="presentation" onclick={closeAttach}></div>
  <div class="attach-pop" use:portal role="dialog" aria-modal="true" aria-label="Attachment">
    <header>
      <div>
        <p>Attachment</p>
        <h3>{attachTitle}</h3>
      </div>
      <button type="button" onclick={closeAttach} aria-label="Close">×</button>
    </header>
    {#if attachFiles.length}
      <ul>
        {#each attachFiles as file (file.id)}
          <li>
            <button type="button" onclick={() => useAttachment(file.id, 'open')}>
              <em>{attachmentKindLabel(file.kind, file.name)}</em>
              <span>{file.name}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="attach-empty">No attachments yet.</p>
    {/if}
  </div>
{/if}

{#if acceptModalTaskId}
  {@const task = versionTasks.find((t) => String(t.id) === String(acceptModalTaskId))}
  {#if task}
    <div class="req-detail-backdrop approval-backdrop-blur" use:portal role="presentation" onclick={closeAcceptModal}></div>
    <div class="approval-action-modal approval-theme-accept" use:portal role="dialog" aria-modal="true" aria-label="Accept task">
      <header class="approval-modal-head">
        <div class="approval-head-left">
          <div class="approval-badge-pill pill-accept">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
            <span>Accept Task / Persetujuan</span>
          </div>
          <h3 class="approval-modal-title">{task.title}</h3>
        </div>
        <button type="button" class="approval-modal-close" onclick={closeAcceptModal} aria-label="Tutup modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <div class="approval-modal-body">
        <div class="approval-meta-box">
          <div class="approval-meta-top">
            <div class="approval-assignee">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span class="meta-label">Tim Teknis:</span>
              <strong class="meta-value">{task.assignees?.length ? task.assignees.join(', ') : '—'}</strong>
            </div>
            <span class="approval-status-badge" style="color: {workflowStatusColor(task.status)}; background: {workflowStatusColor(task.status)}18; border-color: {workflowStatusColor(task.status)}40">
              <span class="status-dot" style="background: {workflowStatusColor(task.status)}"></span>
              {workflowLabel(task.status)}
            </span>
          </div>

          <div class="approval-notice notice-accept">
            <svg class="notice-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="9 12 12 15 16 10"></polyline>
            </svg>
            <div class="notice-text">
              {#if task.status_move}
                Permintaan pindah status ke <strong>{workflowLabel(task.status_move.to)}</strong> akan disetujui (Approved).
              {:else if isTaskReturned(task)}
                Task yang sebelumnya dikembalikan akan disetujui kembali (Approved) oleh PIC/Admin.
              {:else}
                Task ini akan disetujui (Approved) oleh PIC/Admin.
              {/if}
            </div>
          </div>
        </div>

        <div class="approval-field-group">
          <label class="approval-field-label" for="accept-note-input">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Catatan / Keterangan Persetujuan</span>
            <span class="field-hint">(Opsional)</span>
          </label>
          <textarea
            id="accept-note-input"
            class="approval-textarea"
            rows="3"
            placeholder="Tuliskan catatan atau instruksi persetujuan untuk tim teknis (opsional)..."
            bind:value={acceptNote}
          ></textarea>
        </div>

        <div class="approval-field-group">
          <span class="approval-field-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <span>Evidence / Lampiran Bukti</span>
            <span class="field-hint">(Opsional)</span>
          </span>

          {#if !acceptEvidence}
            <label class="approval-dropzone">
              <input
                type="file"
                class="sr-only-input"
                accept="image/*,.pdf"
                onchange={pickAcceptEvidence}
              />
              <div class="dropzone-content">
                <div class="dropzone-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div class="dropzone-texts">
                  <span class="dropzone-title">Pilih file bukti atau tarik ke sini</span>
                  <span class="dropzone-sub">Format gambar (PNG, JPG, WEBP) atau PDF (Maks. 10MB)</span>
                </div>
              </div>
            </label>
          {:else}
            <div class="approval-file-card">
              <div class="file-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="file-card-meta">
                <span class="file-card-name" title={acceptEvidence.name}>{acceptEvidence.name}</span>
                <span class="file-card-size">{formatBytes(acceptEvidence.size)} · Siap dilampirkan</span>
              </div>
              <button
                type="button"
                class="file-card-remove"
                title="Hapus file lampiran"
                onclick={() => { acceptEvidence = null; acceptEvidenceError = ''; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          {/if}
          {#if acceptEvidenceError}<p class="approval-field-error">{acceptEvidenceError}</p>{/if}
        </div>
      </div>

      <footer class="approval-modal-foot">
        <button type="button" class="btn-approval-cancel" onclick={closeAcceptModal}>Batal</button>
        <button
          type="button"
          class="btn-approval-confirm btn-accept"
          disabled={acceptBusy || !canDecideApproval(task)}
          onclick={() => submitAccept(task)}
        >
          {#if acceptBusy}
            <span class="spinner-dot"></span>
            Menyetujui...
          {:else}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Accept Task
          {/if}
        </button>
      </footer>
    </div>
  {/if}
{/if}

{#if returnModalTaskId}
  {@const task = versionTasks.find((t) => String(t.id) === String(returnModalTaskId))}
  {#if task}
    <div class="req-detail-backdrop approval-backdrop-blur" use:portal role="presentation" onclick={closeReturnModal}></div>
    <div class="approval-action-modal approval-theme-return" use:portal role="dialog" aria-modal="true" aria-label="Return task ke tim teknis">
      <header class="approval-modal-head">
        <div class="approval-head-left">
          <div class="approval-badge-pill pill-return">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Return Task ke Tim Teknis</span>
          </div>
          <h3 class="approval-modal-title">{task.title}</h3>
        </div>
        <button type="button" class="approval-modal-close" onclick={closeReturnModal} aria-label="Tutup modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <div class="approval-modal-body">
        <div class="approval-meta-box">
          <div class="approval-meta-top">
            <div class="approval-assignee">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span class="meta-label">Tim Teknis:</span>
              <strong class="meta-value">{task.assignees?.length ? task.assignees.join(', ') : '—'}</strong>
            </div>
            <span class="approval-status-badge" style="color: {workflowStatusColor(task.status)}; background: {workflowStatusColor(task.status)}18; border-color: {workflowStatusColor(task.status)}40">
              <span class="status-dot" style="background: {workflowStatusColor(task.status)}"></span>
              {workflowLabel(task.status)}
            </span>
          </div>

          <div class="approval-notice notice-return">
            <svg class="notice-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div class="notice-text">
              {#if task.status_move}
                Permintaan pindah status ke <strong>{workflowLabel(task.status_move.to)}</strong> akan dikembalikan (Return) untuk direvisi oleh tim teknis.
              {:else}
                Task akan dikembalikan ke tim teknis untuk revisi / perbaikan.
              {/if}
            </div>
          </div>
        </div>

        <div class="approval-field-group">
          <label class="approval-field-label" for="return-desc-input">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Deskripsi / Catatan Perbaikan untuk Tim Teknis <strong class="req-asterisk">*</strong></span>
          </label>
          <textarea
            id="return-desc-input"
            class="approval-textarea"
            rows="3"
            placeholder="Tuliskan deskripsi/alasan return secara jelas agar tim teknis mengetahui bagian apa yang perlu diperbaiki..."
            bind:value={returnDescription}
            required
          ></textarea>
          {#if returnValidationError}<p class="approval-field-error">{returnValidationError}</p>{/if}
        </div>

        <div class="approval-field-group">
          <span class="approval-field-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <span>Evidence / Lampiran Bukti</span>
            <span class="field-hint">(Opsional)</span>
          </span>

          {#if !returnEvidence}
            <label class="approval-dropzone">
              <input
                type="file"
                class="sr-only-input"
                accept="image/*,.pdf"
                onchange={pickReturnEvidence}
              />
              <div class="dropzone-content">
                <div class="dropzone-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div class="dropzone-texts">
                  <span class="dropzone-title">Pilih file bukti atau tarik ke sini</span>
                  <span class="dropzone-sub">Format gambar (PNG, JPG, WEBP) atau PDF (Maks. 10MB)</span>
                </div>
              </div>
            </label>
          {:else}
            <div class="approval-file-card">
              <div class="file-card-icon file-card-icon-return">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="file-card-meta">
                <span class="file-card-name" title={returnEvidence.name}>{returnEvidence.name}</span>
                <span class="file-card-size">{formatBytes(returnEvidence.size)} · Siap dilampirkan</span>
              </div>
              <button
                type="button"
                class="file-card-remove"
                title="Hapus file lampiran"
                onclick={() => { returnEvidence = null; returnEvidenceError = ''; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          {/if}
          {#if returnEvidenceError}<p class="approval-field-error">{returnEvidenceError}</p>{/if}
        </div>
      </div>

      <footer class="approval-modal-foot">
        <button type="button" class="btn-approval-cancel" onclick={closeReturnModal}>Batal</button>
        <button
          type="button"
          class="btn-approval-confirm btn-return"
          disabled={returnBusy || !returnDescription.trim() || !canDecideApproval(task)}
          onclick={() => submitReturn(task)}
        >
          {#if returnBusy}
            <span class="spinner-dot"></span>
            Mengembalikan...
          {:else}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Return ke Tim Teknis
          {/if}
        </button>
      </footer>
    </div>
  {/if}
{/if}

{#if manageAssigneeTaskId}
  {@const task = versionTasks.find((t) => t.id === manageAssigneeTaskId)}
  {#if task}
    <div class="req-detail-backdrop" use:portal role="presentation" onclick={closeManageAssignee}></div>
    <div class="attach-pop manage-assignee-modal" use:portal role="dialog" aria-modal="true" aria-label="Kelola Assignee">
      <header>
        <div>
          <p class="pop-eyebrow">Penugasan Task (Assignment)</p>
          <h3>{task.title}</h3>
        </div>
        <button type="button" onclick={closeManageAssignee} aria-label="Close">×</button>
      </header>

      <div class="assignee-tabs">
        <button
          type="button"
          class="assignee-tab"
          class:active={assigneeModalTab === 'add'}
          onclick={() => { assigneeModalTab = 'add'; addAssigneeError = ''; }}
        >
          <span class="tab-badge-icon add">+</span>
          <span>Tambah Assignee</span>
        </button>
        <button
          type="button"
          class="assignee-tab"
          class:active={assigneeModalTab === 'remove'}
          onclick={() => { assigneeModalTab = 'remove'; removeAssigneeError = ''; }}
        >
          <span class="tab-badge-icon remove">−</span>
          <span>Hapus Assignee ({task.assignees?.length || 0})</span>
        </button>
      </div>

      {#if assigneeModalTab === 'add'}
        <form onsubmit={(e) => { e.preventDefault(); submitAddAssignee(task); }} class="assignee-tab-panel">
          <label class="add-assignee-field">
            <span>Pilih Anggota Tim Teknis</span>
            <select bind:value={newAssigneeName}>
              <option value="">Pilih teknis untuk ditugaskan...</option>
              {#each requirementTeamRoster().filter((m) => !(task.assignees || []).includes(m.name)) as member (member.name)}
                <option value={member.name}>{member.name}</option>
              {/each}
            </select>
          </label>
          {#if addAssigneeError}<p class="attach-empty error-text">{addAssigneeError}</p>{/if}

          {#if task.assignees?.length}
            <div class="current-assignees-summary">
              <span class="sub-label">Assignee saat ini:</span>
              <div class="assignee-chip-list">
                {#each task.assignees as name (name)}
                  <span class="assignee-chip">
                    <i class="chip-avatar">{initials(name)}</i>
                    {name}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <div class="approval-row-actions">
            <button type="button" class="approval-reject" onclick={closeManageAssignee}>Tutup</button>
            <button type="submit" class="approval-accept btn-add-submit" disabled={!newAssigneeName || addingAssignee}>
              {addingAssignee ? 'Menambahkan...' : '+ Tambah Assignee'}
            </button>
          </div>
        </form>
      {:else}
        <div class="assignee-tab-panel">
          {#if !task.assignees?.length}
            <div class="empty-assignee-state">
              <p>Belum ada assignee pada task ini.</p>
              <button type="button" class="btn-switch-add" onclick={() => (assigneeModalTab = 'add')}>
                + Tambah Assignee Sekarang
              </button>
            </div>
          {:else}
            <p class="sub-label">Pilih assignee yang ingin dihapus dari task ini:</p>
            <div class="remove-assignee-list">
              {#each task.assignees as name (name)}
                <div class="remove-assignee-item">
                  <div class="user-info">
                    <span class="chip-avatar">{initials(name)}</span>
                    <strong class="user-name">{name}</strong>
                  </div>
                  <button
                    type="button"
                    class="btn-delete-row"
                    title={`Hapus ${name} dari task`}
                    disabled={removingAssignee}
                    onclick={() => deleteSpecificAssignee(task, name)}
                  >
                    <span class="minus-sign">−</span>
                    <span>Hapus</span>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
          {#if removeAssigneeError}<p class="attach-empty error-text">{removeAssigneeError}</p>{/if}

          <div class="approval-row-actions">
            <button type="button" class="approval-reject" onclick={closeManageAssignee}>Selesai</button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
{/if}

{#if readOnlyReturnTaskId}
  {@const task = versionTasks.find((t) => String(t.id) === String(readOnlyReturnTaskId))}
  {#if task}
    {@const ret = getReturnInfo(task)}
    <div class="req-detail-backdrop" use:portal role="presentation" onclick={() => (readOnlyReturnTaskId = '')}></div>
    <div class="attach-pop approval-pop-modal readonly-return-pop" use:portal role="dialog" aria-modal="true" aria-label="Catatan Return dari Admin">
      <header class="return-modal-head">
        <div class="return-head-left">
          <div class="return-badge-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Catatan Pengembalian (Return)</span>
          </div>
          <h3 class="return-modal-title">{task.title}</h3>
        </div>
        <button type="button" class="return-modal-close" onclick={() => (readOnlyReturnTaskId = '')} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <div class="return-modal-body">
        <div class="return-meta-card">
          <div class="return-meta-top">
            <div class="return-assignee">
              <span class="meta-label">Tim Teknis:</span>
              <strong class="meta-value">{task.assignees?.length ? task.assignees.join(', ') : '—'}</strong>
            </div>
            <span class="return-status-badge">
              <span class="status-dot"></span>
              Needs Revision
            </span>
          </div>
          <div class="return-meta-bottom">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Dikembalikan oleh <strong>{ret?.actor || 'Admin'}</strong></span>
            {#if ret?.at}<span>· {formatDate(ret.at)}</span>{/if}
          </div>
        </div>

        <div class="return-note-section">
          <span class="return-section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Catatan Perbaikan untuk Tim Teknis:
          </span>
          <div class="return-note-box">
            <p>{ret?.note || 'Tidak ada catatan tertulis.'}</p>
          </div>
        </div>

        {#if ret?.evidence_id}
          <div class="return-evidence-card">
            <div class="evidence-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <div class="evidence-info">
              <span class="evidence-title">Lampiran Bukti dari Admin</span>
              <span class="evidence-sub">File bukti/screenshot hasil review</span>
            </div>
            <a href="/api/evidences/{ret.evidence_id}/file" target="_blank" rel="noopener noreferrer" class="btn-evidence-view">
              Buka File ↗
            </a>
          </div>
        {/if}

        <div class="return-guidance-callout">
          <svg class="guidance-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div class="guidance-content">
            <strong>Mode Tim Teknis (Hanya Lihat):</strong>
            <span>Task ini dikembalikan untuk revisi. Silakan periksa instruksi di atas dan perbarui pekerjaan Anda.</span>
          </div>
        </div>
      </div>

      <footer class="return-modal-footer">
        <button type="button" class="btn-return-dismiss" onclick={() => (readOnlyReturnTaskId = '')}>
          Tutup
        </button>
      </footer>
    </div>
  {/if}
{/if}

<PmCreateTaskModal
  open={taskCreateOpen}
  dashboard={dashName}
  requirementId={activeVersion?.id ?? null}
  onClose={() => (taskCreateOpen = false)}
/>

{#if versionOpen && activeVersion}
  <div class="req-create-backdrop" use:portal role="presentation" onclick={closeVersionCreate}></div>
  <form class="req-create" use:portal onsubmit={submitVersionCreate}>
    <header>
      <h3>Add Version</h3>
      <button type="button" onclick={closeVersionCreate} aria-label="Close">×</button>
    </header>
    <p class="version-hint">A new version of this requirement. Tasks from the previous version are not copied.</p>
    <label>
      <span>Title</span>
      <input bind:value={versionTitle} maxlength="100" placeholder="New version title" required />
    </label>
    <label>
      <span>Description</span>
      <textarea rows="3" maxlength="600" bind:value={versionDescription} placeholder="Scope of this version" required></textarea>
    </label>
    <div class="version-assignees">
      <span>Assignees</span>
      {#if versionAssigneePool.length === 0}
        <p class="version-empty">No active engineers.</p>
      {:else}
        <div class="team-picker">
          {#each versionAssigneePool as name (name)}
            <label class="team-check">
              <input type="checkbox" checked={versionTeam.includes(name)} onchange={() => toggleVersionAssignee(name)} />
              <span>{name}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
    {#if versionError}<p>{versionError}</p>{/if}
    <div class="req-create-actions">
      <button type="button" onclick={closeVersionCreate}>Cancel</button>
      <button type="submit" disabled={versionSaving} style="display:inline-flex;align-items:center;gap:7px;">
        {#if versionSaving}
          <span class="btn-spinner sm"></span>
          <span>Saving…</span>
        {:else}
          <span>Create Version</span>
        {/if}
      </button>
    </div>
  </form>
{/if}

<RegistryEditModal bind:editOpen bind:dashboard={selectedDetail} />

