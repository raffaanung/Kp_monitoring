<script>
  import { onMount } from 'svelte'
  import Router from 'svelte-spa-router'
  import { push } from 'svelte-spa-router'
  import { wrap } from 'svelte-spa-router/wrap'
  import Layout from './lib/Layout.svelte'
  import { loadAppData } from './lib/loadAppData.js'
  import { authStore, initAuth } from './lib/authStore.svelte.js'
  import PageShell from './lib/PageShell.svelte'
  import Home from './pages/Home.svelte'
  import Login from './pages/Login.svelte'
  import TaskBoard from './pages/TaskBoard.svelte'
  import TaskList from './pages/TaskList.svelte'
  import TaskDetail from './pages/TaskDetail.svelte'
  import RequirementList from './pages/RequirementList.svelte'
  import RequirementNew from './pages/RequirementNew.svelte'
  import RequirementDetail from './pages/RequirementDetail.svelte'
  import RequirementDetailGate from './pages/RequirementDetailGate.svelte'
  import Registry from './pages/Registry.svelte'
  import RegistryDetail from './pages/RegistryDetail.svelte'
  import RegistryDetailGate from './pages/RegistryDetailGate.svelte'
  import ActivityLog from './pages/ActivityLog.svelte'
  import ActivityLogDetail from './pages/ActivityLogDetail.svelte'
  import AccessUserList from './pages/AccessUserList.svelte'
  import AccessRoleManagement from './pages/AccessRoleManagement.svelte'
  import SettingsProfile from './pages/SettingsProfile.svelte'

  function requireAuth() {
    return authStore.user !== null
  }

  /** @param {import('svelte').Component<any>} Page @param {{ public?: boolean }} [opts] */
  function withTransition(Page, opts = {}) {
    return wrap({
      component: PageShell,
      props: { Page },
      conditions: opts.public ? [] : [requireAuth],
    })
  }

  const routes = {
    '/login': withTransition(Login, { public: true }),
    '/': withTransition(Home),
    '/tasks': withTransition(TaskBoard),
    '/tasks/board': withTransition(TaskBoard),
    '/tasks/list': withTransition(TaskList),
    '/tasks/new': withTransition(TaskBoard),
    '/tasks/detail': withTransition(TaskBoard),
    '/tasks/:id': withTransition(TaskDetail),
    '/requirements': withTransition(RequirementList),
    '/requirements/list': withTransition(RequirementList),
    '/requirements/new': withTransition(RequirementNew),
    '/requirements/detail': withTransition(RequirementDetailGate),
    '/requirements/:id': withTransition(RequirementDetail),
    '/registry': withTransition(Registry),
    '/registry/list': withTransition(Registry),
    '/registry/detail': withTransition(RegistryDetailGate),
    '/registry/:id': withTransition(RegistryDetail),
    '/activity-log': withTransition(ActivityLog),
    '/activity-log/:id': withTransition(ActivityLogDetail),
    '/access': withTransition(AccessUserList),
    '/access/users': withTransition(AccessUserList),
    '/access/roles': withTransition(AccessRoleManagement),
    '/access/profile': withTransition(SettingsProfile),
  }

  function handleConditionsFailed() {
    push('/login')
  }

  onMount(async () => {
    await initAuth()
    if (authStore.user) loadAppData()
  })
</script>

<Layout>
  {#if !authStore.loading}
    <Router {routes} onConditionsFailed={handleConditionsFailed} />
  {/if}
</Layout>

<style>
  :global(.stage-body > *) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
