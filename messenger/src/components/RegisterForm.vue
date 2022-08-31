<template>

<div class="register_form"> <!-- РЕГИСТРАЦИЯ -->
    <h1>Register</h1>
    <div class="field_wrapper" v-for="(inp, key) in registerForm">
        <template v-if="inp.type != 'image'">
            {{ inp.title }}
            <input
                :class="'reg_inp_'+inp.type"
                :type="inp.type"
                :name="key"
                v-model="inp.value"
                @keydown.enter="register()"
            >
        </template>
        <template v-else-if="inp.type == 'image'">
            {{ inp.title }}
            <input type="file" class="reg_inp_file" id="pp_input" accept="image/png, image/jpeg" hidden
                @change="inp.value = $event.target.files[0]"
            >
            <label for="pp_input">
                <img src="/src/assets/upload_picture.svg" alt="upload">
                Upload a picture
            </label>
        </template>
    </div>
    <div v-for="err in errors" class="auth_error">{{ err }}</div>
    <div class="register_button_wrapper">
        <button id="register" @click="register()">Register</button>
    </div>
    <button class="button_return" @click="$emit('setScreen', 'welcome')">Back</button>
</div>

</template>

<script>
import auth from '../modules/auth.js';

export default {
    data() {
        return {
            registerForm: {
                username: {
                    title: "Username",
                    type: "text",
                    value: ""
                },
                password: {
                    title: "Password",
                    type: "password",
                    value: ""
                },
                name: {
                    title: "Profile name",
                    type: "text",
                    value: ""
                },
                profilePicture: {
                    title: "Profile picture",
                    type: "image",
                    value: {a: 'a'}
                }
            },
            errors: [],
        }
    },
    emits: ['setLoading', 'setScreen'],
    methods: {
        register() {
            auth.register(this);
        }
    }
}

</script>