<script>
  import { untrack } from 'svelte';
  import { portal } from '$lib/portal.js';
  import { updateDashboard } from '$lib/registryStore.svelte.js';
  import { listUsers } from '$lib/accessStore.svelte.js';
  import {
    listRequirements,
    createRequirement,
    updateRequirement,
    requirementTeamRoster,
  } from '$lib/requirementStore.svelte.js';
  import { addAttachments } from '$lib/attachmentStore.svelte.js';

  let {
    editOpen = $bindable(false),
    dashboard = $bindable(null),
    pmOptions: customPmOptions = null
  } = $props();

  const teknisRoster = $derived(requirementTeamRoster());
  const allActiveUsers = $derived(listUsers({ status: 'active' }));
  const activePmUsers = $derived(listUsers({ role: 3, status: 'active' }));
  const effectivePmOptions = $derived.by(() => {
    if (customPmOptions && customPmOptions.length > 0) return customPmOptions;
    if (activePmUsers && activePmUsers.length > 0) return activePmUsers;
    return allActiveUsers;
  });

  const steps = [
    { title: 'Identitas', desc: 'Name, unit & PIC' },
    { title: 'Teknologi', desc: 'Framework, backend, front end' },
    { title: 'Infrastructure', desc: 'Development & production' },
    { title: 'First Requirement', desc: 'Name, description & due date' },
  ];

  const profileSpec = [
    { key: 'framework', label: 'Framework', placeholder: 'Contoh: SvelteKit' },
    { key: 'framework_version', label: 'Framework Version', placeholder: 'Contoh: 2.5' },
    { key: 'backend', label: 'Backend', placeholder: 'Contoh: CodeIgniter' },
    { key: 'backend_version', label: 'Backend Version', placeholder: 'Contoh: 4.5' },
    { key: 'frontend', label: 'Front End', placeholder: 'Contoh: Svelte' },
  ];

  const envSpec = [
    { key: 'db', label: 'Database Engine', placeholder: 'Contoh: PostgreSQL' },
    { key: 'ip', label: 'IP Address', placeholder: 'Contoh: 10.0.0.12' },
    { key: 'db_name', label: 'Database Name', placeholder: 'Database name' },
    { key: 'db_user', label: 'Database Username', placeholder: 'Database username' },
    { key: 'db_pass', label: 'Password', placeholder: 'Database password', secret: true },
  ];

  const envs = [
    { key: 'development', label: 'Development' },
    { key: 'production', label: 'Production' },
  ];

  let currentStep = $state(1);
  let formName = $state("");
  let formDescription = $state("");
  let formCategory = $state("");
  let formPic = $state("");
  let formPriority = $state("medium");
  /** @type {Record<string, string>} */
  let formMeta = $state({});
  let formError = $state("");
  let saving = $state(false);

  let targetReqId = $state(null);
  let reqTitle = $state("");
  let reqDescription = $state("");
  let reqDueDate = $state("");
  /** @type {string[]} */
  let reqAssignTo = $state([]);
  /** @type {FileList | null} */
  let reqFiles = $state(null);

  let initializedDashId = $state(null);

  function closeEdit() {
    editOpen = false;
    initializedDashId = null;
    currentStep = 1;
    formError = "";
    reqFiles = null;
  }

  $effect(() => {
    if (!editOpen) {
      initializedDashId = null;
      return;
    }

    if (dashboard && initializedDashId !== dashboard.id) {
      initializedDashId = dashboard.id;
      currentStep = 1;
      formError = "";
      formName = dashboard.name || "";
      formDescription = dashboard.description || "";
      formCategory = dashboard.category || "";
      formPic = dashboard.pm || dashboard.owner || "";
      formPriority = dashboard.criticality || dashboard.priority || "medium";
      formMeta = { ...(dashboard.metadata || {}) };

      untrack(() => {
        // Cari requirement pertama/utama milik dashboard ini tanpa membuat reactive subscription
        const existingReqs = listRequirements({ dashboard: dashboard.name });
        const sorted = existingReqs.slice().sort((a, b) => {
          return (a.created_at || '').localeCompare(b.created_at || '') || ((a.version_no || 1) - (b.version_no || 1));
        });
        const firstReq = sorted[0] || null;

        if (firstReq) {
          targetReqId = firstReq.id;
          reqTitle = firstReq.title || "";
          reqDescription = firstReq.description || "";
          reqDueDate = firstReq.due_date || "";
          reqAssignTo = Array.isArray(firstReq.team) ? [...firstReq.team] : [];
        } else {
          targetReqId = null;
          reqTitle = "";
          reqDescription = "";
          reqDueDate = "";
          reqAssignTo = [];
        }
        reqFiles = null;
      });
    }
  });

  function toggleReqAssignee(name) {
    reqAssignTo = reqAssignTo.includes(name)
      ? reqAssignTo.filter((n) => n !== name)
      : [...reqAssignTo, name];
  }

  function nextStep() {
    formError = "";
    if (currentStep === 1 && (!formName.trim() || !formPic.trim())) {
      formError = "Application name and PIC are required.";
      return;
    }
    if (currentStep < steps.length) currentStep += 1;
  }

  function prevStep() {
    formError = "";
    if (currentStep > 1) currentStep -= 1;
  }

  function goToStep(step) {
    formError = "";
    currentStep = step;
  }

  async function onSave(event) {
    event.preventDefault();
    if (currentStep < steps.length) {
      nextStep();
      return;
    }

    const name = formName.trim();
    const pic = formPic.trim();
    if (!name || !pic) {
      formError = "Application name and PIC are required before saving.";
      currentStep = 1;
      return;
    }

    /** @type {Record<string, string>} */
    const metadata = {};
    for (const [key, value] of Object.entries(formMeta)) {
      const trimmed = String(value ?? '').trim();
      metadata[key] = trimmed;
    }

    saving = true;
    const patch = {
      name,
      description: formDescription.trim(),
      category: formCategory,
      criticality: formPriority,
      priority: formPriority,
      owner: pic,
      pm: pic,
      metadata,
    };

    const ok = await updateDashboard(dashboard.id, patch);
    if (!ok) {
      saving = false;
      formError = "Could not update application. Please try again.";
      return;
    }

    // Update local dashboard object langsung agar tampilan otomatis ter-refresh
    Object.assign(dashboard, patch);
    if (!dashboard.metadata) dashboard.metadata = {};
    Object.assign(dashboard.metadata, metadata);

    // Simpan perubahan requirement Step 4 jika diisi
    const reqTitleTrimmed = reqTitle.trim();
    if (targetReqId) {
      if (reqTitleTrimmed) {
        await updateRequirement(targetReqId, {
          title: reqTitleTrimmed,
          description: reqDescription.trim(),
          due_date: reqDueDate,
          team: reqAssignTo,
        });
        if (reqFiles && reqFiles.length) {
          await addAttachments('requirement', targetReqId, reqFiles);
        }
      }
    } else if (reqTitleTrimmed) {
      const createdReq = await createRequirement({
        dashboard: name,
        title: reqTitleTrimmed,
        description: reqDescription.trim(),
        due_date: reqDueDate,
        team: reqAssignTo,
      });
      if (createdReq && reqFiles && reqFiles.length) {
        await addAttachments('requirement', createdReq.id, reqFiles);
      }
    }

    saving = false;
    closeEdit();
  }
