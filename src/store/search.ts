import { create } from 'zustand'

export type DateRange = {
  checkIn: string | null // 'YYYY-MM-DD'
  checkOut: string | null
}

export type SearchFilters = {
  city: string
  adcode?: string
  keyword: string
  dateRange: DateRange
  tags: string[] // 多选
}

type SearchState = {
  filters: SearchFilters

  setCity: (payload: { city: string; adcode?: string }) => void
  setKeyword: (keyword: string) => void
  toggleTag: (tag: string) => void
  clearTags: () => void
  setDateRange: (range: DateRange) => void
  reset: () => void
}

const defaultFilters: SearchFilters = {
  city: '',
  adcode: undefined,
  keyword: '',
  dateRange: { checkIn: null, checkOut: null },
  tags: [],
}

export const useSearchStore = create<SearchState>((set, get) => ({
  filters: defaultFilters,

  setCity: ({ city, adcode }) =>
    set((s) => ({
      filters: { ...s.filters, city, adcode },
    })),

  setKeyword: (keyword) =>
    set((s) => ({
      filters: { ...s.filters, keyword },
    })),

  toggleTag: (tag) =>
    set((s) => {
      const exists = s.filters.tags.includes(tag)
      const tags = exists ? s.filters.tags.filter((t) => t !== tag) : [...s.filters.tags, tag]
      return { filters: { ...s.filters, tags } }
    }),

  clearTags: () =>
    set((s) => ({
      filters: { ...s.filters, tags: [] },
    })),

  setDateRange: (range) =>
    set((s) => ({
      filters: { ...s.filters, dateRange: range },
    })),

  reset: () => set({ filters: defaultFilters }),
}))
