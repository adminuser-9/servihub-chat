export type WSMessage =
  | {
      type: 'message';
      body: string;
      conversationId: string;
    }
  | {
      type: 'typing';
      conversationId: string;
    }
  | {
      type: 'read';
      conversationId: string;
    };
