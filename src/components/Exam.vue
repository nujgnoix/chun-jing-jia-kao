<template>
  <div class="screen">
    <div class="exam-top">
      <button class="back" @click="$emit('back')">‹ 退出</button>
      <div class="timer" :class="{ warn: timeLeft <= 60 }">{{ fmt(timeLeft) }}</div>
      <button class="submit" @click="submit">交卷</button>
    </div>

    <div class="body" v-if="q">
      <div class="q-head">
        <span class="q-type">{{ typeLabel }}</span>
        <span class="q-idx">第 {{ idx + 1 }} 题</span>
      </div>
      <div class="q-title">{{ q.question }}</div>
      <img v-if="q.image" class="q-img" :src="q.image" referrerpolicy="no-referrer" @error="e => e.target.style.display='none'" />
      <div class="options">
        <div
          v-for="(opt, i) in q.options" :key="i"
          class="opt"
          :class="{ sel: isSel(letters[i]) }"
          @click="onPick(i)"
        >
          <span class="tag">{{ letters[i] }}</span>
          <span class="txt">{{ opt }}</span>
        </div>
      </div>
      <div class="grid-num">
        <div
          v-for="(qq, i) in list" :key="i"
          class="numcell"
          :class="{ done: !!answers[qq.id], cur: i === idx }"
          @click="jump(i)"
        >{{ i + 1 }}</div>
      </div>
    </div>

    <div class="mask" :class="{ show: showResult }">
      <div class="sheet">
        <div class="score" :class="{ pass: score >= 90 }">{{ score }}</div>
        <div class="tip">{{ score >= 90 ? '合格！恭喜 🎉' : '未合格，再练练错题' }}</div>
        <button @click="$emit('home')">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { store } from '../store.js'

const props = defineProps({ subject: Number, bank: Object })
const emit = defineEmits(['back', 'home'])

const letters = ['A', 'B', 'C', 'D', 'E', 'F']
const list = ref([])
const idx = ref(0)
const answers = ref({})       // id -> [letters]
const timeLeft = ref(props.subject === 1 ? 45 * 60 : 30 * 60)
let timer = null
const showResult = ref(false)
const score = ref(0)

const q = computed(() => list.value[idx.value] || null)
const typeLabel = computed(() => ({ single: '单选题', multiple: '多选题', judge: '判断题' }[q.value?.type] || ''))

function shuffle(a){
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
onMounted(() => {
  const total = props.subject === 1 ? 100 : 50
  const all = props.bank[props.subject] || []
  list.value = shuffle([...all]).slice(0, total)
  startTimer()
})
onBeforeUnmount(() => clearInterval(timer))

function startTimer(){
  timer = setInterval(() => {
    timeLeft.value--
    if(timeLeft.value <= 0){ clearInterval(timer); submit() }
  }, 1000)
}
function fmt(s){
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return m + ':' + ss
}
function isSel(l){
  const a = answers.value[q.value.id]
  return a ? a.includes(l) : false
}
function onPick(i){
  const id = q.value.id
  const l = letters[i]
  if(!answers.value[id]) answers.value[id] = []
  if(q.value.type === 'multiple'){
    const arr = answers.value[id]
    const p = arr.indexOf(l)
    if(p >= 0) arr.splice(p, 1); else arr.push(l)
  } else {
    answers.value[id] = [l]
  }
  answers.value = { ...answers.value }
}
function jump(i){ idx.value = i }
function submit(){
  clearInterval(timer)
  let right = 0
  list.value.forEach(qq => {
    const a = answers.value[qq.id] || []
    const ans = qq.answer.split(',').map(s => s.trim())
    const ok = qq.type === 'multiple'
      ? (a.length === ans.length && a.every(x => ans.includes(x)))
      : (a[0] === ans[0])
    if(ok) right++
    else store.wrong[qq.id] = true
  })
  score.value = Math.round(right / list.value.length * 100)
  showResult.value = true
}
</script>
