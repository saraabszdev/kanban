import { describe, expect, it } from "vitest";
import { boardReducer, initialBoard } from "./board";

describe("boardReducer", () => {
  it("starts with five named columns and sample cards", () => {
    expect(initialBoard).toHaveLength(5);
    expect(initialBoard.reduce((count, column) => count + column.cards.length, 0)).toBe(8);
    expect(initialBoard.every((column) => column.name.length > 0)).toBe(true);
  });

  it("renames a column without changing its cards", () => {
    const state = boardReducer(initialBoard, {
      type: "rename-column",
      columnId: "ideas",
      name: "ایده‌های تازه",
    });

    expect(state[0].name).toBe("ایده‌های تازه");
    expect(state[0].cards).toEqual(initialBoard[0].cards);
    expect(initialBoard[0].name).toBe("ایده‌ها");
  });

  it("adds a new empty column at the end of the board", () => {
    const column = { id: "new-column", name: "منتظر", cards: [] };
    const state = boardReducer(initialBoard, { type: "add-column", column });

    expect(state).toHaveLength(6);
    expect(state.at(-1)).toEqual(column);
    expect(state.slice(0, -1)).toEqual(initialBoard);
    expect(initialBoard).toHaveLength(5);
  });

  it("adds a card to the requested column", () => {
    const card = { id: "new-card", title: "کار تازه", details: "جزئیات" };
    const state = boardReducer(initialBoard, {
      type: "add-card",
      columnId: "ideas",
      card,
    });

    expect(state[0].cards.at(-1)).toEqual(card);
    expect(state[1].cards).toEqual(initialBoard[1].cards);
    expect(initialBoard[0].cards).toHaveLength(2);
  });

  it("deletes only the selected card from its column", () => {
    const state = boardReducer(initialBoard, {
      type: "delete-card",
      columnId: "ideas",
      cardId: "card-1",
    });

    expect(state[0].cards.map((card) => card.id)).toEqual(["card-2"]);
    expect(state[1].cards).toEqual(initialBoard[1].cards);
  });

  it("moves a card from its source to the end of the destination", () => {
    const state = boardReducer(initialBoard, {
      type: "move-card",
      cardId: "card-1",
      fromColumnId: "ideas",
      toColumnId: "planned",
    });

    expect(state[0].cards.map((card) => card.id)).toEqual(["card-2"]);
    expect(state[1].cards.map((card) => card.id)).toEqual([
      "card-3",
      "card-4",
      "card-1",
    ]);
    expect(initialBoard[0].cards).toHaveLength(2);
  });

  it("moves a card down within its column", () => {
    const state = boardReducer(initialBoard, {
      type: "move-card",
      cardId: "card-1",
      fromColumnId: "ideas",
      toColumnId: "ideas",
      toCardId: "card-2",
    });

    expect(state[0].cards.map((card) => card.id)).toEqual(["card-2", "card-1"]);
  });

  it("moves a card up within its column", () => {
    const reordered = boardReducer(initialBoard, {
      type: "move-card",
      cardId: "card-1",
      fromColumnId: "ideas",
      toColumnId: "ideas",
      toCardId: "card-2",
    });
    const state = boardReducer(reordered, {
      type: "move-card",
      cardId: "card-2",
      fromColumnId: "ideas",
      toColumnId: "ideas",
      toCardId: "card-1",
    });

    expect(state[0].cards.map((card) => card.id)).toEqual(["card-1", "card-2"]);
  });

  it("leaves the board unchanged for invalid moves", () => {
    const invalid = boardReducer(initialBoard, {
      type: "move-card",
      cardId: "missing-card",
      fromColumnId: "ideas",
      toColumnId: "planned",
    });

    expect(invalid).toBe(initialBoard);
  });
});
