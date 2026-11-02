<template>
  <div class="screen">
    <div class="body">
      <div class="hero">
        <h1>纯净驾考</h1>
        <p>无广告 · 不充值 · 不分享 · 大字号</p>
      </div>
      <div class="switch">
        <button :class="{on:subject===1}" @click="$emit('update:subject',1)">科目一</button>
        <button :class="{on:subject===4}" @click="$emit('update:subject',4)">科目四</button>
      </div>
      <div class="grid">
        <button class="card" @click="$emit('nav',{view:'study',mode:'sequence'})">
          <span class="ic">▣</span><span class="lab">顺序练习</span>
          <span class="sub">逐题过 · 记要点</span>
        </button>
        <button class="card" @click="$emit('nav',{view:'exam'})">
          <span class="ic">⏱</span><span class="lab">模拟考试</span>
          <span class="sub">{{ subject===1 ? '科一 100题/45分' : '科四 50题/30分' }}</span>
        </button>
        <button class="card" @click="$emit('nav',{view:'study',mode:'wrong'})">
          <span class="ic">✎</span><span class="lab">错题本</span>
          <span class="sub">{{ wrongCount }} 道待巩固</span>
        </button>
        <button class="card" @click="$emit('nav',{view:'study',mode:'fav'})">
          <span class="ic">★</span><span class="lab">我的收藏</span>
          <span class="sub">{{ favCount }} 道</span>
        </button>
      </div>
      <p class="tip">遇到不会的题，点「问 AI 讲解」一键转发给豆包 / 千问。</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../store.js'

defineProps({ subject: Number })
defineEmits(['update:subject', 'nav'])

const wrongCount = computed(() => Object.keys(store.wrong).length)
const favCount = computed(() => Object.keys(store.fav).length)
</script>
