"use client";
import {
  createContext, useContext, useReducer, useCallback,
  type ReactNode,
} from "react";
import { type MenuItem } from "@/lib/menu-data";

// ── Types ────────────────────────────────────────────────────────────────────
export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export type OrderMode = "delivery" | "takeaway";

interface CartState {
  items: CartItem[];
  mode: OrderMode;
  deliveryAddress: string;
  discountCode: string;
  discountAmount: number;     // £ value already resolved
  discountPercent: number;    // % if applicable, else 0
}

type CartAction =
  | { type: "ADD";       item: MenuItem }
  | { type: "REMOVE";    id: string }
  | { type: "INCREMENT"; id: string }
  | { type: "DECREMENT"; id: string }
  | { type: "SET_MODE";  mode: OrderMode }
  | { type: "SET_ADDRESS"; address: string }
  | { type: "SET_DISCOUNT"; code: string; amount: number; percent: number }
  | { type: "CLEAR_DISCOUNT" }
  | { type: "CLEAR" };

interface CartContextValue extends CartState {
  add:           (item: MenuItem) => void;
  remove:        (id: string) => void;
  increment:     (id: string) => void;
  decrement:     (id: string) => void;
  setMode:       (mode: OrderMode) => void;
  setAddress:    (address: string) => void;
  setDiscount:   (code: string, amount: number, percent: number) => void;
  clearDiscount: () => void;
  clear:         () => void;
  subtotal:      number;
  deliveryFee:   number;
  discount:      number;
  total:         number;
  itemCount:     number;
}

// ── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.item.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.item.id === action.item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { item: action.item, quantity: 1 }] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.item.id !== action.id) };
    case "INCREMENT":
      return {
        ...state,
        items: state.items.map((i) =>
          i.item.id === action.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    case "DECREMENT":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.item.id === action.id ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_ADDRESS":
      return { ...state, deliveryAddress: action.address };
    case "SET_DISCOUNT":
      return {
        ...state,
        discountCode: action.code,
        discountAmount: action.amount,
        discountPercent: action.percent,
      };
    case "CLEAR_DISCOUNT":
      return { ...state, discountCode: "", discountAmount: 0, discountPercent: 0 };
    case "CLEAR":
      return { ...state, items: [], discountCode: "", discountAmount: 0, discountPercent: 0 };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | null>(null);

const DELIVERY_FEE = 2.99;
const FREE_DELIVERY_THRESHOLD = 25;

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    mode: "delivery",
    deliveryAddress: "",
    discountCode: "",
    discountAmount: 0,
    discountPercent: 0,
  });

  const subtotal = state.items.reduce(
    (sum, ci) => sum + ci.item.price * ci.quantity,
    0
  );
  const deliveryFee =
    state.mode === "delivery" && subtotal < FREE_DELIVERY_THRESHOLD
      ? DELIVERY_FEE
      : 0;
  const discount = state.discountPercent > 0
    ? parseFloat(((subtotal * state.discountPercent) / 100).toFixed(2))
    : state.discountAmount;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const itemCount = state.items.reduce((n, ci) => n + ci.quantity, 0);

  const add           = useCallback((item: MenuItem) => dispatch({ type: "ADD", item }), []);
  const remove        = useCallback((id: string)     => dispatch({ type: "REMOVE", id }), []);
  const increment     = useCallback((id: string)     => dispatch({ type: "INCREMENT", id }), []);
  const decrement     = useCallback((id: string)     => dispatch({ type: "DECREMENT", id }), []);
  const setMode       = useCallback((mode: OrderMode) => dispatch({ type: "SET_MODE", mode }), []);
  const setAddress    = useCallback((address: string) => dispatch({ type: "SET_ADDRESS", address }), []);
  const setDiscount   = useCallback((code: string, amount: number, percent: number) =>
    dispatch({ type: "SET_DISCOUNT", code, amount, percent }), []);
  const clearDiscount = useCallback(() => dispatch({ type: "CLEAR_DISCOUNT" }), []);
  const clear         = useCallback(() => dispatch({ type: "CLEAR" }), []);

  return (
    <CartContext.Provider value={{
      ...state,
      add, remove, increment, decrement,
      setMode, setAddress, setDiscount, clearDiscount, clear,
      subtotal, deliveryFee, discount, total, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
