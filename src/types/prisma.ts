// conversationId and userId are BIGINTs in your schema
export type ConversationRef = {
    id: bigint;
    type: 'DIRECT' | 'SUPPORT_ROOM' | 'COMMUNITY';
    businessId: bigint;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type ParticipantRef = {
    conversationId: bigint;
    userId: bigint;
    role: 'CUSTOMER' | 'AGENT' | 'OWNER';
    joinedAt: Date;
  };
  
  export type UserRef = {
    id: bigint;
  };
  
  export type BusinessRef = {
    id: bigint;
    name: string;
  };
  
  export type MessageRecord = {
    id: bigint;
    conversationId: bigint;
    senderId: bigint | null;
    body: string | null;
    contentType: 'TEXT' | 'FILE' | 'IMAGE' | 'VIDEO' | 'OTHER';
    createdAt: Date;
    readAt: Date | null;
    editedAt: Date | null;
    deletedAt: Date | null;
  };
  