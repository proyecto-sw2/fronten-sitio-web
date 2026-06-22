import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, catchError, timeout } from 'rxjs';

import { environment } from '../environments/environment';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly API_URL = environment.chatbotApiUrl;
  private readonly REQUEST_TIMEOUT = 30000; // 30 segundos

  constructor(private http: HttpClient) { }

  sendMessage(message: string): Observable<ChatResponse> {
    const request: ChatRequest = { message };
    
    return this.http.post<ChatResponse>(`${this.API_URL}/message`, request)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError)
      );
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError = (error: HttpErrorResponse): Observable<ChatResponse> => {
    console.error('Error en ChatbotService:', error);
    
    let fallbackMessage = '';
    
    if (error.status === 0) {
      // Error de conexión
      fallbackMessage = `No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet o intenta más tarde.`;
    } else if (error.status >= 500) {
      // Error del servidor
      fallbackMessage = 'El servidor está experimentando dificultades técnicas. Por favor, contacta directamente a wilderc.q.16@gmail.com';
    } else if (error.status === 400) {
      // Error de solicitud
      fallbackMessage = 'Hubo un problema con tu consulta. ¿Podrías reformular tu pregunta?';
    } else {
      // Otros errores
      fallbackMessage = 'Disculpa, estoy experimentando dificultades técnicas. Por favor, contacta directamente a wilderc.q.16@gmail.com o completa el formulario de demo en nuestra página web.';
    }

    return of({
      message: fallbackMessage,
      timestamp: new Date().toISOString()
    });
  }

  // Respuestas de emergencia si la API no está disponible
  getEmergencyResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('contacto') || lowerMessage.includes('email') || lowerMessage.includes('telefono')) {
      return 'Puedes contactarnos en wilderc.q.16@gmail.com, llamar al +591 60937613, o completar el formulario de contacto en nuestra página web.';
    }
    
    if (lowerMessage.includes('servicio') || lowerMessage.includes('que hacen')) {
      return 'Kryptek se especializa en soluciones tecnológicas de alto impacto: desarrollo de software a medida, inteligencia artificial, soluciones Blockchain, y aplicaciones móviles.';
    }
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('prueba')) {
      return 'Puedes solicitar una demo completando el formulario de contacto en nuestra página web.';
    }
    
    return 'Disculpa, estoy experimentando dificultades técnicas. Por favor, contacta directamente a wilderc.q.16@gmail.com para obtener información sobre nuestras soluciones tecnológicas.';
  }
}