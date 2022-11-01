import { createStore } from 'vuex';

export default createStore({
    state: {
        lightTheme: false
    },
    getters: {
        getLightTheme(store) {
            return store.lightTheme;
        }
    },
    mutations: {
        setLightTheme(state, val) {
            if (val === true || val === false)
                state.lightTheme = val;
        }
    },
    actions: {
        setLightTheme(state, val) {
            state.commit('setLightTheme', val);
        }
    }
})