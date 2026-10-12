<script>
  import GlassPanel from '$lib/GlassPanel.svelte';
  import { goto } from '$app/navigation';
  import TaskList from '../../../routes/tasks/list/+page.svelte';
  import TaskDetail from '../../../routes/tasks/[id]/+page.svelte';
  import TaskBoard from '../../../routes/tasks/board/+page.svelte';
  import { getDashboard, registryStatusLabel, updateDashboard } from '$lib/registryStore.svelte.js';
  import {
    canCreateDashboard,
    canCreateRequirement,
    canCreateTask,
    canEditField,
    isOverdue,
    listInboxTasks,
    listModuleTasks,
    tasksForRequirement,
    taskModuleStore,
    tasksByColumn,
    workflowColumns,
    workflowLabel,
    workflowStatusColor,
  } from '$lib/taskModuleStore.svelte.js';
  import {
    createRequirementVersion,
    groupByVersionRoot,
    listRequirements,
    requirementTeamRoster,
    rememberDetailId as rememberRequirementId,
    requirementStore,
  } from '$lib/requirementStore.svelte.js';
  import { formatDate } from '$lib/format.js';
  import { activityLogStore, listActivityLogs, loadActivityLogsFromApi } from '$lib/activityLogStore.svelte.js';
  import { attachmentKindLabel, attachmentStore, listAttachments, loadAttachmentsFromApi, useAttachment } from '$lib/attachmentStore.svelte.js';
  import { portal } from '$lib/portal.js';
  import AttachmentPanel from '$lib/AttachmentPanel.svelte';
  import RegistryInviteModal from './RegistryInviteModal.svelte';
  import PmCreateTaskModal from '$lib/PmCreateTaskModal.svelte';

  let { selectedDetail = $bindable(), detailActiveTab = $bindable("overview"), selectedSopItem = $bindable() } = $props();
  void detailActiveTab;

  let inviteOpen = $state(false);
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

  const canEdit = $derived(canEditField() || canCreateDashboard());
  const dashboardCode = $derived.by(() => {
    const raw = String(selectedDetail?.code || '').trim().toUpperCase();
    if (raw.startsWith('EDM-')) return raw;
    if (raw) return `EDM-${raw}`;
    const initials = String(selectedDetail?.name || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 6)
      .toUpperCase();
    return `EDM-${initials || 'DB'}`;
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

  $effect(() => {
    if (dashName === seenDash) return;
    seenDash = dashName;
    work = 'overview';
    attachReqId = '';
    focusTaskId = '';
    selectedVersionId = '';
    showSecret = '';
  });

  /** @param {number | string} id */
  function openRequirement(id) {
    rememberRequirementId(id);
    goto(`/requirements/${id}`);
  }

  /**
   * @param {number | string} id
   * @param {'kanban' | 'tasks' | 'requirement'} from
   */
  function openTask(id, from) {
    focusTaskId = String(id);
    taskFrom = from;
    work = 'task';
  }

  function closeTask() {
    focusTaskId = '';
    work = taskFrom === 'requirement' ? 'requirement' : taskFrom;
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

  const versionProgress = $derived.by(() => {
    const total = versionTasks.length;
    const done = versionTasks.filter((task) => task.status === 'selesai').length;
    return { total, pct: total ? Math.round((done / total) * 100) : 0 };
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
    const done = tasks.filter((task) => task.status === 'selesai').length;
    return { total, pct: total ? Math.round((done / total) * 100) : 0 };
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
    return profileSpec.map((field) => ({
      id: `meta:${field.key}`,
      label: field.label,
      value: String(meta[field.key] || ''),
    }));
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
  /** @type {'grid' | 'kanban'} */
  let taskLayout = $state('grid');

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
              <span class="sheet-k">{field.label}</span>
              <input
                class="fact-input"
                type={field.kind === 'secret' ? 'password' : 'text'}
                bind:value={draftValue}
                placeholder={field.kind === 'secret' ? 'Password' : 'Nilai'}
                maxlength="200"
                autocomplete="off"
              />
              <div class="fact-actions">
                <button type="submit" class="fact-icon edit" disabled={saving}>Save</button>
                <button type="button" class="fact-icon" onclick={cancelEdit}>Cancel</button>
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
        {:else if work === 'tasks' || work === 'task'}
          <button type="button" class="progress-link work-back" onclick={() => (work === 'task' ? closeTask() : (work = 'overview'))}>← Back</button>
        {/if}
        {#if work === 'tasks'}
          <div class="work-surface">
            <TaskList
              lockedDashboard={dashName}
              embedded
              onOpenTask={(id) => openTask(id, 'tasks')}
              onOpenBoard={() => (work = 'overview')}
            />
          </div>
        {:else if work === 'task'}
          <div class="work-surface">
            {#key focusTaskId}
              <TaskDetail taskId={focusTaskId} embedded onBack={closeTask} />
            {/key}
          </div>
        {:else if work !== 'source' && work !== 'activity'}
        <div class="sheet">
          <div class="sheet-facts">
            <div class="sheet-fact">
              <span>Unit</span>
              <strong>{selectedDetail.category || selectedDetail.platform || '—'}</strong>
            </div>
            <div class="sheet-fact">
              <span>Created</span>
              <strong>{formatDateDisplay(selectedDetail.created_at)}</strong>
            </div>
            <div class="sheet-fact sheet-fact-wide">
              <span>PIC</span>
              {#if ownerField && editingKey === ownerField.id}
                <form class="fact-edit" onsubmit={saveEdit}>
                  <input class="fact-input" bind:value={draftValue} placeholder="PIC name" maxlength="200" />
                  <div class="fact-actions">
                    <button type="submit" class="fact-icon edit" disabled={saving}>Save</button>
                    <button type="button" class="fact-icon" onclick={cancelEdit}>Cancel</button>
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
                    <span>{field.label}</span>
                    <input class="fact-input" bind:value={draftValue} placeholder="Nilai" maxlength="200" />
                    <div class="fact-actions">
                      <button type="submit" class="fact-icon edit" disabled={saving}>Save</button>
                      <button type="button" class="fact-icon" onclick={cancelEdit}>Cancel</button>
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
                    <input class="fact-input" bind:value={draftValue} placeholder="https://..." maxlength="500" />
                    <div class="fact-actions">
                      <button type="submit" class="fact-icon edit" disabled={saving}>Save</button>
                      <button type="button" class="fact-icon" onclick={cancelEdit}>Cancel</button>
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
                    <input class="fact-input" bind:value={draftValue} placeholder="https://..." maxlength="500" />
                    <div class="fact-actions">
                      <button type="submit" class="fact-icon edit" disabled={saving}>Save</button>
                      <button type="button" class="fact-icon" onclick={cancelEdit}>Cancel</button>
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
                <h3 class="sheet-section-title">Requirement</h3>
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
                <div class="req-picks" role="tablist" aria-label="Requirement">
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
                  <button type="button" class="req-sheet-title" onclick={() => openRequirement(activeVersion.id)}>{activeVersion.title}</button>
                  <p>{activeVersion.description || '—'}</p>
                  <div class="req-meta">
                    <span><em>Created</em> {formatDate(activeVersion.created_at)}</span>
                    <span><em>Due Date</em> {formatDate(activeVersion.due_date)}</span>
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
                <h3>Task · V{activeVersion.version_no}</h3>
                <div class="sheet-switch" role="group" aria-label="Task view">
                  <button type="button" class:on={taskLayout === 'grid'} onclick={() => (taskLayout = 'grid')}>List Task</button>
                  <span>/</span>
                  <button type="button" class:on={taskLayout === 'kanban'} onclick={() => (taskLayout = 'kanban')}>Kanban</button>
                </div>
              </header>
              {#if taskLayout === 'kanban'}
                <div class="sheet-kanban">
                  {#key activeVersion.id}
                    <TaskBoard
                      lockedDashboard={dashName}
                      initialRequirement={String(activeVersion.id)}
                      embedded
                      flow
                      onOpenTask={(id) => openTask(id, 'tasks')}
                    />
                  {/key}
                </div>
              {:else if versionTasks.length === 0}
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
                      </tr>
                    </thead>
                    <tbody>
                      {#each versionTasks as task (task.id)}
                        <tr class:late={isOverdue(task)}>
                          <td>{task.title}</td>
                          <td>{task.pic || task.assignee || '—'}</td>
                          <td>{task.evidences?.length || '—'}</td>
                          <td>
                            <span class="prog-bar" title="{taskProgress(task.status)}%">
                              <span class="prog-track"><i style="width: {taskProgress(task.status)}%; background: {workflowStatusColor(task.status)}"></i></span>
                              <b>{taskProgress(task.status)}%</b>
                            </span>
                          </td>
                          <td>
                            <span class="task-status" style="color: {workflowStatusColor(task.status)}; background: {workflowStatusColor(task.status)}22">{workflowLabel(task.status)}</span>
                          </td>
                          <td>{formatDate(task.deadline)}</td>
                        </tr>
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
      <button type="submit" disabled={versionSaving}>{versionSaving ? 'Saving…' : 'Create Version'}</button>
    </div>
  </form>
{/if}
