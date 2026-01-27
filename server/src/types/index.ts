export interface Position {
  lat: number;
  lng: number;
}

export interface Player {
  id: string;
  odId: string;
  username: string;
  position: Position;
  flag: string;
  lastSeen: Date;
}

export interface ChatMessage {
  id: string;
  from: string;
  fromId: string;
  message: string;
  type: 'global' | 'local';
  position?: Position;
  timestamp: Date;
}

export interface WorldState {
  players: Player[];
}

// Socket.io event types
export interface ClientToServerEvents {
  'player:move': (data: { lat: number; lng: number }) => void;
  'chat:send': (data: { message: string; type: 'global' | 'local' }) => void;
  'player:authenticate': (data: { token: string; flag?: string }) => void;
  'player:updateFlag': (data: { flag: string }) => void;
}

export interface ServerToClientEvents {
  'player:joined': (data: Player) => void;
  'player:left': (data: { id: string }) => void;
  'player:moved': (data: { id: string; position: Position }) => void;
  'player:flagUpdated': (data: { id: string; flag: string }) => void;
  'chat:message': (data: ChatMessage) => void;
  'world:state': (data: WorldState) => void;
  'auth:success': (data: { player: Player }) => void;
  'auth:error': (data: { message: string }) => void;
}
