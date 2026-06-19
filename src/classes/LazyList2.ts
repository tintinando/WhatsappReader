export interface Options {
  batchSize: number;
  threshold: number;
  rootMargin: string;
}

export type Template<T = any> = (item: T, index: number) => string;

export default class LazyList<T = any> {
  private batchSize: number;
  private loadedCount: number = 0;
  private observer: IntersectionObserver | null = null;
  private sentinel: HTMLDivElement | null = null;
  private loading: boolean = false;

  constructor(
    public container: HTMLElement,
    public items: T[],
    public template: Template<T>,
    public options?: Partial<Options>,
  ) {
    this.batchSize = options?.batchSize ?? 15;
  }

  public init(): void {
    if (!this.container || !this.template) return;
    this.#resetView();
    this.#createSentinel();
    this.#setupObserver();
  }

  public updateItems(newFilteredItems: T[]): void {
    this.items = newFilteredItems;
    this.#resetView();
    this.#loadMore();
  }

  #resetView() {
    this.loadedCount = 0;
    this.container.innerHTML = "";
    if (this.sentinel) this.container.appendChild(this.sentinel);
  }

  /**
   * Renderiza al final una cantidad de items
   * según la propiedad this.batchSize
   */
  #loadMore(): void {
    if (this.loading || this.loadedCount >= this.items.length) return;
    this.loading = true;

    const fragment = document.createDocumentFragment();
    const nextBatch = this.items.slice(
      this.loadedCount,
      this.loadedCount + this.batchSize,
    );

    nextBatch.forEach((item, index) => {
      const htmlString = this.template(item, index);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlString.trim();
      if (tempDiv.firstChild) fragment.appendChild(tempDiv.firstChild);
    });

    if (this.sentinel) {
      this.container.insertBefore(fragment, this.sentinel);
    } else {
      this.container.appendChild(fragment);
    }

    this.loadedCount += nextBatch.length;
    this.loading = false;
  }

  /**
   * Sentinel es un elemento del DOM invisible, que al ser
   * visible en el scroll dispara una acción configurada
   * en setupObserver
   */
  #createSentinel(): void {
    if (this.sentinel) return;
    this.sentinel = document.createElement("div");
    this.sentinel.className = "lazy-list-sentinel";
    this.sentinel.style.height = "20px";
    this.sentinel.style.width = "100%";
    this.container?.appendChild(this.sentinel);
  }

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
}
