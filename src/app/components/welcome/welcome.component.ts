import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import emailjs from '@emailjs/browser';
import { ChatbotService } from '../../services/chatbot.service';

interface DemoRequest {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  tipoNegocio: string;
  mensaje: string;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean; // Agregar esta propiedad opcional
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements AfterViewInit, OnDestroy {
  // 3D Model properties
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private head: THREE.Object3D | null = null;
  private resizeObserver!: ResizeObserver;

  @ViewChild('sceneContainer', { static: true }) sceneContainer!: ElementRef;

  // UI State properties
  chatOpen = false;
  isSubmitting = false;

  // Demo form properties
  demoRequest: DemoRequest = {
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    tipoNegocio: '',
    mensaje: '',
  };

  // Chat properties
  chatMessage = '';
  chatMessages: ChatMessage[] = [];
  isTyping = false; // Para mostrar indicador de "escribiendo..."

  // EmailJS Configuration
  private readonly EMAILJS_CONFIG = {
    SERVICE_ID: 'service_c5qriij', // Reemplazar con tu Service ID
    TEMPLATE_ID: 'template_cwb0n2f', // Reemplazar con tu Template ID
    PUBLIC_KEY: 'FcMtfRv78IoUaa2Bb', // Reemplazar con tu Public Key
  };



  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private chatbotService: ChatbotService
  ) {}

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize.bind(this));
      window.removeEventListener('mousemove', this.onMouseMove.bind(this));

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }

      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initScene();
      this.loadModel();
      this.animate();
      this.initEmailJS();

      window.addEventListener('resize', this.onResize.bind(this));
      window.addEventListener('mousemove', this.onMouseMove.bind(this));

      this.setupResizeObserver();
    }
  }

  // === EmailJS Initialization ===
  private initEmailJS() {
    // Inicializar EmailJS con tu Public Key
    emailjs.init(this.EMAILJS_CONFIG.PUBLIC_KEY);
  }

  // === 3D Model Methods ===
  private setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          this.updateRendererSize();
        }
      });

      this.resizeObserver.observe(this.sceneContainer.nativeElement);
    }
  }

  private initScene() {
    this.scene = new THREE.Scene();

    const width = this.sceneContainer.nativeElement.offsetWidth;
    const height = this.sceneContainer.nativeElement.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0.1, 1, 5);
    this.camera.updateProjectionMatrix();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.sceneContainer.nativeElement.appendChild(this.renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 2, 5);
    this.scene.add(directionalLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.enableZoom = false;
    this.controls.enableRotate = false;
    this.controls.mouseButtons.RIGHT = null as any;
  }

  private loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      'assets/will10.glb',
      (gltf) => {
        const model = gltf.scene;

        const head = model.getObjectByName('head');
        if (head) {
          this.head = head;
        } else {
          console.warn("No se encontró el objeto 'head' en el modelo.");
        }

        model.scale.set(1, 0.65, 0.4);
        model.position.set(0, -0.6, 0);

        this.scene.add(model);
      },
      undefined,
      (error) => {
        console.error('Error al cargar el modelo:', error);
      }
    );
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.head) return;

    const containerRect =
      this.sceneContainer.nativeElement.getBoundingClientRect();

    const mouseXRelative = event.clientX - containerRect.left;
    const mouseYRelative = event.clientY - containerRect.top;

    const mouseX = (mouseXRelative / containerRect.width) * 2 - 1;
    const mouseY = -((mouseYRelative / containerRect.height) * 2 - 1);

    const maxRotationX = Math.PI / 4;
    const maxRotationY = Math.PI / 4;

    this.head.rotation.y = mouseX * maxRotationY;
    this.head.rotation.x = -mouseY * maxRotationX * 0.2;

    this.head.rotation.x = Math.max(
      Math.min(this.head.rotation.x, maxRotationX),
      -maxRotationX
    );
    this.head.rotation.y = Math.max(
      Math.min(this.head.rotation.y, maxRotationY),
      -maxRotationY
    );
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateRendererSize();
  }

  private updateRendererSize() {
    if (!this.renderer || !this.camera || !this.sceneContainer) return;

    const width = this.sceneContainer.nativeElement.offsetWidth;
    const height = this.sceneContainer.nativeElement.offsetHeight;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // === Navigation Methods ===
  scrollToDemo() {
    const element = document.getElementById('demo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToServices() {
    const element = document.getElementById('servicios');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // === Demo Form Methods ===
  async submitDemoRequest() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      // Preparar los datos del template - MAPEO CORRECTO para tu template
      const templateParams = {
        // Variables que usa tu template personalizado
        nombre: this.demoRequest.nombre,
        empresa: this.demoRequest.empresa,
        email: this.demoRequest.email,
        telefono: this.demoRequest.telefono || 'No proporcionado',
        tipo_negocio: this.getFormattedBusinessType(
          this.demoRequest.tipoNegocio
        ),
        mensaje:
          this.demoRequest.mensaje || 'Sin mensaje adicional proporcionado.',
        fecha: new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        hora: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      console.log('Enviando datos a EmailJS:', templateParams);
      console.log('Usando Template ID:', this.EMAILJS_CONFIG.TEMPLATE_ID);

      // Enviar email usando EmailJS
      const response = await emailjs.send(
        this.EMAILJS_CONFIG.SERVICE_ID,
        this.EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      console.log('Email enviado exitosamente:', response);

      // Reset form
      this.demoRequest = {
        nombre: '',
        empresa: '',
        email: '',
        telefono: '',
        tipoNegocio: '',
        mensaje: '',
      };

      // Show success message
      this.showSuccessMessage(
        '¡Gracias! Tu solicitud de demo ha sido enviada. Nos pondremos en contacto contigo pronto.'
      );
    } catch (error) {
      console.error('Error al enviar el email:', error);
      this.showErrorMessage(
        'Hubo un error al enviar tu solicitud. Por favor, inténtalo de nuevo o contáctanos directamente.'
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  private getFormattedBusinessType(tipo: string): string {
    const tipos = {
      taller: 'Taller Mecánico',
      concesionario: 'Concesionario',
      'centro-tecnico': 'Centro Técnico',
      otro: 'Otro',
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  }

  private showSuccessMessage(message: string) {
    // Puedes implementar un toast o modal aquí
    alert(message);
  }

  private showErrorMessage(message: string) {
    // Puedes implementar un toast o modal aquí
    alert(message);
  }

  // === Chatbot Methods ===
  toggleChat() {
    this.chatOpen = !this.chatOpen;
  }

  sendChatMessage() {
    if (!this.chatMessage.trim() || this.isTyping) return;

    const userMessage = this.chatMessage.trim();

    // Agregar mensaje del usuario
    const userChatMessage: ChatMessage = {
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
    };
    this.chatMessages.push(userChatMessage);

    // Limpiar input
    this.chatMessage = '';

    // Mostrar indicador de "escribiendo..."
    this.isTyping = true;
    const typingMessage: ChatMessage = {
      text: 'Escribiendo...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };
    this.chatMessages.push(typingMessage);

    // Enviar mensaje a la API
    this.chatbotService.sendMessage(userMessage).subscribe({
      next: (response) => {
        // Remover mensaje de "escribiendo..."
        this.removeTypingMessage();

        // Agregar respuesta del botchatMessage
        const botMessage: ChatMessage = {
          text: response.message,
          isUser: false,
          timestamp: new Date(response.timestamp),
        };
        this.chatMessages.push(botMessage);

        this.isTyping = false;
      },
      error: (error) => {
        console.error('Error en el chat:', error);

        // Remover mensaje de "escribiendo..."
        this.removeTypingMessage();

        // Mostrar mensaje de error o respuesta de emergencia
        const errorMessage: ChatMessage = {
          text: this.chatbotService.getEmergencyResponse(userMessage),
          isUser: false,
          timestamp: new Date(),
        };
        this.chatMessages.push(errorMessage);

        this.isTyping = false;
      },
    });
  }
  private removeTypingMessage() {
    const typingIndex = this.chatMessages.findIndex((msg) => msg.isLoading);
    if (typingIndex !== -1) {
      this.chatMessages.splice(typingIndex, 1);
    }
  }
  // Método para verificar la salud del servidor (opcional)
  checkChatbotHealth() {
    this.chatbotService.checkHealth().subscribe({
      next: (response) => {
        console.log('Chatbot API status:', response);
      },
      error: (error) => {
        console.warn('Chatbot API no disponible:', error);
      },
    });
  }
}
