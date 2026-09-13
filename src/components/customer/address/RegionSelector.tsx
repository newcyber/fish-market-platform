"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ChevronDown, Loader2 } from "lucide-react";

export interface RegionOption {
  code: string;
  name: string;
}

interface RegionSelectorProps {
  id: string;
  label: string;
  value: RegionOption | null;
  options: RegionOption[];
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  placeholder?: string;
  onChange: (
    option: RegionOption | null,
  ) => void;
}

export default function RegionSelector({
  id,
  label,
  value,
  options,
  disabled = false,
  loading = false,
  required = false,
  placeholder = "Pilih wilayah",
  onChange,
}: RegionSelectorProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const [open, setOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  const filteredOptions =
    useMemo(() => {
      const normalizedQuery =
        query.trim().toLowerCase();

      if (!normalizedQuery) {
        return options;
      }

      return options.filter((option) =>
        option.name
          .toLowerCase()
          .includes(normalizedQuery),
      );
    }, [options, query]);

  function handleInputChange(
    nextValue: string,
  ) {
    setQuery(nextValue);
    setOpen(true);

    if (
      value &&
      nextValue !== value.name
    ) {
      onChange(null);
    }
  }

  function handleSelect(
    option: RegionOption,
  ) {
    onChange(option);
    setQuery(option.name);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    onChange(null);
    setOpen(false);
  }

  const isDisabled =
    disabled || loading;

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          required={required}
          disabled={isDisabled}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            if (!isDisabled) {
              setOpen(true);
            }
          }}
          onChange={(event) =>
            handleInputChange(
              event.target.value,
            )
          }
          className="w-full rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {open && !isDisabled && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-background shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              {query.trim()
                ? "Wilayah tidak ditemukan."
                : "Tidak ada data wilayah."}
            </div>
          ) : (
            filteredOptions.map(
              (option) => (
                <button
                  key={option.code}
                  type="button"
                  onMouseDown={(event) =>
                    event.preventDefault()
                  }
                  onClick={() =>
                    handleSelect(option)
                  }
                  className={`block w-full px-3 py-2.5 text-left text-sm transition hover:bg-muted ${
                    value?.code ===
                    option.code
                      ? "bg-muted font-medium"
                      : ""
                  }`}
                >
                  {option.name}
                </button>
              ),
            )
          )}

          {value && (
            <button
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={handleClear}
              className="sticky bottom-0 w-full border-t bg-background px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
            >
              Hapus pilihan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
