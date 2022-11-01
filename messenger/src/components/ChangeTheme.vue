<template>
    
<div class="changetheme_button" @click="changeTheme()">
    <div
        class="changetheme_sunmoon"
        :style="getLightTheme
            ? 'background-color: #ffe800; box-shadow: 0px 0px 12px #ffd000'
            : ''"
    >
        <div
            class="changetheme_circle_above"
            :style="getLightTheme
                ? 'transform: translateX(64px); cursor: default; background-color: white'
                : ''"
        />
    </div>
</div>
    
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
    computed: {
        ...mapGetters(['getLightTheme'])
    },
    methods: {
        ...mapActions(['setLightTheme']),
        changeTheme() {
            localStorage.setItem(
                'light-theme',
                !this.getLightTheme
            );
            this.setLightTheme(!this.getLightTheme);
        }
    }
}
</script>