<script>
  import TaskDetail from '$lib/pages/tasks/TaskDetail.svelte';

  let {
    taskId = '',
    embedded = false,
    inApproval = false,
    showBack = false,
    onBack = () => {},
  } = $props();
</script>

<TaskDetail {taskId} {embedded} {inApproval} {showBack} {onBack} />
