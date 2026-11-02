<template>
  <div class="app">
    <div v-if="!loaded" class="loading">加载题库…</div>
    <template v-else>
      <Home v-if="view==='home'" :subject="subject" @update:subject="subject=$event" @nav="go" />
      <Study v-else-if="view==='study'" :mode="studyMode" :subject="subject" :bank="bank" @back="view='home'" @home="view='home'" />
      <Exam v-else-if="view==='exam'" :subject="subject" :bank="bank" @back="view='home'" @home="view='home'" />
    </template>
    <div class="toast" :class="{show:toastShow}">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, provide } from 'vue'
import Home from './components/Home.vue'
import Study from './components/Study.vue'
import Exam from './components/Exam.vue'
import { store } from './store.js'

const bank = reactive({ '1': [], '4': [] })
const subject = ref(1)
const view = ref('home')
const studyMode = ref('sequence')
const loaded = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

function toast(m){
  toastMsg.value = m
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 1800)
}
provide('toast', toast)

function go(target){
  if(target.view === 'study'){ studyMode.value = target.mode; view.value = 'study' }
  else if(target.view === 'exam'){ view.value = 'exam' }
}

function applyFont(){
  document.documentElement.style.setProperty('--fs', store.fs + 'px')
  document.documentElement.style.setProperty('--fs-title', (store.fs + 4) + 'px')
}
watch(() => store.fs, applyFont)

onMounted(async () => {
  applyFont()
  try{
    const res = await fetch(import.meta.env.BASE_URL + 'bank.json')
    const data = await res.json()
    bank['1'] = data['1'] || []
    bank['4'] = data['4'] || []
  }catch(e){
    toast('题库加载失败')
  }
  loaded.value = true
})
</script>
