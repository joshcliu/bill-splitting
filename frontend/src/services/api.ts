import axios, { AxiosInstance } from 'axios';
import {
  Session,
  Receipt,
  BillItem,
  Participant,
  CreateSessionRequest,
  JoinSessionRequest,
  AssignItemRequest,
  ItemAssignment,
  User,
} from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth tokens if needed
    this.client.interceptors.request.use((config) => {
      // TODO: Add auth token if available
      // const token = localStorage.getItem('token');
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
      return config;
    });
  }

  // Session Management
  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response = await this.client.post<Session>('/api/sessions', data);
    return response.data;
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await this.client.get<Session>(`/api/sessions/${sessionId}`);
    return response.data;
  }

  async getSessionByCode(sessionCode: string): Promise<Session> {
    const response = await this.client.get<Session>(`/api/sessions/code/${sessionCode}`);
    return response.data;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const response = await this.client.put<Session>(`/api/sessions/${sessionId}`, updates);
    return response.data;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(`/api/sessions/${sessionId}`);
  }

  async joinSession(data: JoinSessionRequest): Promise<{ session: Session; participant: Participant }> {
    const response = await this.client.post(`/api/sessions/join`, data);
    return response.data;
  }

  async completeSession(sessionId: string): Promise<Session> {
    const response = await this.client.post<Session>(`/api/sessions/${sessionId}/complete`);
    return response.data;
  }

  // Receipt Processing
  async uploadReceipt(file: File): Promise<{ receiptId: string; imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.client.post('/api/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async scanReceipt(receiptId: string): Promise<Receipt> {
    const response = await this.client.post<Receipt>(`/api/receipts/${receiptId}/scan`);
    return response.data;
  }

  async getReceipt(receiptId: string): Promise<Receipt> {
    const response = await this.client.get<Receipt>(`/api/receipts/${receiptId}`);
    return response.data;
  }

  // Bill Items
  async getSessionItems(sessionId: string): Promise<BillItem[]> {
    const response = await this.client.get<BillItem[]>(`/api/sessions/${sessionId}/items`);
    return response.data;
  }

  async addItem(sessionId: string, item: Omit<BillItem, 'id' | 'sessionId'>): Promise<BillItem> {
    const response = await this.client.post<BillItem>(`/api/sessions/${sessionId}/items`, item);
    return response.data;
  }

  async updateItem(itemId: string, updates: Partial<BillItem>): Promise<BillItem> {
    const response = await this.client.put<BillItem>(`/api/items/${itemId}`, updates);
    return response.data;
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.client.delete(`/api/items/${itemId}`);
  }

  // Item Assignment
  async assignItem(data: AssignItemRequest): Promise<ItemAssignment[]> {
    const response = await this.client.post<ItemAssignment[]>('/api/items/assign', data);
    return response.data;
  }

  async updateAssignment(assignmentId: string, updates: Partial<ItemAssignment>): Promise<ItemAssignment> {
    const response = await this.client.put<ItemAssignment>(`/api/assignments/${assignmentId}`, updates);
    return response.data;
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    await this.client.delete(`/api/assignments/${assignmentId}`);
  }

  // Participants
  async getParticipants(sessionId: string): Promise<Participant[]> {
    const response = await this.client.get<Participant[]>(`/api/sessions/${sessionId}/participants`);
    return response.data;
  }

  async addParticipant(sessionId: string, participant: Partial<Participant>): Promise<Participant> {
    const response = await this.client.post<Participant>(`/api/sessions/${sessionId}/participants`, participant);
    return response.data;
  }

  async updateParticipant(participantId: string, updates: Partial<Participant>): Promise<Participant> {
    const response = await this.client.put<Participant>(`/api/participants/${participantId}`, updates);
    return response.data;
  }

  async markPaid(participantId: string): Promise<Participant> {
    const response = await this.client.post<Participant>(`/api/participants/${participantId}/mark-paid`);
    return response.data;
  }

  // User
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/api/users/me');
    return response.data;
  }

  async getUserHistory(): Promise<Session[]> {
    const response = await this.client.get<Session[]>('/api/users/me/history');
    return response.data;
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    const response = await this.client.put<User>('/api/users/me', updates);
    return response.data;
  }
}

// Create and export API instance
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const api = new ApiService(API_BASE_URL);
