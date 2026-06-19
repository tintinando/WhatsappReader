import FileMap from "./classes/FileMap";
import WhatsappChatRender from "./classes/WhatsappChatRender";

const $ = <T extends HTMLElement>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Elemento obligatorio no encontrado: ${selector}`);
  return el;
};

const nodes = {
  dropZone: $<HTMLDivElement>("#drop-zone"),
  fileInput: $<HTMLInputElement>("#file-input"),
  messages: $<HTMLElement>("#messages"),
  btnInicio: $<HTMLAnchorElement>("#btn-inicio"),
  searchBar: $<HTMLDivElement>("#search-bar"),
  searchInput: $("#search-bar input") as HTMLInputElement,
  btnGoToTop: $<HTMLButtonElement>("#btn-go-to-top"),
  beforeAfter: $<HTMLDivElement>("#before-after"),
  btnBefore: $<HTMLButtonElement>("#btn-before"),
  btnAfter: $<HTMLButtonElement>("#btn-after"),
};

interface AppState {
  fileMap: FileMap | null;
  renderer: WhatsappChatRender | null;
  searchDebounceTimer: number;
}

const state: AppState = {
  fileMap: null,
  renderer: null,
  searchDebounceTimer: 0,
};

const UIManager = {
  showInitialViewState() {
    nodes.dropZone.classList.remove("hidden");
    nodes.searchBar.classList.add("hidden");
    nodes.messages.innerHTML = "";
    nodes.searchInput.value = "";
    nodes.searchInput.blur();
  },

  showChatViewState() {
    nodes.dropZone.classList.add("hidden");
    nodes.searchBar.classList.remove("hidden");
    nodes.messages.innerHTML = "";
  },

  toggleGoToTopButton(visible: boolean) {
    nodes.btnGoToTop.classList.toggle("hidden", !visible);
  },
};

function handleFilePush(files: Map<string, File>) {
  UIManager.showChatViewState();

  state.renderer?.destroy();
  state.renderer = new WhatsappChatRender(nodes.messages, files);
  state.renderer.render();
  nodes.btnBefore.addEventListener("click", () => {
    state.renderer?.dispatchNextItemSearch(false);
  });

  nodes.btnAfter.addEventListener("click", () => {
    state.renderer?.dispatchNextItemSearch(true);
  });
}

function handleReset() {
  if (state.renderer) {
    state.renderer.updateFilter(null);
    state.renderer.destroy();
    state.renderer = null;
  }

  UIManager.showInitialViewState();

  state.fileMap?.destroy();
  state.fileMap = new FileMap(nodes.fileInput, nodes.dropZone, handleFilePush);
  nodes.beforeAfter.classList.replace("flex", "hidden");
}

function handleSearch(clear = false): void {
  if (clear) nodes.searchInput.value = "";
  nodes.searchInput.blur();

  const query = nodes.searchInput.value.trim();

  if (!state.renderer) return;

  if (query === "") {
    state.renderer.updateFilter(null);
    nodes.beforeAfter.classList.replace("flex", "hidden");
  } else {
    state.renderer.updateFilter({
      filterFn: (msg) =>
        msg.message.toLowerCase().includes(query.toLowerCase()),
      hightlightTerm: query,
    });
    nodes.beforeAfter.classList.replace("hidden", "flex");
  }
}
function initListeners() {
  nodes.btnInicio.addEventListener("click", (e) => {
    e.preventDefault();
    handleReset();
  });

  nodes.btnGoToTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  });

  nodes.searchInput.addEventListener("input", () => {
    window.clearTimeout(state.searchDebounceTimer);

    state.searchDebounceTimer = window.setTimeout(() => {
      handleSearch();
    }, 800);
  });

  nodes.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearTimeout(state.searchDebounceTimer);
      handleSearch(true);
    }
  });

  document.addEventListener("scroll", () => {
    const isPastThreshold = window.pageYOffset > 100;
    UIManager.toggleGoToTopButton(isPastThreshold);
  });

  document.addEventListener("keydown", () => {
    if (document.activeElement !== nodes.searchInput) nodes.searchInput.focus();
  });
}

function main(): void {
  state.fileMap = new FileMap(nodes.fileInput, nodes.dropZone, handleFilePush);
  initListeners();
}

main();
