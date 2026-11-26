const { db, messaging } = require('../../../shared');

const QUEUE_NAME = 'q.notification.rescue_events';
const ROUTING_KEYS = [
  'report.created',
  'rescue.assigned',
  'rescue.status_updated',
  'rescue.completed',
];

/**
 * Helper to fetch reporter_id from DB if not present in event payload
 */
async function resolveReporterId(reportId) {
  if (!reportId) return null;
  try {
    const res = await db.query('SELECT reporter_id FROM rescue_reports WHERE id = $1', [reportId]);
    return res.rows.length > 0 ? res.rows[0].reporter_id : null;
  } catch (err) {
    return null;
  }
}

/**
 * Process any incoming domain event and persist a notification record
 */
async function handleEvent(eventPayload) {
  const { eventType, routingKey, data } = eventPayload;
  console.log(`------------------------------------------------------------`);
  console.log(`🔔 [Notification Service] EVENT RECEIVED: [${routingKey}] ${eventType}`);
  console.log(`   Payload:`, JSON.stringify(data));
  console.log(`------------------------------------------------------------`);

  let title = 'ResQ Alert';
  let message = 'An update has occurred on a rescue report.';
  let type = eventType || 'DomainEvent';
  let recipientUserId = data.reporterId || null;
  const organizationId = data.organizationId || null;
  const reportId = data.reportId || null;

  if (!recipientUserId && reportId) {
    recipientUserId = await resolveReporterId(reportId);
  }

  const animal = (data.animalType || 'animal').toUpperCase();

  switch (routingKey) {
    case 'report.created':
      title = `🚨 Distress Alert: Injured ${animal}`;
      message = `A ${data.severityLevel || 'medium'} severity ${data.animalType || 'animal'} distress report was registered at ${data.addressText || 'GPS coordinates'}. Proximity matching dispatched.`;
      type = 'RescueReportCreated';
      break;

    case 'rescue.assigned':
      title = `🚑 Rescue Case Accepted by NGO`;
      message = `An animal rescue organization has accepted the distress report for ${animal} and initiated dispatch.`;
      type = 'RescueAssigned';
      break;

    case 'rescue.status_updated':
      title = `📋 Status Updated: ${(data.newStatus || '').replace('_', ' ').toUpperCase()}`;
      message = `Rescue case status updated from '${data.previousStatus}' to '${data.newStatus}'.`;
      type = 'RescueStatusUpdated';
      break;

    case 'rescue.completed':
      title = `🎉 Rescue Operation Completed!`;
      message = `The rescue mission for ${animal} has been marked as successfully rescued.`;
      type = 'RescueCompleted';
      break;

    default:
      title = `ResQ Event: ${eventType}`;
      message = `Update processed for report ${reportId}.`;
      break;
  }

  const insertSql = `
    INSERT INTO notifications (
      recipient_user_id,
      organization_id,
      report_id,
      type,
      title,
      message,
      payload,
      is_read
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
    RETURNING id, type, title, created_at;
  `;

  try {
    const result = await db.query(insertSql, [
      recipientUserId,
      organizationId,
      reportId,
      type,
      title,
      message,
      JSON.stringify(data),
    ]);
    console.log(`✅ [Notification Service] Notification persisted to DB. ID: ${result.rows[0].id} (User: ${recipientUserId || 'Public/System'})`);
    return result.rows[0];
  } catch (dbErr) {
    console.error(`❌ [Notification Service] Failed to save notification to DB:`, dbErr.message);
    throw dbErr;
  }
}

/**
 * Backwards compatibility alias for report.created
 */
async function handleReportCreated(eventPayload) {
  return handleEvent(eventPayload);
}

/**
 * Start RabbitMQ consumer subscribed to all rescue workflow routing keys
 */
async function startNotificationConsumer() {
  try {
    await messaging.subscribeToEvents(QUEUE_NAME, ROUTING_KEYS, async (eventPayload) => {
      await handleEvent(eventPayload);
    });
    console.log(`[Notification Consumer] Successfully subscribed to [${ROUTING_KEYS.join(', ')}] on queue '${QUEUE_NAME}'`);
  } catch (error) {
    console.error(`[Notification Consumer Error]:`, error.message);
  }
}

module.exports = {
  startNotificationConsumer,
  handleEvent,
  handleReportCreated,
};
