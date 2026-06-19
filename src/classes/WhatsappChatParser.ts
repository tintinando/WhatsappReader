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

export default class WhatsappChatParser {
  private txtFile: File | null = null;
  public authors = new Set<string>();

  constructor(private files: Map<string, File>) {
    this.#findTxtFile();
  }

  /**
   * Recibe una lista de archivos y devuelve el primer txt que encuentra
   */
  #findTxtFile(): void {
    for (const [filename, file] of this.files) {
      if (filename.toLowerCase().endsWith(".txt")) {
        this.txtFile = file;
        return;
      }
    }
  }

  async parse(): Promise<Message[]> {
    if (!this.txtFile) {
      throw new Error("No se encontró ningún archivo de texto");
    }

    const lines = await this.#readFileLines(this.txtFile);
    return this.#processLines(lines);
  }

  /**
   * Lee un archivo de texto y devuelve su contenido separado por líneas.
   *
   * @param file Archivo a leer.
   * @returns Arreglo con cada línea del archivo.
   */
  async #readFileLines(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n|\r/);
        resolve(lines);
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, "UTF-8");
    });
  }

  /**
   * Convierte las líneas del archivo exportado en mensajes estructurados.
   *
   * Las líneas que no coinciden con el formato esperado son descartadas.
   *
   * @param lines Líneas leídas desde el archivo de texto.
   * @returns Lista de mensajes válidos.
   */
  #processLines(lines: string[]): Message[] {
    const messages: Message[] = [];

    lines.forEach((line) => {
      const msg = this.#parseLine(line);
      if (msg) {
        messages.push(msg);
        // set of unique author
        this.authors.add(msg.author);
      }
    });

    return messages;
  }

  /**
   * Interpreta una línea individual del formato de exportación de WhatsApp.
   * También detecta referencias a archivos adjuntos e intenta asociarlas
   * con los archivos cargados.
   *
   * Ejemplo:
   * ```
   * 18/1/2026, 09:39 - Mirtha Legrand: Este código trae suerte
   * ```
   * @param line Línea del archivo exportado.
   * @returns Un objeto {@link Message} o `null` si la línea no es válida.
   */
  #parseLine(line: string): Message | null {
    const regex = /^(\d{1,2}\/\d{1,2}\/\d{4}), (\d{2}:\d{2}) - (.+?): (.+)$/;
    const result = line.match(regex);

    if (!result) return null;

    const [_, date, time, author, message] = result;
    let file: File | null = null;
    let attachmentType: AttachmentType = null;

    const attachmentMatch = message.match(/^‎?(.+?) \(archivo adjunto\)$/);

    if (attachmentMatch) {
      const filename = attachmentMatch[1].trim();
      file = this.files?.get(filename) ?? null;

      if (file?.type.startsWith("image/")) {
        attachmentType = "image";
      }
    }

    const previewUrl = file ? URL.createObjectURL(file) : null;

    return {
      date,
      time,
      author: author.trim(),
      message: message.trim(),
      file,
      attachmentType,
      previewUrl,
    };
  }
}
