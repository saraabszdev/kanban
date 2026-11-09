export type BoardCard = {
  id: string;
  title: string;
  details: string;
};

export type BoardColumn = {
  id: string;
  name: string;
  cards: BoardCard[];
};

export type BoardState = BoardColumn[];

export type BoardAction =
  | { type: "rename-column"; columnId: string; name: string }
  | { type: "add-card"; columnId: string; card: BoardCard }
  | { type: "delete-card"; columnId: string; cardId: string }
  | {
      type: "move-card";
      cardId: string;
      fromColumnId: string;
      toColumnId: string;
      toCardId?: string;
    };

export const initialBoard: BoardState = [
  {
    id: "ideas",
    name: "ایده‌ها",
    cards: [
      {
        id: "card-1",
        title: "بازطراحی صفحه اصلی",
        details: "یک تجربه‌ی خوشامدگویی تازه برای کاربران جدید.",
      },
      {
        id: "card-2",
        title: "بررسی بازخورد کاربران",
        details: "نکته‌های مصاحبه‌های هفته‌ی گذشته را جمع‌بندی کنیم.",
      },
    ],
  },
  {
    id: "planned",
    name: "در صف",
    cards: [
      {
        id: "card-3",
        title: "طراحی کتابخانه‌ی اجزا",
        details: "رنگ‌ها، فاصله‌ها و دکمه‌های اصلی را یکدست کنیم.",
      },
      {
        id: "card-4",
        title: "نقشه‌ی مسیر محصول",
        details: "اولویت‌های فصل آینده را مشخص کنیم.",
      },
    ],
  },
  {
    id: "in-progress",
    name: "در حال انجام",
    cards: [
      {
        id: "card-5",
        title: "ساخت داشبورد پروژه",
        details: "نسخه‌ی اولیه‌ی تخته و ستون‌ها در دست ساخت است.",
      },
      {
        id: "card-6",
        title: "بهبود نسخه‌ی موبایل",
        details: "چیدمان کارت‌ها را برای نمایشگرهای کوچک آماده کنیم.",
      },
    ],
  },
  {
    id: "review",
    name: "بازبینی",
    cards: [
      {
        id: "card-7",
        title: "متن‌های راهنمای شروع",
        details: "لحن نوشتار را پیش از انتشار مرور کنیم.",
      },
    ],
  },
  {
    id: "done",
    name: "تکمیل‌شده",
    cards: [
      {
        id: "card-8",
        title: "جلسه‌ی آغاز پروژه",
        details: "اهداف و مسیر کلی پروژه با تیم هماهنگ شد.",
      },
    ],
  },
];

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "rename-column":
      return state.map((column) =>
        column.id === action.columnId ? { ...column, name: action.name } : column,
      );
    case "add-card":
      return state.map((column) =>
        column.id === action.columnId
          ? { ...column, cards: [...column.cards, action.card] }
          : column,
      );
    case "delete-card":
      return state.map((column) =>
        column.id === action.columnId
          ? { ...column, cards: column.cards.filter((card) => card.id !== action.cardId) }
          : column,
      );
    case "move-card": {
      const source = state.find((column) => column.id === action.fromColumnId);
      const destination = state.find((column) => column.id === action.toColumnId);
      const sourceIndex = source?.cards.findIndex((item) => item.id === action.cardId) ?? -1;
      if (!source || !destination || sourceIndex === -1) return state;

      const destinationIndex = action.toCardId
        ? destination.cards.findIndex((item) => item.id === action.toCardId)
        : destination.cards.length;
      if (destinationIndex === -1) return state;

      if (source.id === destination.id) {
        if (sourceIndex === destinationIndex) return state;

        const cards = [...source.cards];
        const [card] = cards.splice(sourceIndex, 1);
        if (!card) return state;
        cards.splice(destinationIndex, 0, card);
        return state.map((column) =>
          column.id === source.id ? { ...column, cards } : column,
        );
      }

      const card = source.cards[sourceIndex];
      if (!card) return state;

      return state.map((column) => {
        if (column.id === action.fromColumnId) {
          return {
            ...column,
            cards: column.cards.filter((item) => item.id !== action.cardId),
          };
        }
        if (column.id === action.toColumnId) {
          const cards = [...column.cards];
          cards.splice(destinationIndex, 0, card);
          return { ...column, cards };
        }
        return column;
      });
    }
  }
}
