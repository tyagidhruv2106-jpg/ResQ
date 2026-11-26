const amqp = require('amqplib');
const config = require('../config');

let connection = null;
let channel = null;
let isConnecting = false;

/**
 * Initialize RabbitMQ Connection and Channel
 */
async function getChannel() {
  if (channel) return channel;
  if (isConnecting) {
    // Wait briefly if connection is in-flight
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (channel) return channel;
  }

  isConnecting = true;
  try {
    const url = config.rabbitmq.url;
    console.log(`[RabbitMQ] Connecting to ${config.rabbitmq.host}:${config.rabbitmq.port}...`);
    connection = await amqp.connect(url);
    
    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err.message);
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      console.warn('[RabbitMQ] Connection closed. Reconnection will trigger on next operation.');
      channel = null;
      connection = null;
    });

    channel = await connection.createChannel();
    
    // Assert durable topic exchange
    await channel.assertExchange(config.rabbitmq.exchange, config.rabbitmq.exchangeType, {
      durable: true,
    });

    console.log(`[RabbitMQ] Connected and asserted exchange: '${config.rabbitmq.exchange}'`);
    isConnecting = false;
    return channel;
  } catch (error) {
    isConnecting = false;
    console.error(`[RabbitMQ Connection Failed]: ${error.message}`);
    throw error;
  }
}

/**
 * Publish an event to the RabbitMQ topic exchange
 * @param {string} routingKey - e.g., 'report.created'
 * @param {object} data - payload object
 * @param {string} eventType - event class name, e.g., 'RescueReportCreated'
 */
async function publishEvent(routingKey, data, eventType = 'DomainEvent') {
  try {
    const ch = await getChannel();
    const eventPayload = {
      eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      routingKey,
      timestamp: new Date().toISOString(),
      data,
    };

    const buffer = Buffer.from(JSON.stringify(eventPayload));
    const published = ch.publish(config.rabbitmq.exchange, routingKey, buffer, {
      persistent: true,
      contentType: 'application/json',
    });

    if (published) {
      console.log(`[RabbitMQ Published] [${routingKey}] ${eventType}:`, JSON.stringify(data));
    } else {
      console.warn(`[RabbitMQ Warning] Message buffer full for routingKey: ${routingKey}`);
    }
    return eventPayload;
  } catch (error) {
    console.error(`[RabbitMQ Publish Error] Failed to publish ${routingKey}:`, error.message);
    throw error;
  }
}

/**
 * Subscribe a worker consumer to a durable queue bound to routing keys
 * @param {string} queueName - e.g., 'q.notification.report_created'
 * @param {string|string[]} routingKeys - e.g. ['report.created', 'status.updated']
 * @param {function} handler - async (parsedEvent, rawMessage) => {}
 */
async function subscribeToEvents(queueName, routingKeys, handler) {
  try {
    const ch = await getChannel();
    
    // Assert durable queue
    await ch.assertQueue(queueName, { durable: true });

    // Normalize keys to array
    const keys = Array.isArray(routingKeys) ? routingKeys : [routingKeys];
    for (const key of keys) {
      await ch.bindQueue(queueName, config.rabbitmq.exchange, key);
      console.log(`[RabbitMQ Bind] Queue '${queueName}' bound to '${config.rabbitmq.exchange}' with key '${key}'`);
    }

    // Prefetch 1 to distribute work evenly among workers
    await ch.prefetch(1);

    ch.consume(queueName, async (msg) => {
      if (!msg) return;
      try {
        const content = JSON.parse(msg.content.toString());
        console.log(`[RabbitMQ Consumed] [${queueName}] [${msg.fields.routingKey}]:`, content.eventType);
        await handler(content, msg);
        ch.ack(msg);
      } catch (err) {
        console.error(`[RabbitMQ Consumer Error] Queue '${queueName}':`, err.message);
        // Negative acknowledgement: requeue or discard based on error type
        // For demonstration, reject without requeue to avoid infinite poison pill loops
        ch.nack(msg, false, false);
      }
    });

    console.log(`[RabbitMQ] Consumer active on queue '${queueName}'`);
  } catch (error) {
    console.error(`[RabbitMQ Subscribe Error] Failed on queue '${queueName}':`, error.message);
    throw error;
  }
}

/**
 * Graceful close
 */
async function closeConnection() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('[RabbitMQ] Connection closed gracefully.');
  } catch (err) {
    console.error('[RabbitMQ Close Error]:', err.message);
  }
}

module.exports = {
  getChannel,
  publishEvent,
  subscribeToEvents,
  closeConnection,
};
