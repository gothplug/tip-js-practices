import { useEffect, useRef, useState } from 'react';

function isAborted(error) {
  return error?.kind === 'aborted' || error?.name === 'AbortError';
}

export function useTaskData({ api, filters }) {
  const { q, completed, priority, categoryId } = filters;
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const mounted = useRef(false);
  const mutation = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      mutation.current?.abort();
      mutation.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setStatus('loading');
    setError(null);

    async function load() {
      try {
        const next = await api.loadInitialData({ q, completed, priority, categoryId }, { signal });
        if (signal.aborted) return;
        setSnapshot(next);
        setStatus('ready');
      } catch (loadError) {
        if (signal.aborted || isAborted(loadError)) return;
        setError(loadError);
        setStatus('error');
      }
    }

    load();
    // Сигнал остаётся отменённым и для API, который проигнорировал отмену запроса.
    return () => controller.abort();
  }, [api, q, completed, priority, categoryId, revision]);

  function refresh() {
    setRevision(previous => previous + 1);
  }

  async function mutate(operation) {
    if (!mounted.current || mutation.current) return false;
    const controller = new AbortController();
    mutation.current = controller;
    setPending(true);
    setMutationError(null);

    try {
      await operation({ signal: controller.signal });
      if (controller.signal.aborted) return false;
      refresh();
      return true;
    } catch (writeError) {
      if (!controller.signal.aborted && !isAborted(writeError)) setMutationError(writeError);
      return false;
    } finally {
      if (mutation.current === controller) {
        mutation.current = null;
        setPending(false);
      }
    }
  }

  return {
    snapshot, status, error, mutationError, pending, refresh,
    saveTask: (id, value) => mutate(options => (id === null
      ? api.createTask(value, options)
      : api.updateTask(id, value, options))),
    toggleTask: task => mutate(options => api.setTaskCompleted(task.id, !task.completed, options)),
    deleteTask: id => mutate(options => api.deleteTask(id, options)),
    resetData: () => mutate(options => api.resetDemoData(options)),
  };
}
