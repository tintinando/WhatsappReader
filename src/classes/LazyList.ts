export interface Options {
  batchSize: number;
  threshold: number;
  rootMargin: string;
}

/**
 * Modelo de la función callback que renderiza el HTML
 */
export type Template<T = any> = (item: T, index: number) => string;

/**
 * Clase para inyectar código HTML a medida que avanza
 * el scroll del usuario. Esto evita colapso del DOM
 * en caso de necesitar renderizar un array muy grande
 */
export default class LazyList<T = any> {
  private batchSize: number = 15;
  private threshold: number = 0.1;
  private rootMargin: string = "300px";
  private loadedCount: number = 0;
  private observer: IntersectionObserver | null = null;
  private loading: boolean = false;
  private sentinel: HTMLDivElement | null = null;

  private matchIndices: number[] = [];
  private currentMatchPointer: number = -1;

  /**
   *
   * @param container el nodo del DOM donde se inyectará el HTML
   * @param items el array con la información a renderizar, de tipo <T>
   * @param template función callback que genera el HTML a inyectar
   * @param options Opcional, para modificar cuándo renderizar lo que sigue
   */
  constructor(
    public container: HTMLElement,
    public items: T[],
    public template: Template<T>,
    public options?: Partial<Options>,
  ) {
    this.batchSize = options?.batchSize ?? 15;
    this.threshold = options?.threshold ?? 0.1;
    this.rootMargin = options?.rootMargin ?? "300px";
  }

  /**
   * Inicia la renderización
   */
  init(): void {
    if (!this.container || !this.template) {
      console.error("Lazylist: Se requiere container y template");
      return;
    }

    this.#createSentinel();
    this.#loadMore();
    this.#setupObserver();
  }

  setItems(items: T[]) {
    this.destroy();
    this.items = items;
    this.init();
  }

  /**
   * Método para filtrar los mensajes a mostrar
   * @param filterFn funcion que filtra, igual que en filter
   */
  updateFilter(filterFn?: ((item: T) => boolean) | null): void {
    this.container.querySelectorAll(".highlight-search").forEach((el) => {
      el.classList.remove("highlight-search", "current-search");
    });

    if (!filterFn) {
      this.matchIndices = [];
      this.currentMatchPointer = -1;
      return;
    }

    this.matchIndices = [];
    this.items.forEach((item, index) => {
      if (filterFn(item)) {
        this.matchIndices.push(index);
      }
    });

    this.currentMatchPointer = -1;

    if (this.matchIndices.length > 0) {
      this.dispatchNextItemSearch(true);
    }
  }

  dispatchNextItemSearch(foward: boolean) {
    if (this.matchIndices.length === 0) return;

    if (foward) {
      this.currentMatchPointer++;
      if (this.currentMatchPointer >= this.matchIndices.length) {
        this.currentMatchPointer = this.matchIndices.length - 1;
      }
    } else {
      this.currentMatchPointer--;
      if (this.currentMatchPointer < 0) {
        this.currentMatchPointer = 0;
      }
    }

    const targetIndex = this.matchIndices[this.currentMatchPointer];

    if (targetIndex >= this.loadedCount) {
      this.#loadingUntilIndex(targetIndex);
    }

    const targetElement = this.container.querySelector(
      `[data-index="${targetIndex}"]`,
    );

    console.log(targetElement);
    if (targetElement) {
      this.container
        .querySelector(".current-search")
        ?.classList.remove("current-search");
      targetElement.classList.add("highlight-search", "current-search");

      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /**
   * carga un elemento DOM en la propiedad sentinel si no existe
   */
  #createSentinel(): void {
    if (this.sentinel) return;
    this.sentinel = document.createElement("div");
    this.sentinel.className = "lazy-list-sentinel";
    this.sentinel.style.height = "20px";
    this.sentinel.style.width = "100%";
    this.container?.appendChild(this.sentinel);
  }

  /**
   * carga el Observer que detecta el scroll al final
   * y renderiza lo que sigue
   */
  #setupObserver(): void {
    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.loading && this.hasMore()) {
          this.#loadMore();
        }
      },
      {
        root: null,
        rootMargin: this.rootMargin,
        threshold: this.threshold,
      },
    );

    if (this.sentinel) this.observer.observe(this.sentinel);
  }

  /**
   * Renderiza los elementos necesarios para la parte
   * que sigue en el scroll del usuario
   */
  #loadMore(): void {
    if (this.loading) return;
    this.loading = true;

    const start = this.loadedCount;
    const end = Math.min(start + this.batchSize, this.items.length);

    this.#renderRange(start, end);
    this.loadedCount = end;
    this.loading = false;

    if (!this.hasMore() && this.observer) {
      this.observer.disconnect();
      if (this.sentinel) this.sentinel.style.display = "none";
    }
  }

  #loadingUntilIndex(targetIndex: number): void {
    if (!this.hasMore()) return;

    const start = this.loadedCount;
    const end = Math.min(targetIndex + 1, this.items.length);

    this.#renderRange(start, end);
    this.loadedCount = end;
  }

  #renderRange(start: number, end: number): void {
    if (start >= end) return;

    const fragment = document.createDocumentFragment();

    for (let i = start; i < end; i++) {
      const html = this.template(this.items[i], i);
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-index", i.toString());
      wrapper.className = "lazy-list-item";
      wrapper.innerHTML = html.trim();

      if (this.matchIndices.includes(i)) {
        wrapper.classList.add("highlight-search");
        if (i === this.matchIndices[this.currentMatchPointer]) {
          wrapper.classList.add("current-search");
        }
      }
      while (wrapper.firstChild) {
        fragment.appendChild(wrapper.firstChild);
      }
    }

    if (this.sentinel) {
      this.container.insertBefore(fragment, this.sentinel);
    }
  }

  /**
   *
   * @returns true si hay más elementos a renderizar
   */
  hasMore(): boolean {
    return this.loadedCount < this.items.length;
  }

  /**
   * eliminar las instancias creadas para uso de esta clase
   */
  destroy(): void {
    if (this.observer) this.observer.disconnect();
    this.container.innerHTML = "";
    this.loadedCount = 0;
    this.matchIndices = [];
    this.currentMatchPointer = -1;
    this.sentinel = null;
  }
}
