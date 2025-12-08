import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { productService } from "../../services/productService";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch products"
      );
    }
  }
);

export const fetchMoreProducts = createAsyncThunk(
  "products/fetchMoreProducts",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts({
        ...filters,
        page: filters.page || 2,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch more products"
      );
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await productService.getProductById(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch product"
      );
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    featured: [],
    currentProduct: null,
    loading: false,
    loadingMore: false,
    error: null,
    filters: {
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    pagination: {
      page: 1,
      totalPages: 1,
      total: 0,
      hasMore: true,
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset page when filters change
      state.items = []; // Clear items when filters change
      state.pagination.hasMore = true;
    },
    clearFilters: (state) => {
      state.filters = {
        category: "",
        brand: "",
        minPrice: "",
        maxPrice: "",
        search: "",
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      state.pagination.page = 1;
      state.items = [];
      state.pagination.hasMore = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetProducts: (state) => {
      state.items = [];
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.pagination = {
          ...action.payload.pagination,
          hasMore:
            action.payload.pagination.page <
            action.payload.pagination.totalPages,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch More Products
      .addCase(fetchMoreProducts.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(fetchMoreProducts.fulfilled, (state, action) => {
        state.loadingMore = false;
        state.items = [...state.items, ...action.payload.products];
        state.pagination = {
          ...action.payload.pagination,
          hasMore:
            action.payload.pagination.page <
            action.payload.pagination.totalPages,
        };
      })
      .addCase(fetchMoreProducts.rejected, (state, action) => {
        state.loadingMore = false;
        state.error = action.payload;
      })
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearError, resetProducts } =
  productSlice.actions;
export default productSlice.reducer;
