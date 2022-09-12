import { createStore } from 'vuex';

export default createStore({
    state: {
        lightTheme: false
    },
    mutations: {
        setLightTheme(state, val) {
            if (val === true || val === false)
                state.lightTheme = val;
        }
    }
})