/**
 * Gestiona una zona de arrastre (drag & drop) para archivos y directorios.
 *
 * La clase registra los eventos necesarios sobre un elemento HTML para
 * permitir que el usuario arrastre archivos o carpetas desde el sistema
 * operativo. Cuando se completa la operación, se obtiene una lista plana
 * con todos los archivos encontrados y se invoca el callback configurado.
 *
 * Durante el arrastre se agrega la clase CSS `highlight` al elemento para
 * facilitar la retroalimentación visual.
 *
 * @example
 * const dropZone = document.getElementById("drop-zone");
 *
 * const dragDrop = new FileDragDrop(dropZone, (files) => {
 *   console.log(files);
 * });
 *
 * // Cuando ya no sea necesario:
 * dragDrop.destroy();
 */
export default class FileDragDrop {
  /**
   * Elemento HTML utilizado como zona de arrastre.
   */
  node: HTMLElement | null;
  /**
   * Función ejecutada cuando se completa una operación de arrastre
   * y se detectan uno o más archivos.
   */
  onDrop: ((file: File[]) => void) | null;

  /**
   * Crea una nueva instancia de gestión de drag & drop.
   *
   * @param node Elemento HTML que actuará como zona de arrastre.
   * @param onDrop Callback que recibirá todos los archivos encontrados.
   */
  constructor(
    node: HTMLElement | null = null,
    onDrop: ((files: File[]) => void) | null = null,
  ) {
    this.node = node;
    this.onDrop = onDrop;
    this.#init();
  }

  #init(): void {
    if (!this.node) return;
    this.node.addEventListener("dragenter", this.#handleDragEnter);
    this.node.addEventListener("dragover", this.#handleDragOver);
    this.node.addEventListener("dragleave", this.#handleDragLeave);
    this.node.addEventListener("drop", this.#handleDrop);
  }

  #handleDragEnter = (e: DragEvent): void => {
    e.preventDefault();
    this.node?.classList.add("highlight");
  };

  #handleDragOver = (e: DragEvent): void => {
    e.preventDefault();
    this.node?.classList.add("highlight");
  };

  #handleDragLeave = (): void => {
    this.node?.classList.remove("highlight");
  };

  #handleDrop = async (e: DragEvent): Promise<void> => {
    e.preventDefault();
    this.node?.classList.remove("highlight");

    const dt: DataTransfer | null = e.dataTransfer;
    if (!dt || !this.onDrop) return;

    const allFiles = await this.#getAllFilesFromDataTransfer(dt);

    if (allFiles.length > 0) {
      this.onDrop(allFiles);
    }
  };

  /**
   * Obtiene todos los archivos contenidos en un objeto DataTransfer.
   *
   * Recorre recursivamente directorios y subdirectorios utilizando la API
   * File System Entry de WebKit, devolviendo una lista plana de archivos.
   *
   * @param dt Objeto DataTransfer recibido durante el evento drop.
   * @returns Lista de archivos encontrados.
   */
  async #getAllFilesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
    const files: File[] = [];
    const items = Array.from(dt.items);

    const promises = items.map((item) => {
      const entry = item.webkitGetAsEntry();
      if (!entry) return Promise.resolve();
      return this.#traverseFileTree(entry, files);
    });

    await Promise.all(promises);
    return files;
  }

  /**
   * Recorre recursivamente un archivo o directorio.
   *
   * Si la entrada corresponde a un archivo, se agrega a la colección
   * proporcionada. Si corresponde a un directorio, se procesan todas
   * sus entradas hijas.
   *
   * @param entry Entrada del sistema de archivos.
   * @param fileList Colección donde se acumulan los archivos encontrados.
   */
  async #traverseFileTree(entry: any, fileList: File[]): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve) => {
        entry.file(resolve);
      });

      fileList.push(file);
      return;
    }

    if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const entries = await this.#readAllEntries(dirReader);

      await Promise.all(
        entries.map((childEntry) =>
          this.#traverseFileTree(childEntry, fileList),
        ),
      );
    }
  }

  /**
   * Lee todas las entradas de un directorio.
   *
   * La API `readEntries()` devuelve resultados por lotes, por lo que este
   * método realiza lecturas sucesivas hasta que no quedan más elementos.
   *
   * @param dirReader Lector de directorio.
   * @returns Todas las entradas contenidas en el directorio.
   */
  async #readAllEntries(dirReader: any): Promise<any[]> {
    const entries: any[] = [];

    while (true) {
      const batch = await new Promise<any[]>((resolve) => {
        dirReader.readEntries(resolve);
      });

      if (batch.length === 0) {
        break;
      }

      entries.push(...batch);
    }

    return entries;
  }

  destroy(): void {
    if (!this.node) return;
    this.node.removeEventListener("dragenter", this.#handleDragEnter);
    this.node.removeEventListener("dragover", this.#handleDragOver);
    this.node.removeEventListener("dragleave", this.#handleDragLeave);
    this.node.removeEventListener("drop", this.#handleDrop);
  }
}
