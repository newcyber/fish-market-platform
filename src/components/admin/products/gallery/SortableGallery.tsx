"use client";

import {
  reorderProductImagesAction,
} from "@/actions/product/reorder-product-images";
import ProductImageCard from "./ProductImageCard";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import type {
  ProductImage,
} from "@/types/product";

import SortableItem from "./SortableItem";

interface SortableGalleryProps {
  productId: string;

  images: ProductImage[];
}

export default function SortableGallery({
  productId,
  images,
}: SortableGalleryProps) {
  const [items, setItems] =
    useState(images);

  const [, startTransition] =
    useTransition();

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance: 5,
          },
        }
      ),

      useSensor(
        KeyboardSensor,
        {
          coordinateGetter:
            sortableKeyboardCoordinates,
        }
      )
    );

  const ids = useMemo(
    () =>
      items.map(
        (image) => image.id
      ),
    [items]
  );

  async function handleDragEnd(
    event: DragEndEvent
  ) {
    const {
      active,
      over,
    } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex =
      items.findIndex(
        (image) =>
          image.id === active.id
      );

    const newIndex =
      items.findIndex(
        (image) =>
          image.id === over.id
      );

    const previousItems =
  items;

const reordered =
  arrayMove(
    items,
    oldIndex,
    newIndex
  );

setItems(reordered);

startTransition(() => {
  void (async () => {
    try {
      await reorderProductImagesAction(
        productId,
        reordered.map(
          (image) => image.id
        )
      );
    } catch {
      setItems(previousItems);
    }
  })();
});

  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={
        closestCenter
      }
      onDragEnd={
        handleDragEnd
      }
    >
      <SortableContext
        items={ids}
        strategy={
          rectSortingStrategy
        }
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">

          {items.map((image) => (

            <SortableItem
    key={image.id}
    id={image.id}
>
    <ProductImageCard
        productId={productId}
        image={image}
    />
</SortableItem>

          ))}

        </div>
      </SortableContext>
    </DndContext>
  );
}