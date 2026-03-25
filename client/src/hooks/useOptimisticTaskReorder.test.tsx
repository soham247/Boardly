import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { server } from '../test/msw/server';
import { useOptimisticTaskReorder } from './useOptimisticTaskReorder';
import { buildReorderResult, type ColumnStatus } from '../lib/taskReorder';
import type { PaginatedTasksResponse, Task, TasksByStatusMap } from './useTasks';

const PAGE_SIZE = 50;
const BOARD_ID = 'board-1';
const API_BASE = 'http://localhost/api/v1';

const makeInfiniteData = (tasks: Task[]): InfiniteData<PaginatedTasksResponse> => ({
  pages: [
    {
      message: 'ok',
      tasks,
      nextCursor: null,
      hasMore: false,
    },
  ],
  pageParams: [null],
});

describe('useOptimisticTaskReorder', () => {
  it('rolls back optimistic cache updates when reorder request fails', async () => {
    server.use(
      // PUT reorder → 500
      http.put(`${API_BASE}/tasks/board/:boardId/reorder`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ message: 'failed' }, { status: 500 });
      }),
      // GET tasks by status — needed because onSettled invalidateQueries triggers refetches
      http.get(`${API_BASE}/tasks/board/:boardId`, () => {
        return HttpResponse.json({ tasks: [], nextCursor: null, hasMore: false, message: 'ok' });
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });

    const tasksQueryKeyByStatus: Record<ColumnStatus, readonly unknown[]> = {
      todo: ['tasks', BOARD_ID, 'todo', PAGE_SIZE],
      'in-progress': ['tasks', BOARD_ID, 'in-progress', PAGE_SIZE],
      review: ['tasks', BOARD_ID, 'review', PAGE_SIZE],
      done: ['tasks', BOARD_ID, 'done', PAGE_SIZE],
    };

    const todoTaskA: Task = {
      _id: 't1',
      title: 'First',
      boardId: BOARD_ID,
      status: 'todo',
      priority: 'medium',
      order: 0,
      createdBy: { _id: 'u1', fullName: 'User One', username: 'user1' },
    };

    const todoTaskB: Task = {
      _id: 't2',
      title: 'Second',
      boardId: BOARD_ID,
      status: 'todo',
      priority: 'medium',
      order: 1,
      createdBy: { _id: 'u1', fullName: 'User One', username: 'user1' },
    };

    const inProgressTask: Task = {
      _id: 't3',
      title: 'In Progress',
      boardId: BOARD_ID,
      status: 'in-progress',
      priority: 'high',
      order: 0,
      createdBy: { _id: 'u1', fullName: 'User One', username: 'user1' },
    };

    queryClient.setQueryData(tasksQueryKeyByStatus.todo, makeInfiniteData([todoTaskA, todoTaskB]));
    queryClient.setQueryData(
      tasksQueryKeyByStatus['in-progress'],
      makeInfiniteData([inProgressTask])
    );
    queryClient.setQueryData(tasksQueryKeyByStatus.review, makeInfiniteData([]));
    queryClient.setQueryData(tasksQueryKeyByStatus.done, makeInfiniteData([]));

    const initialTodoData = queryClient.getQueryData(tasksQueryKeyByStatus.todo);

    const currentTasksByStatus: TasksByStatusMap = {
      todo: [todoTaskA, todoTaskB],
      'in-progress': [inProgressTask],
      review: [],
      done: [],
    };

    const source = { droppableId: 'todo', index: 0 };
    const destination = { droppableId: 'in-progress', index: 1 };

    const { tasksByStatus, tasksToUpdateItems } = buildReorderResult(
      currentTasksByStatus,
      source,
      destination,
      't1'
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOptimisticTaskReorder({ boardId: BOARD_ID, tasksQueryKeyByStatus }),
      { wrapper }
    );

    // Use await act to flush onMutate's async work (cancelQueries + setQueryData) before asserting
    let mutationPromise: Promise<unknown>;
    await act(async () => {
      mutationPromise = result.current.mutateAsync({
        source,
        destination,
        nextTasksByStatus: tasksByStatus,
        tasksToUpdateItems,
      });
      // Small tick to let onMutate run through its async cancelQueries
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // onMutate has now completed — check optimistic cache
    const optimisticTodoData = queryClient.getQueryData<InfiniteData<PaginatedTasksResponse>>(
      tasksQueryKeyByStatus.todo
    );
    expect(optimisticTodoData?.pages[0]?.tasks.map((task) => task._id)).toEqual(['t2']);

    await expect(mutationPromise!).rejects.toBeTruthy();

    // After the request fails (onError), the cache should be restored to the original data
    await waitFor(() => {
      const rolledBackTodoData = queryClient.getQueryData(tasksQueryKeyByStatus.todo);
      expect(rolledBackTodoData).toEqual(initialTodoData);
    });
  });
});
