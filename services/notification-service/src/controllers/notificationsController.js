const { db, response } = require('../../../../shared');
const { successResponse, errorResponse } = response;

/**
 * List notifications for the authenticated user (or all if admin provides ?user_id=)
 * GET /api/v1/notifications
 */
async function getNotifications(req, res, next) {
  try {
    const { is_read, limit = 20, offset = 0, user_id } = req.query;

    const conditions = [];
    const values = [];

    // Determine which user's notifications to show
    const currentUserId = req.user && req.user.id;
    const targetUserId = user_id || currentUserId;

    if (targetUserId) {
      // Show notifications for the target user OR system-wide notifications (NULL recipient)
      values.push(targetUserId);
      conditions.push(`(recipient_user_id = $${values.length} OR recipient_user_id IS NULL)`);
    }
    // If no user at all, return only system notifications
    else {
      conditions.push(`recipient_user_id IS NULL`);
    }

    if (is_read !== undefined) {
      values.push(is_read === 'true');
      conditions.push(`is_read = $${values.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    values.push(parseInt(limit, 10));
    const limitPos = values.length;
    values.push(parseInt(offset, 10));
    const offsetPos = values.length;

    const querySql = `
      SELECT 
        id,
        recipient_user_id,
        organization_id,
        report_id,
        type,
        title,
        message,
        payload,
        is_read,
        created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitPos} OFFSET $${offsetPos};
    `;

    const result = await db.query(querySql, values);
    return successResponse(res, {
      notifications: result.rows,
      count: result.rows.length,
    }, 'Notifications retrieved.');
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a single notification as read
 * PATCH /api/v1/notifications/:id/read
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const updateSql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING *;
    `;

    const result = await db.query(updateSql, [id]);
    if (result.rows.length === 0) {
      return errorResponse(res, `Notification with ID '${id}' not found.`, 404);
    }

    return successResponse(res, result.rows[0], 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications for the authenticated user as read
 * PATCH /api/v1/notifications/read-all
 */
async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return errorResponse(res, 'Authentication required.', 401);

    const updateSql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE recipient_user_id = $1 AND is_read = FALSE
      RETURNING id;
    `;

    const result = await db.query(updateSql, [userId]);
    return successResponse(res, {
      updated_count: result.rows.length,
    }, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
