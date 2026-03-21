<template>
  <Picker
    :data="emojiIndex"
    set="twitter"
    :native="true"
    :showPreview="false"
    :showSkinTones="false"
    :emojiSize="24"
    @select="onSelect"
  />
</template>

<script setup>
import { ref } from 'vue'
import data from 'emoji-mart-vue-fast/data/all.json'
import 'emoji-mart-vue-fast/css/emoji-mart.css'
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'

const emit = defineEmits(['select'])

const emojiIndex = ref(new EmojiIndex(data))

function onSelect(emoji) {
  emit('select', emoji.native)
}
</script>

<style>
.emoji-mart {
  border: none;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-lg);
}
</style>