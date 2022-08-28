<template>
    
<div class="changetheme_button" @click="$emit('changeLightTheme', !lightTheme)">
    <div class="changetheme_sunmoon" :style="lightTheme ? 'background-color: rgb(255, 208, 0); box-shadow: 0px 0px 10px #ffea00' : ''">
        <div class="changetheme_circle_above" :style="lightTheme ? 'transform: translateX(64px); cursor: default; background-color: white' : ''"></div>
    </div>
</div>
    
</template>

<script>
export default {
    props: {
        lightTheme: { type: Boolean, default: false }
    },
    emits: [ 'changeLightTheme' ]
}
</script>