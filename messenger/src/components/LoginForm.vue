<template>

<div class="login_form"> <!-- ВХОД -->
    <h1>Log in</h1>
    <div class="field_wrapper" v-for="(inp, key) in loginForm">
        <template v-if="(typeof(inp) == 'object')">
            {{ inp.title }}
            <input
                :class="'log_inp_'+inp.type"
                :type="inp.type"
                :name="key"
                v-model="inp.value"
                @keydown.enter="login()"
            >
        </template>
    </div>
    <div v-for="err in errors" class="auth_error">{{ err }}</div>
    <div class="login_button_wrapper">
        <button id="login" @click="login()">Log in</button>
    </div>
    <button class="button_return" @click="$emit('setScreen', 'welcome')">Back</button>
</div>

</template>

<script>
import auth from '../modules/auth.js';

export default {
    data() {
        return {
            loginForm: {
                username: {
                    title: "Username",
                    type: "text",
                    value: ""
                },
                password: {
                    title: "Password",
                    type: "password",
                    value: ""
                }
            },
            errors: []
        }
    },
    emits: ['setLoading', 'setScreen'],
    methods: {
        login() {
            auth.login(this);
        }
    }
}

</script>