</script>

{#if editOpen && dashboard}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="dash-backdrop"
    use:portal
    role="presentation"
    onclick={closeEdit}
  ></div>
  <form
    class="dash-modal wizard-split"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-labelledby="edit-dashboard-title"
    onclick={(e) => e.stopPropagation()}
    onsubmit={onSave}
    onkeydown={(e) => {
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'submit') {
        e.preventDefault();
      }
    }}
  >
    <div class="wizard-left">
      <div class="left-header">
        <h2 id="edit-dashboard-title">Edit Project</h2>
        <p>
          Perbarui identitas, teknologi, infrastruktur, dan first requirement dashboard ini.
        </p>
      </div>

      <div class="wizard-steps-v">
        {#each steps as step, index}
          {@const number = index + 1}
          {#if index > 0}
            <div class="v-line" class:active={currentStep > index}></div>
          {/if}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="step-v"
            class:active={currentStep === number}
            class:done={currentStep > number}
            onclick={() => goToStep(number)}
          >
            <div class="v-circle">
              {#if currentStep > number}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg
                >
              {:else}
                {number}
              {/if}
            </div>
            <div class="v-info">
              <span class="v-title">{step.title}</span>
              <span class="v-desc">{step.desc}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="wizard-right">
      <header class="wizard-right-head">
        <button
          type="button"
          class="dash-close"
          aria-label="Close"
          onclick={closeEdit}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 7l10 10M17 7 7 17"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>

      <div class="wizard-body-scroll">
        {#if currentStep === 1}
          <div class="wizard-pane">
            <div class="pane-title-wrap">
              <h4 class="pane-title">Dashboard Identity</h4>
              <p class="pane-sub">
                General information shown at the top of the dashboard detail.
              </p>
            </div>

            <label>
              <span>Application / Dashboard Name <span class="req">*</span></span>
              <input
                bind:value={formName}
                maxlength="80"
                placeholder="Contoh: Operation Dashboard"
                required
              />
            </label>
            <label>
              Description
              <textarea
                rows="3"
                maxlength="600"
                bind:value={formDescription}
                placeholder="Describe what this application does..."
              ></textarea>
            </label>
            <label>
              Unit
              <input
                type="text"
                bind:value={formCategory}
                placeholder="Contoh: Finance, Operasional, IT..."
              />
            </label>
            <label>
              <span>PIC <span class="req">*</span></span>
              <select bind:value={formPic} required>
                <option value="">Select a PIC...</option>
                {#each effectivePmOptions as user (user.id || user.name)}
                  <option value={user.name}>{user.name}</option>
                {/each}
                {#if formPic && !effectivePmOptions.some((u) => u.name === formPic)}
                  <option value={formPic}>{formPic}</option>
                {/if}
              </select>
            </label>
            <label>
              Priority
              <select bind:value={formPriority}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        {:else if currentStep === 2}
          <div class="wizard-pane">
            <div class="pane-title-wrap">
              <h4 class="pane-title">Teknologi</h4>
              <p class="pane-sub">
                Framework and stack used by this application.
              </p>
            </div>

            <div class="grid-2">
              {#each profileSpec as field (field.key)}
                <label>
                  {field.label}
                  <input
                    bind:value={formMeta[field.key]}
                    maxlength="200"
                    placeholder={field.placeholder}
                  />
                </label>
              {/each}
            </div>
          </div>
        {:else if currentStep === 3}
          <div class="wizard-pane">
            <div class="pane-title-wrap">
              <h4 class="pane-title">Infrastructure</h4>
              <p class="pane-sub">
                Links and database access for each environment.
              </p>
            </div>

            {#each envs as env (env.key)}
              <div class="wizard-env">
                <h5 class="wizard-env-title">{env.label}</h5>
                <label>
                  Link {env.label}
                  <input
                    bind:value={formMeta[`${env.key}_link`]}
                    maxlength="500"
                    placeholder="https://..."
                  />
                </label>
                <div class="grid-2">
                  {#each envSpec as field (field.key)}
                    <label>
                      {field.label}
                      <input
                        type={field.secret ? 'password' : 'text'}
                        autocomplete={field.secret ? 'new-password' : 'off'}
                        bind:value={formMeta[`${env.key}_${field.key}`]}
                        maxlength="200"
                        placeholder={field.placeholder}
                      />
                    </label>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="wizard-pane">
            <div class="pane-title-wrap">
              <h4 class="pane-title">First Requirement</h4>
              <p class="pane-sub">
                {targetReqId ? 'Perbarui requirement utama/pertama untuk aplikasi ini.' : 'Optional — add the first requirement for this application now, or skip and add it later.'}
              </p>
            </div>

            <label>
              Requirement Name
              <input
                bind:value={reqTitle}
                maxlength="150"
                placeholder="Contoh: Login page revamp"
              />
            </label>
            <label>
              Description
              <textarea
                rows="3"
                maxlength="600"
                bind:value={reqDescription}
                placeholder="Describe this requirement..."
              ></textarea>
            </label>
            <div class="grid-2">
              <label>
                Due Date
                <input type="date" bind:value={reqDueDate} />
              </label>
              <label>
                Attachment
                <input type="file" multiple bind:files={reqFiles} />
              </label>
            </div>
            <div class="wizard-field">
              <span class="wizard-field-label">
                Assign To <span class="input-hint">(optional — Tim Teknis)</span>
              </span>
              {#if teknisRoster.length === 0}
                <span class="input-hint">No Tim Teknis members available yet.</span>
              {:else}
                <div class="assign-grid">
                  {#each teknisRoster as member (member.name)}
                    {@const isChecked = reqAssignTo.includes(member.name)}
                    <label class="assign-checkbox-card" class:checked={isChecked}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onchange={() => toggleReqAssignee(member.name)}
                      />
                      <span class="assign-name">{member.name}</span>
                    </label>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      {#if formError}
        <div class="dash-modal-body-error">
          <p class="dash-error">{formError}</p>
        </div>
      {/if}

      <footer class="wizard-foot">
        {#if currentStep === 1}
          <button type="button" class="dash-cancel" onclick={closeEdit}
            >Cancel</button
          >
        {:else}
          <button type="button" class="dash-cancel" onclick={prevStep}
            >Back</button
          >
        {/if}
        {#if currentStep < steps.length}
          <button type="button" class="dash-save wizard-btn" onclick={nextStep}>Next</button>
        {:else}
          <button type="submit" class="dash-save wizard-btn finish" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        {/if}
      </footer>
    </div>
  </form>
{/if}
