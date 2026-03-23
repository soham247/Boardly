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
      http.put('http://localhost/tasks/board/:boardId/reorder', async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ message: 'failed' }, { status: 500 });
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
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
    queryClient.setQueryData(tasksQueryKeyByStatus['in-progress'], makeInfiniteData([inProgressTask]));
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

    let mutationPromise: Promise<unknown>;
    act(() => {
      mutationPromise = result.current.mutateAsync({
        source,
        destination,
        nextTasksByStatus: tasksByStatus,
        tasksToUpdateItems,
      });
    });

    await waitFor(() => {
      const optimisticTodoData = queryClient.getQueryData<InfiniteData<PaginatedTasksResponse>>(
        tasksQueryKeyByStatus.todo
      );
      expect(optimisticTodoData?.pages[0]?.tasks.map((task) => task._id)).toEqual(['t2']);
    });

    await expect(mutationPromise!).rejects.toBeTruthy();

    await waitFor(() => {
      const rolledBackTodoData = queryClient.getQueryData(tasksQueryKeyByStatus.todo);
      expect(rolledBackTodoData).toEqual(initialTodoData);
    });
  });
});
