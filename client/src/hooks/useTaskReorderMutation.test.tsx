import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Task, TasksByStatusMap } from './useTasks';
import { useTaskReorderMutation, type ColumnStatus } from './useTaskReorderMutation';
import { server } from '../test/setup';

const { toastErrorMock } = vi.hoisted(() => ({ toastErrorMock: vi.fn() }));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
  },
}));

const createTask = (id: string, status: ColumnStatus, order: number): Task => ({
  _id: id,
  title: `Task ${id}`,
  boardId: 'board-1',
  status,
  priority: 'medium',
  order,
  createdBy: {
    _id: 'user-1',
    fullName: 'User One',
    username: 'userone',
  },
});

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useTaskReorderMutation rollback', () => {
  it('rolls back optimistic cache patch when reorder request fails', async () => {
    server.use(
      http.put('*/tasks/board/:boardId/reorder', () => {
        return HttpResponse.json({ message: 'reorder failed' }, { status: 500 });
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const updateColumnQueryCache = vi.fn();
    const tasksQueryKeyByStatus = {
      todo: ['tasks', 'board-1', 'todo', 50] as const,
      'in-progress': ['tasks', 'board-1', 'in-progress', 50] as const,
      review: ['tasks', 'board-1', 'review', 50] as const,
      done: ['tasks', 'board-1', 'done', 50] as const,
    };

    const previousTasksByStatus: TasksByStatusMap = {
      todo: [createTask('task-1', 'todo', 0)],
      'in-progress': [],
      review: [],
      done: [createTask('task-2', 'done', 0)],
    };

    const optimisticTasksByStatus: TasksByStatusMap = {
      todo: [],
      'in-progress': [],
      review: [],
      done: [createTask('task-2', 'done', 0), createTask('task-1', 'done', 1)],
    };

    const { result } = renderHook(
      () =>
        useTaskReorderMutation({
          tasksQueryKeyByStatus,
          updateColumnQueryCache,
        }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          boardId: 'board-1',
          tasksToUpdateItems: [
            { _id: 'task-1', status: 'done', order: 1 },
            { _id: 'task-2', status: 'done', order: 0 },
          ],
          sourceStatus: 'todo',
          destinationStatus: 'done',
          optimisticTasksByStatus,
          previousTasksByStatus,
        })
      ).rejects.toThrow();
    });

    expect(updateColumnQueryCache).toHaveBeenCalledTimes(4);
    expect(updateColumnQueryCache).toHaveBeenNthCalledWith(1, 'todo', optimisticTasksByStatus.todo);
    expect(updateColumnQueryCache).toHaveBeenNthCalledWith(2, 'done', optimisticTasksByStatus.done);
    expect(updateColumnQueryCache).toHaveBeenNthCalledWith(3, 'todo', previousTasksByStatus.todo);
    expect(updateColumnQueryCache).toHaveBeenNthCalledWith(4, 'done', previousTasksByStatus.done);
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });
});
