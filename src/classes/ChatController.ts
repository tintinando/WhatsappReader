import type { Message } from "./WhatsappChatParser";
import LazyList, { type Template } from "./LazyList2";

export interface FilterState {
  searchTerm: string;
  startDate: Date | null;
  endDate: Date | null;
}

export class ChatController {
  private allMessages: Message[] = [];

  private currentFilters: FilterState = {
    searchTerm: "",
    startDate: null,
    endDate: null,
  };

  private lazyList: LazyList<Message> | null = null;

  constructor(
    messages: Message[],
    container: HTMLElement,
    template: Template<Message>,
  ) {
    this.allMessages = messages;
    this.lazyList = new LazyList(container, [...this.allMessages], template);
    this.lazyList.init();
  }

  #applyFilters(): Message[] {
    const { searchTerm, startDate, endDate } = this.currentFilters;
    const cleanTerm = searchTerm.trim().toLowerCase();

    return this.allMessages.filter((msg) => {
      if (
        cleanTerm &&
        !msg.message.toLowerCase().includes(cleanTerm) &&
        !msg.author.toLowerCase().includes(cleanTerm)
      ) {
        return false;
      }

      const msgDate = new Date(msg.date);

      if (startDate && msgDate < startDate) return false;
      if (endDate && msgDate > endDate) return false;

      return true;
    });
  }

  public handleSearchTextChange(text: string) {
    this.currentFilters.searchTerm = text;
    this.#triggerUpdate();
  }

  public handleDateRangeChange(start: Date | null, end: Date | null): void {
    this.currentFilters.startDate = start;
    this.currentFilters.endDate = end;
    this.#triggerUpdate();
  }

  #triggerUpdate(): void {
    const recordsToRender = this.#applyFilters();
    this.lazyList?.updateItems(recordsToRender);
  }
}
