/**
 * Represents a conversation session, handling WebSocket communication and event management.
 */
export declare class Conversation {
    private conversationId;
    private socket;
    private listeners;
    /**
     * Initializes a new Conversation instance.
     * @param conversationId - The unique identifier of the conversation.
     * @param socket - The WebSocket instance for communication.
     */
    constructor(conversationId: string, socket: WebSocket);
    /**
     * Adds an event listener for a specific event type.
     * @param eventType - The type of event to listen for.
     * @param callback - The function to invoke when the event occurs.
     */
    private addListener;
    /**
     * Registers a listener for messages from the bot or live chat.
     * @param callback - The function to handle incoming messages.
     */
    onMessage(callback: (message: string, type: string) => void): void;
    /**
       * Registers a listener for receiving actions.
       * @param callback - The function to handle incoming action.
       */
    onActionReceived(callback: (id: string, data: any) => void): void;
    /**
     * Registers a listener for updates to the conversation.
     * @param callback - The function to handle conversation updates.
     */
    onConversationUpdate(callback: (update: any) => void): void;
    /**
     * Registers a listener for error events.
     * @param callback - The function to handle errors.
     */
    onError(callback: (error: any) => void): void;
    /**
     * Sends a message to the conversation.
     * @param content - The message content to send.
     * @returns A promise that resolves when the message is sent.
     */
    sendMessage(content: string): Promise<void>;
    /**
     * Sets metadata for the conversation.
     * @param metadata - An object containing the metadata to set.
     * @returns A promise that resolves when the metadata is set.
     */
    setMetadata(metadata: object): Promise<void>;
    /**
     * Sends an action to the conversation.
     * @param actionId - The unique ID of the action to send.
     * @param data - Optional data associated with the action.
     * @returns A promise that resolves when the action is sent.
     */
    sendAction(actionId: string, data?: object): Promise<void>;
    /**
     * Requests the transcript of the conversation.
     * @returns A promise that resolves to the conversation transcript.
     */
    getTranscript(): Promise<object[]>;
    /**
     * Sends a payload to the WebSocket.
     * @param eventType - The type of event being sent.
     * @param payload - The payload data to include with the event.
     * @returns A promise that resolves when the payload is sent.
     */
    private sendPayload;
    /**
     * Removes a specific event listener.
     * @param eventType - The type of event.
     * @param callback - The callback function to remove.
     */
    private removeListener;
    /**
     * Gets the unique identifier of the conversation.
     * @returns The conversation ID.
     */
    getConversationId(): string;
}
