<template>
    
<div class="changetheme_button" @click="changeTheme()">
    <div
        class="changetheme_sunmoon"
        :style="$store.state.lightTheme
            ? 'background-color: #ffe800; box-shadow: 0px 0px 12px #ffd000'
            : ''"
    >
        <div
            class="changetheme_circle_above"
            :style="$store.state.lightTheme
                ? 'transform: translateX(64px); cursor: default; background-color: white'
                : ''"
        />
    </div>
</div>
    
</template>

<script>
export default {
    methods: {
        changeTheme() {
            localStorage.setItem(
                'light-theme',
                !this.$store.state.lightTheme
            );
            this.$store.commit(
                'setLightTheme',
                !this.$store.state.lightTheme
            );
        }
    }
}
</script>