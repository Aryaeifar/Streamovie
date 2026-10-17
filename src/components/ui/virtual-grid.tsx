"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

const GAP = 16;

function columnsForWidth(width: number) {
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

type VirtualGridProps<T> = {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Estimated height of one row, given the measured column width. */
  estimateRowHeight: (columnWidth: number) => number;
  /** Called as the user scrolls near the last rendered row (for infinite loading). */
  onEndReached?: () => void;
  /** How many rows before the end to trigger `onEndReached`. */
  endThreshold?: number;
  overscan?: number;
};

/**
 * Window-scrolled, responsive grid that only mounts the rows currently in view.
 * Rows are positioned absolutely and cheap to add/remove, keeping the DOM small
 * when thousands of items are loaded.
 */
export function VirtualGrid<T>({
  items,
  getKey,
  renderItem,
  estimateRowHeight,
  onEndReached,
  endThreshold = 6,
  overscan = 6,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      setWidth(element.clientWidth);
      setScrollMargin(element.offsetTop);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const columns = columnsForWidth(width || 1280);
  const columnWidth = width ? (width - GAP * (columns - 1)) / columns : 0;
  const rowHeight = columnWidth ? estimateRowHeight(columnWidth) : 0;

  const rows = useMemo(() => {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += columns) {
      chunks.push(items.slice(index, index + columns));
    }
    return chunks;
  }, [items, columns]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => (rowHeight || 440) + GAP,
    overscan,
    scrollMargin,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const lastVisibleIndex = virtualRows.length ? virtualRows[virtualRows.length - 1].index : -1;

  useEffect(() => {
    rowVirtualizer.measure();
  }, [columns, width, rowVirtualizer]);

  useEffect(() => {
    if (!onEndReached) return;
    if (lastVisibleIndex >= 0 && lastVisibleIndex >= rows.length - 1 - endThreshold) {
      onEndReached();
    }
  }, [lastVisibleIndex, rows.length, onEndReached, endThreshold]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: rowVirtualizer.getTotalSize() }}
    >
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="absolute inset-x-0 top-0"
            style={{ transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)` }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                columnGap: GAP,
                paddingBottom: GAP,
              }}
            >
              {row.map((item, columnIndex) => {
                const index = virtualRow.index * columns + columnIndex;
                return <div key={getKey(item, index)}>{renderItem(item, index)}</div>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
