// Import the Conversation class
import { Conversation } from './Conversation';

// Determine the WebSocket implementation based on the environment (browser, Node.js, or React Native)
let WebSocketImpl: typeof WebSocket;

// Browser environment (web)
if (typeof window !== 'undefined' && window.WebSocket) {
  WebSocketImpl = window.WebSocket;
}
// React Native environment
else if (typeof global !== 'undefined' && global.WebSocket) {
  WebSocketImpl = global.WebSocket;
}
// Node.js environment
else {
  try {
    WebSocketImpl = require('ws');
  } catch (error) {
    throw new Error('WebSocket not available in this environment and ws module could not be loaded');
  }
}

/**
 * CaptivateChatAPI class for managing conversations through WebSocket connections.
 */
export class CaptivateChatAPI {
  private apiKey: string;
  private mode: 'prod' | 'dev';
  private url: string;
  private socket: InstanceType<typeof WebSocketImpl> | null;
  private conversations: Map<string, Conversation>;

  /**
   * Creates an instance of CaptivateChatAPI.
   * @param apiKey - The API key for authentication.
   * @param mode - The mode of operation ('prod' for production or 'dev' for development).
   */
  constructor(apiKey: string, mode: 'prod' | 'dev' = 'prod') {
    this.apiKey = apiKey;
    this.mode = mode;
    this.url =
      this.mode === 'prod'
        ? `wss://channel.wss.captivatechat.ai/dev?apiKey=${apiKey}`
        : `wss://channel-dev.wss.captivatechat.ai/dev?apiKey=${apiKey}`;
    this.socket = null;
    this.conversations = new Map();
  }

  /**
   * Sends a message through the WebSocket connection.
   * @param message - The message object to send.
   */
  private _send(message: object): void {
    if (this.socket && this.socket.readyState === WebSocketImpl.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('Socket is not open. Message not sent:', message);
    }
  }

  /**
   * Connects to the WebSocket server and waits for confirmation from the API.
   * @returns A promise that resolves once the connection is successfully established.
   */
  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocketImpl(this.url);

        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout: socket_connected not received'));
        }, 10000);

        this.socket.onopen = () => {
          console.log('WebSocket connected, waiting for API confirmation...');
        };

        this.socket.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data.toString());
            if (message.event?.event_type === 'socket_connected') {
              console.log('API Successfully Connected');
              clearTimeout(timeoutId);
              resolve();
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };

        this.socket.onerror = (event: any) => {
          console.error('WebSocket Error:', event.message || event);
          clearTimeout(timeoutId);
          reject(new Error(event.message || 'WebSocket error'));
        };

        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Creates a new conversation or starts a bot-first/user-first conversation.
   * @param userId - The unique identifier for the user.
   * @param userBasicInfo - Basic information about the user (e.g., name, email).
   * @param userData - Additional optional user data.
   * @param autoConversationStart - Mode to auto-start the conversation ('bot-first' or 'user-first').
   * @returns A promise that resolves to the created Conversation instance.
   */
  public async createConversation(
    userId: string,
    userBasicInfo: object = {},
    userData: object = {},
    autoConversationStart: 'bot-first' | 'user-first' = 'bot-first'
  ): Promise<Conversation> {
    return new Promise((resolve, reject) => {
      try {
        this._send({
          action: 'sendMessage',
          event: {
            event_type: 'conversation_start',
            event_payload: {
              userId,
              userBasicInfo,
              userData,
            },
          },
        });

        const onMessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data.toString());
            if (message.event?.event_type === 'conversation_start_success') {
              const conversationId = message.event.event_payload.conversation_id;
              this.socket?.removeEventListener('message', onMessage);

              const conversation = new Conversation(conversationId, this.socket!);
              this.conversations.set(conversationId, conversation);

              if (autoConversationStart === 'bot-first') {
                conversation
                  .sendMessage('')
                  .then(() => resolve(conversation))
                  .catch(reject);
              } else {
                resolve(conversation);
              }
            }
          } catch (err) {
            console.error('Error processing message:', err);
          }
        };

        this.socket?.addEventListener('message', onMessage);

        setTimeout(() => {
          this.socket?.removeEventListener('message', onMessage);
          reject(new Error('Timeout: No response for createConversation'));
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Retrieves an existing conversation by its ID or creates a new one if not found.
   * @param conversationId - The unique ID of the conversation.
   * @returns The Conversation instance associated with the given ID.
   */
  getConversation(conversationId: string): Conversation {
    let conversation = this.conversations.get(conversationId);

    if (!conversation) {
      // If conversation is not found, check if socket is initialized
      if (this.socket !== null) {
        // If socket is initialized, create the conversation
        conversation = new Conversation(conversationId, this.socket);
        this.conversations.set(conversationId, conversation);
      } else {
        // Handle the case where socket is not initialized
        console.error('Socket is not initialized');
        throw new Error('WebSocket connection not established');
      }
    }

    return conversation;
  }

}