import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
    name: 'cart',
    initialState: { count: 0 },
    reducers: {
        addToCart: (state) => {
            state.count += 1;
        },
        resetCart: (state) => {
            state.count = 0;
        },
    },
});

export const { addToCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
