import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  IonItemSliding
} from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { addIcons } from 'ionicons';
import {
  add,
  close,
  flag,
  trash,
  checkmarkDone,
  arrowUndo,
  timeOutline,
  calendarOutline,
  funnelOutline,
  searchOutline,
  swapVerticalOutline,
  pricetagOutline
} from 'ionicons/icons';

interface Tarea {
  id: number;
  titulo: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  categoria: 'Personal' | 'Trabajo' | 'Estudio' | 'Compras';
  completada: boolean;
  fecha?: string;
  hora?: string;
}

type FiltroPrioridad = 'Todas' | 'Alta' | 'Media' | 'Baja';
type FiltroCategoria = 'Todas' | 'Personal' | 'Trabajo' | 'Estudio' | 'Compras';
type OrdenTareas = 'recientes' | 'antiguas' | 'alta-primero' | 'baja-primero';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HomePage {
  tareas: Tarea[] = [];

  mostrarModal = false;
  nuevaTarea = '';
  prioridadSeleccionada: 'Alta' | 'Media' | 'Baja' = 'Media';
  categoriaSeleccionada: 'Personal' | 'Trabajo' | 'Estudio' | 'Compras' = 'Personal';

  modoEdicion = false;
  tareaEditandoId: number | null = null;

  filtroActual: FiltroPrioridad = 'Todas';
  filtroCategoriaActual: FiltroCategoria = 'Todas';
  textoBusqueda = '';
  ordenActual: OrdenTareas = 'recientes';

  private pressTimer: any = null;
  private startX = 0;
  private startY = 0;
  private moved = false;
  private pressDelay = 550;

  constructor() {
    addIcons({
      add,
      close,
      flag,
      trash,
      checkmarkDone,
      arrowUndo,
      timeOutline,
      calendarOutline,
      funnelOutline,
      searchOutline,
      swapVerticalOutline,
      pricetagOutline
    });
  }

  async ngOnInit() {
    await this.cargarTareas();
  }

  get tareasPendientes(): Tarea[] {
    return this.aplicarFiltros(this.tareas.filter((t) => !t.completada));
  }

  get tareasCompletadas(): Tarea[] {
    return this.aplicarFiltros(this.tareas.filter((t) => t.completada));
  }

  aplicarFiltros(lista: Tarea[]): Tarea[] {
    let resultado = [...lista];

    if (this.filtroActual !== 'Todas') {
      resultado = resultado.filter((t) => t.prioridad === this.filtroActual);
    }

    if (this.filtroCategoriaActual !== 'Todas') {
      resultado = resultado.filter((t) => t.categoria === this.filtroCategoriaActual);
    }

    if (this.textoBusqueda.trim()) {
      const texto = this.textoBusqueda.toLowerCase().trim();
      resultado = resultado.filter((t) =>
        t.titulo.toLowerCase().includes(texto) ||
        t.categoria.toLowerCase().includes(texto)
      );
    }

    return this.ordenarTareas(resultado);
  }

  ordenarTareas(lista: Tarea[]): Tarea[] {
    const copia = [...lista];

    const prioridadValor: Record<'Alta' | 'Media' | 'Baja', number> = {
      Alta: 3,
      Media: 2,
      Baja: 1,
    };

    switch (this.ordenActual) {
      case 'recientes':
        return copia.sort((a, b) => b.id - a.id);
      case 'antiguas':
        return copia.sort((a, b) => a.id - b.id);
      case 'alta-primero':
        return copia.sort(
          (a, b) => prioridadValor[b.prioridad] - prioridadValor[a.prioridad]
        );
      case 'baja-primero':
        return copia.sort(
          (a, b) => prioridadValor[a.prioridad] - prioridadValor[b.prioridad]
        );
      default:
        return copia;
    }
  }

  cambiarFiltro(filtro: FiltroPrioridad) {
    this.filtroActual = filtro;
  }

  cambiarFiltroCategoria(event: any) {
    this.filtroCategoriaActual = event.detail
      ? event.detail.value
      : event.target.value;
  }

  cambiarOrden(event: any) {
    this.ordenActual = event.detail
      ? event.detail.value
      : event.target.value;
  }

  async cargarTareas() {
    const { value } = await Preferences.get({ key: 'tareas' });
    this.tareas = value ? JSON.parse(value) : [];
  }

  async guardarEnStorage() {
    await Preferences.set({
      key: 'tareas',
      value: JSON.stringify(this.tareas),
    });
  }

  abrirModal() {
    this.modoEdicion = false;
    this.tareaEditandoId = null;
    this.nuevaTarea = '';
    this.prioridadSeleccionada = 'Media';
    this.categoriaSeleccionada = 'Personal';
    this.mostrarModal = true;
  }

  abrirModalEdicion(tarea: Tarea) {
    this.modoEdicion = true;
    this.tareaEditandoId = tarea.id;
    this.nuevaTarea = tarea.titulo;
    this.prioridadSeleccionada = tarea.prioridad;
    this.categoriaSeleccionada = tarea.categoria;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.nuevaTarea = '';
    this.prioridadSeleccionada = 'Media';
    this.categoriaSeleccionada = 'Personal';
    this.modoEdicion = false;
    this.tareaEditandoId = null;
  }

  async guardarTarea() {
    if (!this.nuevaTarea.trim()) return;

    if (this.modoEdicion && this.tareaEditandoId !== null) {
      const tarea = this.tareas.find((t) => t.id === this.tareaEditandoId);
      if (tarea) {
        tarea.titulo = this.nuevaTarea.trim();
        tarea.prioridad = this.prioridadSeleccionada;
        tarea.categoria = this.categoriaSeleccionada;
      }
    } else {
      const ahora = new Date();

      const fecha = ahora.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const hora = ahora.toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const tarea: Tarea = {
        id: Date.now(),
        titulo: this.nuevaTarea.trim(),
        prioridad: this.prioridadSeleccionada,
        categoria: this.categoriaSeleccionada,
        completada: false,
        fecha,
        hora
      };

      this.tareas.unshift(tarea);
    }

    await this.guardarEnStorage();
    this.cerrarModal();
  }

  async completarTarea(tarea: Tarea) {
    tarea.completada = true;
    await this.guardarEnStorage();
  }

  async restaurarTarea(tarea: Tarea) {
    tarea.completada = false;
    await this.guardarEnStorage();
  }

  async eliminarTarea(id: number) {
    this.tareas = this.tareas.filter((t) => t.id !== id);
    await this.guardarEnStorage();
  }

  async eliminarCompletadas() {
    this.tareas = this.tareas.filter((t) => !t.completada);
    await this.guardarEnStorage();
  }

  obtenerClasePrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'Alta':
        return 'prioridad-alta';
      case 'Media':
        return 'prioridad-media';
      case 'Baja':
        return 'prioridad-baja';
      default:
        return '';
    }
  }

  obtenerDescripcionPrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'Alta':
        return 'Urgente e importante';
      case 'Media':
        return 'Importante, pero no urgente';
      case 'Baja':
        return 'Puede hacerse después';
      default:
        return '';
    }
  }

  onPressStart(event: PointerEvent, tarea: Tarea, slidingItem: IonItemSliding) {
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.moved = false;

    this.clearPressTimer();

    this.pressTimer = setTimeout(async () => {
      if (!this.moved) {
        await slidingItem.close();
        this.abrirModalEdicion(tarea);
      }
    }, this.pressDelay);
  }

  onPressMove(event: PointerEvent) {
    const dx = Math.abs(event.clientX - this.startX);
    const dy = Math.abs(event.clientY - this.startY);

    if (dx > 10 || dy > 10) {
      this.moved = true;
      this.clearPressTimer();
    }
  }

  onPressEnd() {
    this.clearPressTimer();
  }

  private clearPressTimer() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }
}