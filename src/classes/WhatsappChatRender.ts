import LazyList, { type Template } from "./LazyList";
import WhatsappChatParser from "./WhatsappChatParser";

export type AttachmentType = "image" | "video" | "audio" | "document" | null;

/**
 * Representa un mensaje parseado desde un archivo de exportación de WhatsApp.
 */
export interface Message {
  date: string;
  time: string;
  author: string;
  message: string;
  file: File | null;
  attachmentType: AttachmentType;
  previewUrl: string | null;
}

export interface FilterOptions {
  filterFn?: ((msg: Message) => boolean) | null;
  hightlightTerm?: string;
  hightLightClass?: string;
}

/**
 * Procesa y renderiza una exportación de chat de WhatsApp.
 *
 * La clase busca automáticamente el archivo `.txt` dentro del conjunto de
 * archivos proporcionados, interpreta cada línea del historial y genera una
 * colección de mensajes que luego se renderiza mediante una instancia de
 * {@link LazyList}.
 *
 * También detecta archivos adjuntos y genera URLs de previsualización para
 * imágenes.
 */
export default class WhatsappChatRender {
  allChats: Message[] = [];
  lazyList: LazyList | null = null;
  private currentHighlightTerm: string = "";
  private currentHighlightClass: string = "highlight";
  public parser: WhatsappChatParser;

  /**
   * @param container Elemento HTML donde se renderizará el chat.
   * @param files Conjunto de archivos exportados desde WhatsApp.
   */
  constructor(
    public container: HTMLElement,
    files: Map<string, File>,
  ) {
    this.parser = new WhatsappChatParser(files);
    this.lazyList = new LazyList<Message>(
      container,
      this.allChats,
      this.messageTemplate,
    );
  }

  /**
   * Procesa el archivo de texto y genera la lista de mensajes.
   *
   * Una vez completado el parseo, actualiza la instancia de
   * {@link LazyList} para mostrar el contenido en pantalla.
   *
   * @throws Error Si no existe un archivo de texto válido o un contenedor HTML.
   */
  async render(): Promise<void> {
    if (!this.container) {
      throw new Error("Falta contenedor HTML");
    }

    try {
      this.allChats = await this.parser.parse();

      if (this.lazyList) {
        this.lazyList.setItems(this.allChats);
      }

      console.log(`${this.allChats.length} mensajes procesados`);
    } catch (e) {
      console.error(`Error al renderizar el chat: ${e}`);
    }
  }

  /**
   * Recibe una función filtrante para buscar solo esos mensajes
   * @param options
   */
  public updateFilter(
    options: FilterOptions | ((msg: Message) => boolean) | null,
  ): void {
    let filterFn: ((msg: Message) => boolean) | null = null;
    let hightlightTerm = "";
    let hightLightClass = "highlight";

    if (typeof options === "function" || options === null) {
      filterFn = options;
    } else if (options) {
      filterFn = options.filterFn ?? null;
      hightlightTerm = options.hightlightTerm?.trim() || "";
      hightLightClass = options.hightLightClass || hightLightClass;
    }

    this.currentHighlightTerm = hightlightTerm;
    this.currentHighlightClass = hightLightClass;

    if (this.lazyList) {
      this.lazyList.updateFilter(filterFn);
    }
  }

  public dispatchNextItemSearch(foward: boolean) {
    this.lazyList?.dispatchNextItemSearch(foward);
  }

  /**
   * Plantilla utilizada por {@link LazyList} para renderizar un mensaje.
   *
   * Si el mensaje contiene una imagen adjunta, se genera una etiqueta `<img>`
   * con carga diferida. En caso contrario se renderiza el contenido textual.
   */
  messageTemplate: Template<Message> = (msg, index) => {
    const isAttachment = !!msg.file;
    const time = `${msg.date} ${msg.time}`;

    let contentHTML = "";

    if (isAttachment && msg.attachmentType === "image" && msg.previewUrl) {
      contentHTML = `
      <img 
        src="${msg.previewUrl}" 
        alt="Adjunto" 
        class="message-image"
        loading="lazy"
      >
    `;
    } else {
      let text = this.#escapeHtml(msg.message);

      if (this.currentHighlightTerm) {
        text = this.#highlightText(
          text,
          this.currentHighlightTerm,
          this.currentHighlightClass,
        );
      }
      contentHTML = `<span class="message-text">${text}</span>`;
    }

    return `
    <div class="message ${isAttachment ? "message-attachment" : ""}" data-index="${index}">
      <div class="message-header">
        <strong class="author">${msg.author}</strong>
        <span class="time">${time}</span>
      </div>
      <div class="message-content">
        ${contentHTML}
      </div>
    </div>
  `;
  };

  #highlightText(text: string, term: string, className: string): string {
    if (!term) return text;

    // Escapar caracteres especiales para regex
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`(${escapedTerm})`, "gi");

    return text.replace(regex, `<mark class="${className}">$1</mark>`);
  }

  /**
   * Escapa caracteres HTML para evitar inyección de contenido en el DOM.
   *
   * @param unsafe Texto sin procesar.
   * @returns Texto seguro para insertar en HTML.
   */
  #escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  destroy() {
    this.lazyList?.destroy();
    this.lazyList = null;

    if (this.container) {
      this.container.innerHTML = "";
    }

    this.allChats = [];
  }
}
