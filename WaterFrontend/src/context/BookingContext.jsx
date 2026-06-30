import React, { createContext, useContext, useState } from "react";

const BookingContext = createContext();

export const useBooking = () => {
  return useContext(BookingContext);
};

export const BookingProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    prefDate: "",
    prefTime: "Morning (9 AM - 12 PM)",
    address: "",
    specialNotes: "",
    branchId: ""
  });

  const addItem = (item) => {
    setCartItems((prev) => {
      // Check if item already exists based on name and type
      const existing = prev.find((i) => i.name === item.name && i.type === item.type);
      if (existing) {
        // Just increase quantity if it's a product, maybe services don't need quantity but let's allow it
        return prev.map((i) =>
          i.name === item.name && i.type === item.type
            ? { ...i, quantity: (i.quantity || 1) + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, id: Date.now().toString() + Math.random().toString() }];
    });
    // Automatically open cart when item is added
    setIsCartOpen(true);
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const updateForm = (field, value) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <BookingContext.Provider
      value={{
        cartItems,
        isCartOpen,
        bookingForm,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        updateForm,
        setIsCartOpen
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
