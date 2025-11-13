import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import db from "../database";
import { taskTable, projectTable, workspaceUserTable } from "../database/schema";
import { subscribeToEvent } from "../events";
import clearNotifications from "./controllers/clear-notifications";
import createNotification from "./controllers/create-notification";
import getNotifications from "./controllers/get-notifications";
import markAllNotificationsAsRead from "./controllers/mark-all-notifications-as-read";
import markNotificationAsRead from "./controllers/mark-notification-as-read";

const notification = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get("/", async (c) => {
    const userId = c.get("userId");
    const notifications = await getNotifications(userId);
    return c.json(notifications);
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        title: z.string(),
        content: z.string().optional(),
        type: z.string().optional(),
        resourceId: z.string().optional(),
        resourceType: z.string().optional(),
      }),
    ),
    async (c) => {
      const { userId, title, content, type, resourceId, resourceType } =
        c.req.valid("json");

      const notification = await createNotification({
        userId,
        title,
        content,
        type,
        resourceId,
        resourceType,
      });

      return c.json(notification);
    },
  )
  .patch(
    "/:id/read",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id } = c.req.valid("param");
      const notification = await markNotificationAsRead(id);
      return c.json(notification);
    },
  )
  .patch("/read-all", async (c) => {
    const userId = c.get("userId");
    const result = await markAllNotificationsAsRead(userId);
    return c.json(result);
  })
  .delete("/clear-all", async (c) => {
    const userId = c.get("userId");
    const result = await clearNotifications(userId);
    return c.json(result);
  });

