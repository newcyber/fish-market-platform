"use client";

import type { CSSProperties, ReactNode } from "react";

import {
  useSortable,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;

  children: ReactNode;
}

export default function SortableItem({
  id,
  children,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style: CSSProperties = {
    transform:
      CSS.Transform.toString(
        transform
      ),

    transition,

    opacity: isDragging
      ? 0.5
      : 1,

    zIndex: isDragging
      ? 100
      : "auto",

    cursor: "grab",

    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}