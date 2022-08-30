<template>

<div class="login_form"> <!-- ВХОД -->
    <h1>Log in</h1>
    <div class="field_wrapper" v-for="(inp, index) in loginForm">
        <template v-if="(typeof(inp) == 'object')">
            {{ inp.title }}
            <input
                :class="'log_inp_'+inp.type"
                :type="inp.type"
                :name="index"
                v-model="inp.value"
                @keydown.enter="login()"
            >
        </template>
    </div>
    <div v-for="err in loginErrors" class="auth_error">{{ err }}</div>
    <div class="login_button_wrapper">
        <button id="login" @click="login()">Log in</button>
    </div>
    <button class="button_return" @click="$emit('setScreen', 'welcome')">Back</button>
</div>

</template>

<script>
import auth from '../modules/auth.js';
import authForms from '../modules/auth_forms.js'

export default {
    data() {
        return {
            loginForm: {},
            loginErrors: []
        }
    },
    beforeMount() {
        this.loginForm = authForms.loadLogin();
        this.loginErrors = [];
    },
    emits: ['setLoading', 'setScreen'],
    methods: {
        login() {
            auth.login(this);
        }
    }
}

</script>