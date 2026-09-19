export interface WhatsAppSendTextInput {
  phone: string;
  message: string;
}

export interface WhatsAppMessageResponse {
  success: boolean;
  data?: {
    messageId?: string;
    jid?: string;
  };
  error?: string;
}

export interface WhatsAppStatusResponse {
  success: boolean;
  data?: {
    state: string;
    connected: boolean;
    hasQR: boolean;
    sessionDirectory?: string;
  };
  error?: string;
}

export interface WhatsAppHealthResponse {
  success: boolean;
  service?: string;
  status?: string;
  timestamp?: string;
  error?: string;
}

export interface WhatsAppSendTextResult {
  messageId: string;
  jid: string;
}

export interface WhatsAppStatus {
  state: string;
  connected: boolean;
  hasQR: boolean;
}
