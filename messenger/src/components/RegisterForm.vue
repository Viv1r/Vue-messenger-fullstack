<template>

<div class="register_form"> <!-- РЕГИСТРАЦИЯ -->
    <h1>Register</h1>
    <div class="field_wrapper" v-for="(inp, key) in registerForm" :key="'field' + key">
        <template v-if="inp.type != 'image'">
            {{ inp.title }}
            <input
                :class="'inp_'+inp.type"
                :type="inp.type"
                :name="key"
                :id="'inp_' + inp.id"
                v-model="inp.value"
                @keydown.enter="register()"
            >
        </template>
        <template v-else-if="inp.type == 'image'">
            {{ inp.title }}
            <div class="inp_image_wrapper">
                <input
                    class="inp_image"
                    type="file"
                    :id="'inp_' + inp.id"
                    accept="image/png, image/jpeg"
                    hidden
                    @change="readImage($event.target.files[0], (result) => {inp.value = result})"
                >
                <label class="image_input_label" :for="'inp_' + inp.id">
                    <img src="/src/assets/upload_picture.svg" alt="upload">
                    Upload a picture
                </label>
                <div v-if="inp.value"
                    class="clear_input"
                    @click="inp.value = null"
                >×</div>
            </div>
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
                    id: "username",
                    type: "text",
                    value: ""
                },
                password: {
                    title: "Password",
                    id: "password",
                    type: "password",
                    value: ""
                },
                name: {
                    title: "Profile name",
                    id: "profile_name",
                    type: "text",
                    value: ""
                },
                profilePicture: {
                    title: "Profile picture",
                    id: "profile_picture",
                    type: "image",
                    value: null
                }
            },
            errors: [],
        }
    },
    emits: ['setLoading', 'setScreen'],
    methods: {
        register() {
            auth.register(this);
        },
        readImage(file, callback) {
            const reader = new FileReader();
            reader.onloadend = () => {
                callback(
                    reader.result.split(',').splice(1).toString()
                );
            };
            reader.readAsDataURL(file);
        }
    }
}

</script>