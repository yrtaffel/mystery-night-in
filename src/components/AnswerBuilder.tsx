"use client";

import { useRef, useState } from "react";
import {
  closestCenter, DndContext, DragOverlay, KeyboardSensor, pointerWithin, PointerSensor, useDroppable, useSensor,
  useSensors, type CollisionDetection, type DragEndEvent, type DragOverEvent, type DragStartEvent, type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MAX_LINES } from "@/lib/magnets";

export const tilt = (i: number) => ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0"][i % 5];
export const tileClass = "rounded-[3px] bg-white px-2 py-1 text-[15px] leading-tight shadow-[0_1px_3px_rgba(0,0,0,0.25)]";

const tileId = (i: number) => `t${i}`;
const lineId = (n: number) => `line-${n}`;

function SortTile({ index, word, onTap }: { index: number; word: string; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tileId(index) });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={onTap}
      aria-label={`${word}. Tap to remove, or drag to move.`}
      style={{ transform: CSS.Translate.toString(transform), transition, touchAction: "none" }}
      className={`${tileClass} ${tilt(index)} cursor-grab ${isDragging ? "opacity-30" : ""}`}
    >
      {word}
    </button>
  );
}

function Line({
  n, items, tiles, active, onSelect, onTap,
}: {
  n: number; items: number[]; tiles: string[]; active: boolean;
  onSelect: () => void; onTap: (index: number) => void;
}) {
  const { setNodeRef } = useDroppable({ id: lineId(n) });
  return (
    <SortableContext items={items.map(tileId)} strategy={rectSortingStrategy}>
      <div
        ref={setNodeRef}
        onClick={onSelect}
        aria-label={`Line ${n + 1}${active ? " (words go here)" : ""}`}
        className={`flex min-h-12 flex-wrap items-center gap-1.5 border-b border-dashed border-line px-2 py-2 ${
          active ? "rounded-lg bg-white/80 ring-2 ring-lavender" : ""
        }`}
      >
        {items.length === 0 && (
          <span className="text-xs text-ink-soft">
            {active ? (n === 0 ? "Tap words below to start" : "Next words go on this line") : `Line ${n + 1}`}
          </span>
        )}
        {items.map((i) => (
          <SortTile key={i} index={i} word={tiles[i]} onTap={() => onTap(i)} />
        ))}
      </div>
    </SortableContext>
  );
}

type Props = {
  tiles: string[];
  lines: number[][];
  setLines: (fn: (lines: number[][]) => number[][]) => void;
  activeLine: number;
  setActiveLine: (n: number) => void;
};

/**
 * The answer area: up to 4 lines of tiles. Tap a tile to send it back to the pile;
 * drag to move it within a line or onto another line.
 */
export default function AnswerBuilder({ tiles, lines, setLines, activeLine, setActiveLine }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [dragging, setDragging] = useState<number | null>(null);
  const lastDragEnd = useRef(0);

  const lineOf = (id: UniqueIdentifier, from = lines) => {
    const s = String(id);
    if (s.startsWith("line-")) return Number(s.slice(5));
    const i = Number(s.slice(1));
    return from.findIndex((l) => l.includes(i));
  };

  // Aim at the word under the finger; if it's over a line's empty space, aim at the
  // nearest word in that line (or the line itself when it's empty).
  const collision: CollisionDetection = (args) => {
    const within = pointerWithin(args);
    const tileHit = within.find((c) => String(c.id).startsWith("t"));
    if (tileHit) return [tileHit];
    const line = within.find((c) => String(c.id).startsWith("line-"));
    if (line) {
      const ids = new Set((lines[Number(String(line.id).slice(5))] ?? []).map(tileId));
      const inLine = args.droppableContainers.filter((c) => ids.has(String(c.id)));
      return inLine.length ? closestCenter({ ...args, droppableContainers: inLine }) : [line];
    }
    return closestCenter(args);
  };

  function onDragStart(e: DragStartEvent) {
    setDragging(Number(String(e.active.id).slice(1)));
  }

  // Moving onto a different line: hand the tile over right away, so it previews there.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setLines((cur) => {
      const from = lineOf(active.id, cur);
      const to = lineOf(over.id, cur);
      if (from < 0 || to < 0 || from === to) return cur;
      const tile = Number(String(active.id).slice(1));
      const next = cur.map((l) => [...l]);
      next[from] = next[from].filter((x) => x !== tile);
      const overStr = String(over.id);
      const at = overStr.startsWith("line-") ? next[to].length : next[to].indexOf(Number(overStr.slice(1)));
      next[to].splice(at < 0 ? next[to].length : at, 0, tile);
      return next;
    });
  }

  // Dropping within a line: reorder.
  function onDragEnd({ active, over }: DragEndEvent) {
    setDragging(null);
    lastDragEnd.current = Date.now();
    if (!over) return;
    setLines((cur) => {
      const from = lineOf(active.id, cur);
      const to = lineOf(over.id, cur);
      if (from < 0 || from !== to) return cur;
      const tile = Number(String(active.id).slice(1));
      const overStr = String(over.id);
      const oldIndex = cur[from].indexOf(tile);
      const newIndex = overStr.startsWith("line-") ? cur[from].length - 1 : cur[from].indexOf(Number(overStr.slice(1)));
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return cur;
      const next = cur.map((l) => [...l]);
      next[from] = arrayMove(next[from], oldIndex, newIndex);
      return next;
    });
  }

  const remove = (i: number) => {
    if (Date.now() - lastDragEnd.current < 250) return; // that was the end of a drag, not a tap
    setLines((cur) => cur.map((l) => l.filter((x) => x !== i)));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="mt-4 rounded-2xl border-2 border-dashed border-line bg-white/40 p-2" aria-label="Your answer">
        {Array.from({ length: MAX_LINES }, (_, n) => (
          <Line key={n} n={n} items={lines[n] ?? []} tiles={tiles} active={n === activeLine}
            onSelect={() => setActiveLine(n)} onTap={remove} />
        ))}
      </div>
      <DragOverlay>
        {dragging !== null ? <span className={`${tileClass} inline-block rotate-3 shadow-lg`}>{tiles[dragging]}</span> : null}
      </DragOverlay>
    </DndContext>
  );
}
