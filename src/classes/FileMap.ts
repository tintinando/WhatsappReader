import FileDragDrop from "./FileDragDrop";

/**
 * Centraliza la recepción de archivos desde distintas fuentes de entrada.
 *
 * La clase escucha tanto la selección de archivos mediante un
 * `<input type="file">` como el arrastre de archivos o carpetas sobre
 * una zona de drop. Independientemente del origen, los archivos son
 * convertidos a un `Map<string, File>` cuya clave es el nombre del archivo.
 *
 * Cuando se reciben archivos, se invoca el callback configurado mediante
 * `onFilePush`.
 *
 * @example
 * const fileMap = new FileMap(
 *   document.querySelector("#file-input"),
 *   document.querySelector("#drop-zone"),
 *   (files) => {
 *     console.log(files.get("chat.txt"));
 *   }
 * );
 */
export default class FileMap {
  /**
   * Campo de selección manual de archivos.
   */
  $inputFile: HTMLInputElement | null = null;
  /**
   * Zona utilizada para arrastrar y soltar archivos.
   */
  $dropZone: HTMLDivElement | null = null;
  /**
   * Instancia encargada de gestionar la lógica de drag & drop.
   */
  fileDragDrop: FileDragDrop;
  /**
   * Callback ejecutado cuando se reciben archivos.
   *
   * Los archivos se entregan en un mapa indexado por nombre.
   */
  onFilePush: (files: Map<string, File>) => void;

  /**
   * Crea una nueva instancia de gestión de archivos.
   *
   * @param inputFile Elemento `<input type="file">`.
   * @param dropZone Elemento utilizado como zona de arrastre.
   * @param onFilePush Función ejecutada al recibir archivos.
   */
  constructor(
    inputFile: HTMLInputElement,
    dropZone: HTMLDivElement,
    onFilePush: (files: Map<string, File>) => void,
  ) {
    this.$inputFile = inputFile;
    this.$dropZone = dropZone;
    this.onFilePush = onFilePush;
    this.handleFiles = this.handleFiles.bind(this);

    this.fileDragDrop = new FileDragDrop(dropZone, this.handleFiles);

    this.$inputFile.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.handleFiles(target.files ? Array.from(target.files) : null);
    });
  }

  /**
   * Procesa una colección de archivos y la transforma en un mapa
   * indexado por nombre.
   *
   * Si existen archivos con el mismo nombre, el último procesado
   * sobrescribirá al anterior.
   *
   * @param files Lista de archivos recibidos o `null`.
   */
  handleFiles(files: File[] | null) {
    if (!files) return;

    const mapFiles = new Map();

    files.forEach((file) => {
      mapFiles.set(file.name, file);
    });

    this.onFilePush(mapFiles);
  }

  destroy() {
    this.fileDragDrop.destroy();
  }
}
