<template>
  <div class="screen">
    <div class="exam-top">
      <button class="back" @click="$emit('back')">‹ 退出</button>
      <div class="timer" :class="{ warn: timeLeft <= 60 }">{{ fmt(timeLeft) }}</div>
      <button class="submit" @click="askSubmit">交卷</button>
    </div>

    <div class="body" ref="bodyEl" v-if="q">
      <div class="q-head">
        <span class="q-type">{{ typeLabel }}</span>
        <span class="q-idx">第 {{ idx + 1 }} / {{ list.length }} 题</span>
      </div>
      <div class="exam-progress">
        <div class="bar"><span :style="{ width: progressPct + '%' }"></span></div>
        <div class="prow">
          <span class="ptxt">已答 {{ answeredCount }} / {{ list.length }} 题</span>
          <button class="card-link" @click="showCard = true">答题卡 ›</button>
        </div>
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
    </div>

    <div v-if="q" class="actionbar">
      <button class="nav" :disabled="idx === 0" @click="prev">上一题</button>
      <button class="nav primary" @click="next">下一题</button>
    </div>

    <div class="mask" :class="{ show: showCard }">
      <div class="card-sheet">
        <div class="cs-head">答题卡 · 已答 {{ answeredCount }} / {{ list.length }}</div>
        <button v-if="unanswered > 0" class="cs-quick" @click="gotoUnanswered">跳到第一道未作答（还有 {{ unanswered }} 题）</button>
        <div class="cs-grid">
          <div
            v-for="(qq, i) in list" :key="i"
            class="numcell"
            :class="{ done: isDone(qq.id), cur: i === idx }"
            @click="jumpTo(i)"
          >{{ i + 1 }}</div>
        </div>
        <button class="ghost" @click="showCard = false">关闭答题卡</button>
      </div>
    </div>

    <div class="mask" :class="{ show: showConfirm }">
      <div class="sheet">
        <div class="tip">确定要交卷吗？交卷后不能修改答案。<template v-if="unanswered > 0"><br>还有 {{ unanswered }} 题没作答。</template></div>
        <button @click="doSubmit">确定交卷</button>
        <button class="ghost" @click="showConfirm = false">继续答题</button>
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
import { ref, computed, onMounted, onBeforeUnmount, inject, nextTick } from 'vue'
import { store } from '../store.js'

const props = defineProps({ subject: Number, bank: Object })
const emit = defineEmits(['back', 'home'])
const toast = inject('toast')

const letters = ['A', 'B', 'C', 'D', 'E', 'F']
const list = ref([])
const idx = ref(0)
const answers = ref({})       // id -> [letters]
const timeLeft = ref(props.subject === 1 ? 45 * 60 : 30 * 60)
let timer = null
let finished = false          // 已交卷：不再续考，返回首页后重开是新卷
const showResult = ref(false)
const showConfirm = ref(false)
const showCard = ref(false)
const bodyEl = ref(null)
const score = ref(0)

const q = computed(() => list.value[idx.value] || null)
const typeLabel = computed(() => ({ single: '单选题', multiple: '多选题', judge: '判断题' }[q.value?.type] || ''))
const answeredCount = computed(() => list.value.filter(qq => isDone(qq.id)).length)
const unanswered = computed(() => list.value.length - answeredCount.value)
const progressPct = computed(() => list.value.length ? Math.round(answeredCount.value / list.value.length * 100) : 0)

function shuffle(a){
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 把当前考试状态写入 store（落盘由 store 的 watch 统一处理）
function persist(){
  if(finished) return
  store.exam = {
    subject: props.subject,
    ids: list.value.map(qq => qq.id),
    answers: answers.value,
    idx: idx.value,
    timeLeft: timeLeft.value
  }
}

onMounted(() => {
  const total = props.subject === 1 ? 100 : 50
  const all = props.bank[props.subject] || []
  const saved = store.exam
  console.log('[EXAM] mount saved?', !!saved, 'subj', saved && saved.subject, 'idsLen', saved && saved.ids && saved.ids.length, 'allLen', all.length, 'idx', saved && saved.idx)
  // 有同科目的未完成考试 → 续考；否则开新卷
  if(saved && saved.subject === props.subject && Array.isArray(saved.ids) && saved.ids.length){
    const restored = saved.ids.map(id => all.find(qq => qq.id === id)).filter(Boolean)
    console.log('[EXAM] restoredLen', restored.length, 'expected', saved.ids.length)
    if(restored.length === saved.ids.length && restored.length){
      list.value = restored
      idx.value = Math.min(saved.idx || 0, list.value.length - 1)
      answers.value = saved.answers || {}
      timeLeft.value = typeof saved.timeLeft === 'number' ? saved.timeLeft : (props.subject === 1 ? 45 * 60 : 30 * 60)
    } else {
      newExam(all, total)
    }
  } else {
    newExam(all, total)
  }
  startTimer()
})
onBeforeUnmount(() => { clearInterval(timer); if(!finished) persist() })

function newExam(all, total){
  list.value = shuffle([...all]).slice(0, total)
  idx.value = 0
  answers.value = {}
  timeLeft.value = props.subject === 1 ? 45 * 60 : 30 * 60
  finished = false
  persist()
}

function startTimer(){
  timer = setInterval(() => {
    timeLeft.value--
    if(timeLeft.value % 10 === 0) persist()   // 每 10 秒落盘一次剩余时间
    if(timeLeft.value <= 0){ clearInterval(timer); submit() }
  }, 1000)
}
function fmt(s){
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return m + ':' + ss
}
function isDone(id){
  const a = answers.value[id]
  return !!(a && a.length)
}
function isSel(l){
  const a = answers.value[q.value.id]
  return a ? a.includes(l) : false
}
function scrollTop(){
  nextTick(() => { if(bodyEl.value) bodyEl.value.scrollTop = 0 })
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
  persist()
}
function prev(){
  if(idx.value > 0){ idx.value--; scrollTop(); persist() }
}
function next(){
  if(idx.value < list.value.length - 1){ idx.value++; scrollTop(); persist() }
  else toast('已经是最后一题，点右上角交卷')
}
function jumpTo(i){
  idx.value = i
  showCard.value = false
  scrollTop()
  persist()
}
function gotoUnanswered(){
  const i = list.value.findIndex(qq => !isDone(qq.id))
  if(i < 0) return
  jumpTo(i)
}
function askSubmit(){ showConfirm.value = true }
function doSubmit(){ showConfirm.value = false; submit() }
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
  finished = true
  store.exam = null   // 已交卷：清掉续考存档，下次进是新卷
  showResult.value = true
}
</script>
