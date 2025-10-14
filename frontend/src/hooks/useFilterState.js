import { useState, useEffect } from "react";

/**
 * Custom hook để lưu trạng thái filter vào localStorage
 * @param {string} key - Key để lưu trong localStorage
 * @param {any} defaultValue - Giá trị mặc định
 * @returns {[any, Function]} - [value, setValue]
 */
const useFilterState = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved !== null ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, value]);

    return [value, setValue];
};

export default useFilterState;
