"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Grip,
  LayoutGrid,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useId, useMemo, useReducer, useState, type FormEvent } from "react";
import {
  boardReducer,
  initialBoard,
  type BoardCard,
  type BoardColumn,
} from "@/lib/board";

function CardItem({
  card,
  columnId,
  onDelete,
}: {
  card: BoardCard;
  columnId: string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      data: { columnId },
    });

  return (
    <article
      ref={setNodeRef}
      className={`task-card${isDragging ? " task-card--dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      aria-label={card.title}
    >
      <div className="task-card__topline">
        <button
          ref={setActivatorNodeRef}
          className="icon-button drag-handle"
          type="button"
          aria-label={`جابجایی ${card.title}`}
          {...attributes}
          {...listeners}
        >
          <Grip size={17} strokeWidth={2} />
        </button>
        <button
          className="icon-button delete-button"
          type="button"
          aria-label={`حذف ${card.title}`}
          onClick={onDelete}
        >
          <Trash2 size={16} strokeWidth={1.8} />
        </button>
      </div>
      <h3 className="task-card__title">{card.title}</h3>
      <p className="task-card__details">{card.details}</p>
    </article>
  );
}

function AddCardForm({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string, details: string) => void;
  onCancel: () => void;
}) {
  const formId = useId();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onAdd(trimmedTitle, details.trim());
  }

  return (
    <form className="add-card-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={`${formId}-title`}>
        عنوان کارت
      </label>
      <input
        id={`${formId}-title`}
        autoFocus
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="عنوان کارت"
        maxLength={100}
      />
      <label className="sr-only" htmlFor={`${formId}-details`}>
        جزئیات کارت
      </label>
      <textarea
        id={`${formId}-details`}
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="جزئیات کوتاه (اختیاری)"
        rows={3}
        maxLength={300}
      />
      <div className="add-card-form__actions">
        <button className="button button--primary button--small" type="submit">
          <Check size={15} />
          افزودن کارت
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="انصراف"
          onClick={onCancel}
        >
          <X size={17} />
        </button>
      </div>
    </form>
  );
}

function BoardColumnView({
  column,
  onRename,
  onAddCard,
  onDeleteCard,
}: {
  column: BoardColumn;
  onRename: (name: string) => void;
  onAddCard: (title: string, details: string) => void;
  onDeleteCard: (cardId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(column.name);
  const [showForm, setShowForm] = useState(false);
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${column.id}`,
    data: { columnId: column.id },
  });

  function saveName() {
    const nextName = draftName.trim();
    if (nextName) onRename(nextName);
    else setDraftName(column.name);
    setEditing(false);
  }

  return (
    <section
      ref={setNodeRef}
      className={`board-column board-column--${column.id}${isOver ? " board-column--over" : ""}`}
      aria-label={column.name}
    >
      <header className="column-header">
        <div className="column-header__name">
          <span className={`column-dot column-dot--${column.id}`} />
          {editing ? (
            <input
              className="column-name-input"
              aria-label={`تغییر نام ${column.name}`}
              autoFocus
              value={draftName}
              maxLength={40}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={saveName}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveName();
                if (event.key === "Escape") {
                  setDraftName(column.name);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button
              className="column-name-button"
              type="button"
              onClick={() => {
                setDraftName(column.name);
                setEditing(true);
              }}
              aria-label={`تغییر نام ${column.name}`}
            >
              {column.name}
            </button>
          )}
          <span className="column-count">{column.cards.length}</span>
        </div>
        <button
          className="icon-button column-add-button"
          type="button"
          aria-label={`افزودن کارت به ${column.name}`}
          onClick={() => setShowForm((visible) => !visible)}
        >
          <Plus size={18} />
        </button>
      </header>

      <div className="column-cards">
        {column.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            columnId={column.id}
            onDelete={() => onDeleteCard(card.id)}
          />
        ))}
        {showForm ? (
          <AddCardForm
            onAdd={(title, details) => {
              onAddCard(title, details);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : null}
      </div>

      {!showForm ? (
        <button
          className="add-card-link"
          type="button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          افزودن کارت
        </button>
      ) : null}
    </section>
  );
}

export default function Board() {
  const [columns, dispatch] = useReducer(boardReducer, initialBoard);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const cardCount = useMemo(
    () => columns.reduce((total, column) => total + column.cards.length, 0),
    [columns],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const fromColumnId = active.data.current?.columnId;
    const toColumnId = over.data.current?.columnId;
    if (typeof fromColumnId !== "string" || typeof toColumnId !== "string") return;

    dispatch({
      type: "move-card",
      cardId: String(active.id),
      fromColumnId,
      toColumnId,
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="روال">
          <span className="brand-mark">
            <LayoutGrid size={18} strokeWidth={2.2} />
          </span>
          <span>روال</span>
        </div>
        <div className="topbar-divider" />
        <div className="workspace-label">
          <span className="workspace-label__caption">فضای کاری</span>
          <span className="workspace-label__name">استودیو آبان</span>
        </div>
        <div className="topbar-spacer" />
        <span className="topbar-note">
          <span className="status-dot" />
          آماده‌ی برنامه‌ریزی
        </span>
      </header>

      <section className="page-content">
        <div className="page-heading">
          <div className="page-heading__copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              تخته‌ی پروژه
            </div>
            <h1>راه‌اندازی محصول جدید</h1>
            <p>ایده‌ها را به کارهای انجام‌شده تبدیل کنید؛ قدم‌به‌قدم و کنار هم.</p>
          </div>
          <div className="board-summary" aria-label={`${cardCount} کارت در تخته`}>
            <span className="board-summary__icon">
              <Sparkles size={17} />
            </span>
            <span>
              <strong>{cardCount}</strong>
              <span className="board-summary__label">کارت در جریان</span>
            </span>
          </div>
        </div>

        <div className="board-toolbar">
          <div className="board-toolbar__title">
            <h2>نمای کلی کارها</h2>
            <span className="board-toolbar__hint">برای تغییر نام، روی عنوان ستون بزنید</span>
          </div>
          <span className="board-count">{columns.length} ستون</span>
        </div>

        <DndContext id="project-board-dnd" sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="board-scroll">
            <div className="board">
              {columns.map((column) => (
                <BoardColumnView
                  key={column.id}
                  column={column}
                  onRename={(name) =>
                    dispatch({ type: "rename-column", columnId: column.id, name })
                  }
                  onAddCard={(title, details) =>
                    dispatch({
                      type: "add-card",
                      columnId: column.id,
                      card: { id: crypto.randomUUID(), title, details },
                    })
                  }
                  onDeleteCard={(cardId) =>
                    dispatch({ type: "delete-card", columnId: column.id, cardId })
                  }
                />
              ))}
            </div>
          </div>
        </DndContext>

        <footer className="page-footer">
          <span>تخته‌ی شما، مسیر روشن‌تر کارها</span>
          <span>برای جابه‌جایی، کارت را بکشید و در ستون دلخواه رها کنید</span>
        </footer>
      </section>
    </main>
  );
}
