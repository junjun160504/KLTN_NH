import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
    name: 'cart',
    initialState: { order: null },
    reducers: {
        addToCart: (state, action) => {
            state.order = action.payload;
        },
        resetCart: (state) => {
            state.count = 0;
        },
    },
});

export const { addToCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
