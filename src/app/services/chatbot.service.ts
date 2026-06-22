import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, catchError, timeout } from 'rxjs';


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
  private readonly API_URL = 'http://localhost:3000/api/chatbot';
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
      fallbackMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet y que el servidor esté funcionando en http://localhost:3000';
    } else if (error.status >= 500) {
      // Error del servidor
      fallbackMessage = 'El servidor está experimentando dificultades técnicas. Por favor, contacta directamente a info@qualix.com';
    } else if (error.status === 400) {
      // Error de solicitud
      fallbackMessage = 'Hubo un problema con tu consulta. ¿Podrías reformular tu pregunta?';
    } else {
      // Otros errores
      fallbackMessage = 'Estoy experimentando dificultades técnicas. Mientras tanto, puedes contactarnos directamente a info@qualix.com o completar el formulario de demo.';
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
      return 'Puedes contactarnos en info@qualix.com, llamar al +591 7000-0000, o completar el formulario de demo en nuestra página web.';
    }
    
    if (lowerMessage.includes('servicio') || lowerMessage.includes('que hacen')) {
      return 'QUALIX se especializa en desarrollo de software para el sector automotriz: gestión de talleres, diagnósticos digitales con IA, análisis de datos, apps móviles y soluciones en la nube.';
    }
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('prueba')) {
      return 'Puedes solicitar una demo completando el formulario en la sección "Solicita una Demo" de nuestra página web.';
    }
    
    return 'Disculpa, estoy experimentando dificultades técnicas. Por favor, contacta directamente a info@qualix.com para obtener información sobre nuestras soluciones para el sector automotriz.';
  }
}