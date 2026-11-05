<template>
  <div class="app">
    <div v-if="!loaded" class="loading">加载题库…</div>
    <template v-else>
      <Home v-if="current.view==='home'" :subject="subject" @update:subject="subject=$event" @nav="go" />
      <Study v-else-if="current.view==='study'" :mode="studyMode" :subject="subject" :bank="bank" @back="pop" @home="goHome" />
      <Exam v-else-if="current.view==='exam'" :subject="subject" :bank="bank" @back="pop" @home="goHome" />
    </template>
    <div class="toast" :class="{show:toastShow}">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, provide } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import Home from './components/Home.vue'
import Study from './components/Study.vue'
import Exam from './components/Exam.vue'
import { store } from './store.js'

const bank = reactive({ '1': [], '4': [] })
const subject = ref(store.subject || 1)
const studyMode = ref('sequence')
const loaded = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

// 导航栈：首页为栈底，子页面入栈；返回键 / 边缘左滑走页内返回
const history = ref([{ view: 'home' }])
const current = computed(() => history.value[history.value.length - 1])

// 记住上次所在页面（首页 / 练习 / 模拟考试）与科目，重开直接回到该页
watch([current, studyMode], () => {
  const view = current.value.view
  store.lastView = { view, mode: view === 'study' ? studyMode.value : 'sequence' }
})
watch(subject, v => { store.subject = v })

function toast(m){
  toastMsg.value = m
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 1800)
}
provide('toast', toast)

function go(target){
  if(target.view === 'study'){ studyMode.value = target.mode; history.value = [...history.value, { view: 'study' }] }
  else if(target.view === 'exam'){ history.value = [...history.value, { view: 'exam' }] }
}
function pop(){
  // 仍有上层页面 → 返回上一页；已在首页 → 不处理（避免误触退出 App）
  if(history.value.length > 1) history.value = history.value.slice(0, -1)
}
function goHome(){ history.value = [{ view: 'home' }] }

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

  // 恢复上次的学习页面与科目（题库已加载完，直接渲染对应页面）
  const lv = store.lastView
  if(lv && lv.view === 'study'){ studyMode.value = lv.mode || 'sequence'; history.value = [{ view: 'home' }, { view: 'study' }] }
  else if(lv && lv.view === 'exam'){ history.value = [{ view: 'home' }, { view: 'exam' }] }

  // 原生 APP：接管系统返回键与边缘左滑手势，走页内导航
  if(Capacitor.isNativePlatform()){
    App.addListener('backButton', () => { pop() })
  }
})
</script>
