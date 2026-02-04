import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { logger } from './Logger';

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
  id?: string;
}

export interface WebSocketClientInfo {
  id: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
}

export class EnhancedWebSocketServer extends EventEmitter {
  private server: WebSocketServer;
  private clients = new Map<WebSocket, WebSocketClientInfo>();
  private subscriptions = new Map<string, Set<WebSocket>>();
  private messageHandlers = new Map<string, (ws: WebSocket, message: WebSocketMessage) => void>();

  constructor(port: number, path?: string) {
    super();
    
    this.server = new WebSocketServer({ 
      port,
      path
    });
    
    this.server.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    this.server.on('error', (error) => {
      logger.error('WebSocket server error', 'WS', error);
      this.emit('error', error);
    });

    logger.info(`WebSocket server started on port ${port}${path ? ` with path ${path}` : ''}`, 'WS');
  }

  private handleConnection(ws: WebSocket): void {
    const clientInfo: WebSocketClientInfo = {
      id: this.generateClientId(),
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set()
    };

    this.clients.set(ws, clientInfo);
    logger.debug(`Client connected: ${clientInfo.id}`, 'WS');
    
    // Send welcome message
    this.sendToClient(ws, {
      type: 'connected',
      data: {
        clientId: clientInfo.id,
        timestamp: Date.now()
      }
    });

    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket client error: ${clientInfo.id}`, 'WS', error);
      this.handleDisconnection(ws);
    });

    ws.on('pong', () => {
      clientInfo.lastActivity = new Date();
    });

    this.emit('connection', ws, clientInfo);
  }

  private handleMessage(ws: WebSocket, data: any): void {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    clientInfo.lastActivity = new Date();

    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      // Handle built-in message types
      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(ws, message.data?.channel);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(ws, message.data?.channel);
          break;
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
          break;
        default:
          // Custom message handler
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(ws, message);
          } else {
            this.emit('message', ws, message, clientInfo);
          }
      }
    } catch (error) {
      logger.error(`Failed to parse WebSocket message from ${clientInfo.id}`, 'WS', error);
      this.sendToClient(ws, {
        type: 'error',
        data: { message: 'Invalid JSON message' }
      });
    }
  }

  private handleDisconnection(ws: WebSocket): void {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    logger.debug(`Client disconnected: ${clientInfo.id}`, 'WS');

    // Remove from all subscriptions
    for (const channel of clientInfo.subscriptions) {
      this.removeFromSubscription(ws, channel);
    }

    this.clients.delete(ws);
    this.emit('disconnection', ws, clientInfo);
  }

  private handleSubscription(ws: WebSocket, channel: string): void {
    if (!channel) return;

    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }

    this.subscriptions.get(channel)!.add(ws);
    clientInfo.subscriptions.add(channel);

    logger.debug(`Client ${clientInfo.id} subscribed to ${channel}`, 'WS');
    
    this.sendToClient(ws, {
      type: 'subscribed',
      data: { channel }
    });

    this.emit('subscription', ws, channel, clientInfo);
  }

  private handleUnsubscription(ws: WebSocket, channel: string): void {
    if (!channel) return;

    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    this.removeFromSubscription(ws, channel);
    clientInfo.subscriptions.delete(channel);

    logger.debug(`Client ${clientInfo.id} unsubscribed from ${channel}`, 'WS');
    
    this.sendToClient(ws, {
      type: 'unsubscribed',
      data: { channel }
    });

    this.emit('unsubscription', ws, channel, clientInfo);
  }

  private removeFromSubscription(ws: WebSocket, channel: string): void {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const messageWithTimestamp = {
          ...message,
          timestamp: message.timestamp || Date.now(),
          id: message.id || this.generateMessageId()
        };
        
        ws.send(JSON.stringify(messageWithTimestamp));
      } catch (error) {
        logger.error('Failed to send message to client', 'WS', error);
      }
    }
  }

  public broadcast(message: WebSocketMessage, channel?: string): void {
    const targets = channel 
      ? this.subscriptions.get(channel) || new Set()
      : new Set(this.clients.keys());

    for (const ws of targets) {
      this.sendToClient(ws, message);
    }
  }

  public broadcastToSubscribers(channel: string, message: WebSocketMessage): void {
    this.broadcast(message, channel);
  }

  public registerMessageHandler(type: string, handler: (ws: WebSocket, message: WebSocketMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  public unregisterMessageHandler(type: string): void {
    this.messageHandlers.delete(type);
  }

  public getConnectedClients(): WebSocketClientInfo[] {
    return Array.from(this.clients.values());
  }

  public getSubscribers(channel: string): WebSocketClientInfo[] {
    const subscribers = this.subscriptions.get(channel);
    if (!subscribers) return [];

    return Array.from(subscribers)
      .map(ws => this.clients.get(ws))
      .filter(client => client !== undefined) as WebSocketClientInfo[];
  }

  public getChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  public closeClient(clientId: string): void {
    for (const [ws, clientInfo] of this.clients) {
      if (clientInfo.id === clientId) {
        ws.close();
        break;
      }
    }
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      // Close all client connections
      for (const ws of this.clients.keys()) {
        ws.close();
      }

      // Close server
      this.server.close(() => {
        logger.info('WebSocket server closed', 'WS');
        resolve();
      });
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check - ping all clients and remove dead ones
  public healthCheck(): void {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const [ws, clientInfo] of this.clients) {
      const timeSinceLastActivity = now - clientInfo.lastActivity.getTime();
      
      if (timeSinceLastActivity > timeout) {
        logger.debug(`Removing inactive client: ${clientInfo.id}`, 'WS');
        ws.terminate();
        this.handleDisconnection(ws);
      } else {
        // Send ping
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }
    }
  }

  // Statistics
  public getStats(): any {
    const channels = this.getChannels();
    const clients = this.getConnectedClients();
    
    return {
      connectedClients: clients.length,
      totalChannels: channels.length,
      subscriptionCounts: Object.fromEntries(
        channels.map(channel => [
          channel, 
          this.getSubscribers(channel).length
        ])
      ),
      uptime: Date.now() - (this.server as any)._startTime,
      memoryUsage: process.memoryUsage()
    };
  }
}

// Utility functions for WebSocket messaging
export function createWebSocketMessage(type: string, data?: any): WebSocketMessage {
  return {
    type,
    data,
    timestamp: Date.now(),
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

export function isValidWebSocketMessage(obj: any): obj is WebSocketMessage {
  return obj && typeof obj === 'object' && typeof obj.type === 'string';
}

// WebSocket client utility for testing
export class WebSocketTestClient extends EventEmitter {
  private ws?: WebSocket;
  private url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        logger.debug('WebSocket test client connected', 'WS-CLIENT');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.emit('message', message);
        } catch (error) {
          logger.error('Failed to parse message from server', 'WS-CLIENT', error);
        }
      });

      this.ws.on('error', (error) => {
        logger.error('WebSocket test client error', 'WS-CLIENT', error);
        this.emit('error', error);
        reject(error);
      });

      this.ws.on('close', () => {
        logger.debug('WebSocket test client disconnected', 'WS-CLIENT');
        this.emit('disconnected');
      });
    });
  }

  public send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  public subscribe(channel: string): void {
    this.send(createWebSocketMessage('subscribe', { channel }));
  }

  public unsubscribe(channel: string): void {
    this.send(createWebSocketMessage('unsubscribe', { channel }));
  }

  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}