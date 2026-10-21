/*
 * Picks the data backend once at startup:
 *   - "supabase":     real Auth, Postgres and Storage (the default)
 *   - "mock":         localStorage demo data, only in dev with VITE_USE_MOCK_DATA=true
 *   - "unconfigured": Supabase env vars are missing or invalid; the app shows setup help
 */
import { configError, supabase, USE_MOCK_DATA } from '../lib/supabase.js'
import { mockAuthService } from './mock/mockAuthService.js'
import { mockOrderService } from './mock/mockOrderService.js'
import { mockProductService } from './mock/mockProductService.js'
import { mockWishlistService } from './mock/mockWishlistService.js'
import { authService } from './supabase/authService.js'
import { orderService } from './supabase/orderService.js'
import { productService } from './supabase/productService.js'
import { wishlistService } from './supabase/wishlistService.js'

export const backendMode = USE_MOCK_DATA ? 'mock' : supabase ? 'supabase' : 'unconfigured'
export { configError }

export const backend =
  backendMode === 'mock'
    ? {
        auth: mockAuthService,
        products: mockProductService,
        wishlist: mockWishlistService,
        orders: mockOrderService,
        capabilities: { imageUpload: false, guestWishlist: true, passwordReset: false },
      }
    : {
        auth: authService,
        products: productService,
        wishlist: wishlistService,
        orders: orderService,
        capabilities: { imageUpload: true, guestWishlist: false, passwordReset: true },
      }
