import db from "../../database";
import { activityTable } from "../../database/schema";
import { publishEvent } from "../../events";

async function createComment(taskId: string, userId: string, content: string) {
  const activity = await db.insert(activityTable).values({
    taskId,
    type: "comment",
    userId,
    content,
  });

  // Publish event to notify task assignee about the new comment
  await publishEvent("comment.created", {
    taskId,
    userId,
    content,
    type: "comment",
  });

  return activity;
}

export default createComment;