subscribeToEvent(
  "task.created",
  async ({
    taskId,
    userId,
    title,
    projectId,
  }: {
    taskId: string;
    userId: string;
    title?: string;
    projectId: string;
    type: string;
    content: string;
  }) => {
    if (!taskId || !projectId) {
      return;
    }

    // Get the workspace ID from the project
    const project = await db
      .select({ workspaceId: projectTable.workspaceId })
      .from(projectTable)
      .where(eq(projectTable.id, projectId))
      .limit(1);

    if (!project || project.length === 0) {
      return;
    }

    const workspaceId = project[0]?.workspaceId;

    if (!workspaceId) {
      return;
    }

    // Get all members of the workspace
    const workspaceMembers = await db
      .select({ userId: workspaceUserTable.userId })
      .from(workspaceUserTable)
      .where(eq(workspaceUserTable.workspaceId, workspaceId));

    // Create a notification for each workspace member
    for (const member of workspaceMembers) {
      // Skip notification for the task creator to avoid duplicate notification
      // if the creator is also a workspace member
      if (member.userId !== userId) {
        await createNotification({
          userId: member.userId,
          title: "New Task Created",
          content: title ? `Task "${title}" was created` : "A new task was created",
          type: "task",
          resourceId: taskId,
          resourceType: "task",
        });
      }
    }

    // Also send notification to the task creator (if they exist)
    if (userId) {
      await createNotification({
        userId,
        title: "New Task Created",
        content: title ? `Task "${title}" was created` : "A new task was created",
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }
  },
);

subscribeToEvent(
  "comment.created",
  async ({
    taskId,
    userId,
    content,
  }: {
    taskId: string;
    userId: string;
    content: string;
  }) => {
    if (!taskId || !userId) {
      return;
    }

    // Get the task to find the assignee
    const task = await db
      .select({ userId: taskTable.userId })
      .from(taskTable)
      .where(eq(taskTable.id, taskId))
      .limit(1);

    // If the task has an assignee and it's not the same user who made the comment
    if (task && task.length > 0 && task[0]?.userId && task[0].userId !== userId) {
      await createNotification({
        userId: task[0].userId,
        title: "New Comment on Your Task",
        content: `"${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        type: "comment",
        resourceId: taskId,
        resourceType: "task",
      });
    }
  },
);

subscribeToEvent(
  "workspace.created",
  async ({
    workspaceId,
    ownerId,
    workspaceName,
  }: {
    workspaceId: string;
    ownerId: string;
    workspaceName: string;
  }) => {
    if (!workspaceId || !ownerId) {
      return;
    }

    await createNotification({
      userId: ownerId,
      title: `Workspace "${workspaceName}" created`,
      type: "workspace",
      resourceId: workspaceId,
      resourceType: "workspace",
    });
  },
);

subscribeToEvent(
  "task.status_changed",
  async ({
    taskId,
    userId,
    oldStatus,
    newStatus,
    title,
  }: {
    taskId: string;
    userId: string | null;
    oldStatus: string;
    newStatus: string;
    title: string;
  }) => {
    if (!taskId) {
      return;
    }

    // Get the task to find the assignee
    const task = await db
      .select({ userId: taskTable.userId })
      .from(taskTable)
      .where(eq(taskTable.id, taskId))
      .limit(1);

    // Send notification to the user who changed the status (original behavior)
    if (userId) {
      await createNotification({
        userId,
        title: `Task "${title}" moved from ${oldStatus.replace(/-/g, " ")} to ${newStatus.replace(/-/g, " ")}`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }

    // Send notification to the task assignee (if they exist and are not the same user who changed the status)
    if (task && task.length > 0 && task[0]?.userId && userId !== task[0].userId) {
      await createNotification({
        userId: task[0].userId,
        title: `Task "${title}" status changed`,
        content: `Status changed from ${oldStatus.replace(/-/g, " ")} to ${newStatus.replace(/-/g, " ")}`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }
  },

);

subscribeToEvent(
  "task.assignee_changed",
  async ({
    taskId,
    newAssignee,
    title,
  }: {
    taskId: string;
    newAssignee: string | null;
    title: string;
  }) => {
    if (!taskId || !newAssignee) {
      return;
    }

    await createNotification({
      userId: newAssignee,
      title: "Task Assigned to You",
      content: `You have been assigned to task "${title}"`,
      type: "task",
      resourceId: taskId,
      resourceType: "task",
    });
  },
);

subscribeToEvent(
  "time-entry.created",
  async ({
    timeEntryId,
    taskId,
    userId,
  }: {
    timeEntryId: string;
    taskId: string;
    userId: string;
    type: string;
    content: string;
  }) => {
    if (!timeEntryId || !taskId || !userId) {
      return;
    }

    const task = await db.query.taskTable.findFirst({
      where: eq(taskTable.id, taskId),
    });

    if (task) {
      await createNotification({
        userId,
        title: "Time Tracking Started",
        content: `You started tracking time for task "${task.title}"`,
        type: "time-entry",
        resourceId: taskId,
        resourceType: "task",
      });
    }
  },
);

subscribeToEvent(
  "task.priority_changed",
  async ({
    taskId,
    userId,
    oldPriority,
    newPriority,
    title,
  }: {
    taskId: string;
    userId: string | null;
    oldPriority: string;
    newPriority: string;
    title: string;
  }) => {
    if (!taskId) {
      return;
    }

    // Get the task to find the assignee
    const task = await db
      .select({ userId: taskTable.userId })
      .from(taskTable)
      .where(eq(taskTable.id, taskId))
      .limit(1);

    // Send notification to the user who changed the priority
    if (userId) {
      await createNotification({
        userId,
        title: `Task "${title}" priority changed`,
        content: `Priority changed from ${oldPriority} to ${newPriority}`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }

    // Send notification to the task assignee (if they exist and are not the same user who changed the priority)
    if (task && task.length > 0 && task[0]?.userId && userId !== task[0].userId) {
      await createNotification({
        userId: task[0].userId,
        title: `Task "${title}" priority changed`,
        content: `Priority changed from ${oldPriority} to ${newPriority}`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }
  },
);

subscribeToEvent(
  "task.due_date_changed",
  async ({
    taskId,
    userId,
    newDueDate,
    title,
  }: {
    taskId: string;
    userId: string | null;
    newDueDate: string;
    title: string;
  }) => {
    if (!taskId) {
      return;
    }

    // Get the task to find the assignee
    const task = await db
      .select({ userId: taskTable.userId })
      .from(taskTable)
      .where(eq(taskTable.id, taskId))
      .limit(1);

    // Send notification to the user who changed the due date
    if (userId) {
      await createNotification({
        userId,
        title: `Task "${title}" due date changed`,
        content: `Due date changed to ${new Date(newDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }

    // Send notification to the task assignee (if they exist and are not the same user who changed the due date)
    if (task && task.length > 0 && task[0]?.userId && userId !== task[0].userId) {
      await createNotification({
        userId: task[0].userId,
        title: `Task "${title}" due date changed`,
        content: `Due date changed to ${new Date(newDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }
  },
);

subscribeToEvent(
  "task.title_changed",
  async ({
    taskId,
    userId,
    newTitle,
    title,
  }: {
    taskId: string;
    userId: string | null;
    newTitle: string;
    title: string;
  }) => {
    if (!taskId) {
      return;
    }

    // Get the task to find the assignee
    const task = await db
      .select({ userId: taskTable.userId })
      .from(taskTable)
      .where(eq(taskTable.id, taskId))
      .limit(1);

    // Send notification to the user who changed the title
    if (userId) {
      await createNotification({
        userId,
        title: `Task title changed to "${newTitle}"`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }

    // Send notification to the task assignee (if they exist and are not the same user who changed the title)
    if (task && task.length > 0 && task[0]?.userId && userId !== task[0].userId) {
      await createNotification({
        userId: task[0].userId,
        title: `Task "${title}" title changed`,
        content: `Title changed to "${newTitle}"`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }
  },
);

subscribeToEvent(
  "task.description_changed",
  async ({
    taskId,
    userId,
    newDescription,
    title,
  }: {
    taskId: string;
    userId: string | null;
    newDescription: string;
    title: string;
  }) => {
    if (!taskId) {
      return;
    }

    // Get the task to find the assignee
    const task = await db
      .select({ userId: taskTable.userId })
      .from(taskTable)
      .where(eq(taskTable.id, taskId))
      .limit(1);

    // Send notification to the user who changed the description
    if (userId) {
      await createNotification({
        userId,
        title: `Task "${title}" description updated`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }

    // Send notification to the task assignee (if they exist and are not the same user who changed the description)
    if (task && task.length > 0 && task[0]?.userId && userId !== task[0].userId) {
      await createNotification({
        userId: task[0].userId,
        title: `Task "${title}" description updated`,
        content: `"${newDescription.substring(0, 50)}${newDescription.length > 50 ? '...' : ''}"`,
        type: "task",
        resourceId: taskId,
        resourceType: "task",
      });
    }
  },
);

export default notification;
