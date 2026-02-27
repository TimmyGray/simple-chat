import axios from 'axios';
import type { Conversation, Message, ModelInfo, Attachment, AuthResponse, User, ConversationId, MessageId, ModelId, Template, TemplateId, CreateTemplateDto, UpdateTemplateDto, Participant, ParticipantRole } from '../types';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TOKEN_KEY = 'auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Unwrap API envelope: { data: T } → T
    // Only unwrap when the response is exactly { data: ... } (single key) to avoid
    // false-positive matches on responses that incidentally have a 'data' property.
    if (
      response.data != null &&
      typeof response.data === 'object' &&
      !Array.isArray(response.data) &&
      'data' in response.data &&
      Object.keys(response.data).length === 1
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && getStoredToken() && !isAuthEndpoint) {
      clearStoredToken();
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

// Auth

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/register', { email, password });
  return data;
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get('/auth/profile');
  return data;
}

// Conversations

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get('/conversations');
  return data;
}

export async function createConversation(
  body?: { title?: string; model?: ModelId; templateId?: TemplateId },
): Promise<Conversation> {
  const { data } = await api.post('/conversations', body || {});
  return data;
}

export async function updateConversation(
  id: ConversationId,
  body: { title?: string; model?: ModelId },
): Promise<Conversation> {
  const { data } = await api.patch(`/conversations/${id}`, body);
  return data;
}

export async function deleteConversation(id: ConversationId): Promise<void> {
  await api.delete(`/conversations/${id}`);
}

export async function forkConversation(
  conversationId: ConversationId,
  messageId: MessageId,
): Promise<Conversation> {
  const { data } = await api.post(`/conversations/${conversationId}/fork/${messageId}`);
  return data;
}

export async function getMessages(conversationId: ConversationId): Promise<Message[]> {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return data;
}

export async function searchConversations(query: string, signal?: AbortSignal): Promise<Conversation[]> {
  const { data } = await api.get('/conversations/search', { params: { q: query }, signal });
  return data;
}

export { sendMessageStream, editMessageStream, regenerateMessageStream } from './stream';

// SYNC: Keep ExportFormat in sync with backend/src/chat/dto/export-conversation.dto.ts
export type ExportFormat = 'markdown' | 'pdf' | 'json';

export async function exportConversation(
  conversationId: ConversationId,
  format: ExportFormat,
): Promise<Blob> {
  const response = await api.get(
    `/conversations/${conversationId}/export`,
    { params: { format }, responseType: 'blob' },
  );
  return response.data as Blob;
}

export function getUploadUrl(filePath: string): string {
  const filename = filePath.split('/').pop() ?? filePath;
  return `${BASE_URL}/uploads/${encodeURIComponent(filename)}`;
}

export function isImageAttachment(attachment: Attachment): boolean {
  return attachment.fileType.startsWith('image/');
}

export async function uploadFiles(files: File[]): Promise<Attachment[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getModels(): Promise<ModelInfo[]> {
  const { data } = await api.get('/models');
  return data;
}

export async function getTemplates(): Promise<Template[]> {
  const { data } = await api.get('/templates');
  return data;
}

export async function createTemplate(dto: CreateTemplateDto): Promise<Template> {
  const { data } = await api.post('/templates', dto);
  return data;
}

export async function updateTemplate(id: TemplateId, dto: UpdateTemplateDto): Promise<Template> {
  const { data } = await api.patch(`/templates/${id}`, dto);
  return data;
}

export async function deleteTemplate(id: TemplateId): Promise<void> {
  await api.delete(`/templates/${id}`);
}

// Sharing

export async function getSharedConversations(): Promise<Conversation[]> {
  const { data } = await api.get('/conversations/shared');
  return data;
}

export async function getParticipants(conversationId: ConversationId): Promise<Participant[]> {
  const { data } = await api.get(`/conversations/${conversationId}/participants`);
  return data;
}

export async function inviteParticipant(
  conversationId: ConversationId,
  email: string,
  role?: ParticipantRole,
): Promise<Participant> {
  const { data } = await api.post(`/conversations/${conversationId}/participants`, { email, role });
  return data;
}

export async function revokeParticipant(
  conversationId: ConversationId,
  userId: string,
): Promise<void> {
  await api.delete(`/conversations/${conversationId}/participants/${userId}`);
}
