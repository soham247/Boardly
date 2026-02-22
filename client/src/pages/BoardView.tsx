import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBoardById,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../lib/api";
import { TaskColumn } from "../components/TaskColumn";
import { TaskModal } from "../components/TaskModal";
import type { TaskProps } from "../components/TaskModal";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [board, setBoard] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProps | undefined>(
    undefined,
  );
  const [newTaskStatus, setNewTaskStatus] = useState<
    "todo" | "in-progress" | "review" | "done"
  >("todo");

  const fetchBoardAndTasks = async () => {
    if (!boardId) return;
    try {
      setIsLoading(true);
      const [boardRes, tasksRes] = await Promise.all([
        getBoardById(boardId),
        getTasks(boardId),
      ]);
      setBoard(boardRes.data.board);
      setTasks(tasksRes.data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch board data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardAndTasks();
  }, [boardId]);

  if (isLoading) {
    return <div className="p-8">Loading board...</div>;
  }

  if (!board) {
    return <div className="p-8">Board not found.</div>;
  }

  const hasWriteAccess =
    board.userRole === "write" || board.userRole === "owner";

  const columns = [
    { title: "To Do", status: "todo" as const },
    { title: "In Progress", status: "in-progress" as const },
    { title: "Review", status: "review" as const },
    { title: "Done", status: "done" as const },
  ];

  const handleOpenCreateModal = (
    status: "todo" | "in-progress" | "review" | "done" = "todo",
  ) => {
    if (!hasWriteAccess) return;
    setSelectedTask(undefined);
    setNewTaskStatus(status);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskProps) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: any) => {
    if (!boardId) return;
    try {
      if (selectedTask) {
        await updateTask(selectedTask._id, taskData);
      } else {
        await createTask({ ...taskData, boardId });
      }
      await fetchBoardAndTasks();
    } catch (error) {
      console.error("Failed to save task", error);
      alert("Error saving task");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !hasWriteAccess) return;
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(selectedTask._id);
      setIsModalOpen(false);
      await fetchBoardAndTasks();
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-full font-sans flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-full border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {board.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                {board.description || "No description"}
              </span>
              {!hasWriteAccess && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                  Read-only
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 flex-1 items-start snap-x snap-mandatory">
        {columns.map((col) => (
          <div key={col.status} className="snap-center shrink-0 h-full">
            <TaskColumn
              title={col.title}
              status={col.status}
              tasks={tasks.filter((t) => t.status === col.status)}
              onTaskClick={handleOpenEditModal}
              onAddTask={handleOpenCreateModal}
              hasWriteAccess={hasWriteAccess}
            />
          </div>
        ))}
      </div>

      {/* Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={selectedTask && hasWriteAccess ? handleDeleteTask : undefined}
        task={selectedTask}
        defaultStatus={newTaskStatus}
        boardMembers={board.members}
        isReadOnly={!hasWriteAccess}
      />
    </div>
  );
}
