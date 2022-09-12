<template>
    
<div class="changetheme_button" @click="changeTheme()">
    <div class="changetheme_sunmoon" :style="$store.state.lightTheme ? 'background-color: rgb(255, 208, 0); box-shadow: 0px 0px 10px #ffea00' : ''">
        <div class="changetheme_circle_above" :style="$store.state.lightTheme ? 'transform: translateX(64px); cursor: default; background-color: white' : ''"></div>
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