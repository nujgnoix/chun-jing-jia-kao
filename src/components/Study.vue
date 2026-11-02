<template>
  <div class="screen">
    <div class="topbar">
      <button class="back" @click="$emit('back')">‹ 返回</button>
      <div class="title">{{ titleText }}</div>
      <div class="fsctl">
        <button @click="setFs(-2)">A−</button>
        <button @click="setFs(2)">A+</button>
      </div>
    </div>

    <div class="body" v-if="q">
      <div class="q-head">
        <span class="q-type">{{ typeLabel }}</span>
        <span class="q-idx">{{ idx + 1 }} / {{ list.length }}</span>
      </div>
      <div class="q-title">{{ q.question }}</div>
      <img v-if="q.image" class="q-img" :src="q.image" referrerpolicy="no-referrer" @error="onImgErr" />
      <div class="options">
        <div
          v-for="(opt, i) in q.options" :key="i"
          class="opt"
          :class="optClass(i)"
          @click="onPick(i)"
        >
          <span class="tag">{{ letters[i] }}</span>
          <span class="txt">{{ opt }}</span>
        </div>
      </div>

      <div v-if="!answered && q.type==='multiple'" class="confirm-row">
        <button class="confirm" @click="evaluate">确认答案</button>
      </div>

      <div v-if="answered" class="feedback">
        <div class="fb-bar" :class="correct ? 'ok' : 'no'">{{ correct ? '✓ 回答正确' : '✗ 回答错误（正确答案已标蓝）' }}</div>
        <div class="explain" v-if="q.explain"><b>解析：</b>{{ q.explain }}</div>
        <button class="ai-btn" @click="askAI">问 AI 讲解（转发豆包 / 千问）</button>
        <div class="fav-row">
          <button class="fav" :class="{on: isFav}" @click="toggleFav">{{ isFav ? '★ 已收藏' : '☆ 收藏' }}</button>
          <button class="nav" @click="prev">上一题</button>
          <button class="nav primary" @click="next">下一题</button>
        </div>
      </div>
      <div v-else class="nav-row">
        <button class="nav" @click="prev">上一题</button>
        <button class="nav primary" @click="next">下一题</button>
      </div>
    </div>

    <div class="body empty" v-else>
      <p>{{ emptyText }}</p>
      <button class="back-home" @click="$emit('home')">返回首页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { store } from '../store.js'

const props = defineProps({ mode: String, subject: Number, bank: Object })
const emit = defineEmits(['back', 'home'])
const toast = inject('toast')

const letters = ['A', 'B', 'C', 'D', 'E', 'F']
const list = ref([])
const idx = ref(0)
const sel = ref([])
const answered = ref(false)
const correct = ref(false)

const q = computed(() => list.value[idx.value] || null)
const typeLabel = computed(() => ({ single: '单选题', multiple: '多选题', judge: '判断题' }[q.value?.type] || ''))
const titleText = computed(() => ({ sequence: '顺序练习', wrong: '错题本', fav: '我的收藏' }[props.mode] || '练习'))
const emptyText = computed(() => props.mode === 'wrong' ? '还没有错题，继续练习吧～' : props.mode === 'fav' ? '还没有收藏的题' : '暂无题目')
const isFav = computed(() => q.value ? !!store.fav[q.value.id] : false)

function buildList(){
  const all = props.bank[props.subject] || []
  if(props.mode === 'wrong') return all.filter(x => store.wrong[x.id])
  if(props.mode === 'fav') return all.filter(x => store.fav[x.id])
  return all
}

onMounted(() => {
  list.value = buildList()
  idx.value = 0
  reset()
})

function reset(){
  sel.value = []
  answered.value = false
  correct.value = false
}
function prev(){ if(idx.value > 0){ idx.value--; reset() } }
function next(){
  if(idx.value < list.value.length - 1){ idx.value++; reset() }
  else toast('已经是最后一题')
}

function onPick(i){
  if(answered.value) return
  const letter = letters[i]
  if(q.value.type === 'multiple'){
    const p = sel.value.indexOf(letter)
    if(p >= 0) sel.value.splice(p, 1); else sel.value.push(letter)
  } else {
    sel.value = [letter]
    evaluate()
  }
}

function evaluate(){
  if(answered.value) return
  if(q.value.type === 'multiple' && sel.value.length === 0){ toast('请先选择答案'); return }
  answered.value = true
  const ans = q.value.answer.split(',').map(s => s.trim())
  const ok = q.value.type === 'multiple'
    ? (sel.value.length === ans.length && sel.value.every(l => ans.includes(l)))
    : (sel.value[0] === ans[0])
  correct.value = ok
  // 答错进错题本，答对则移出错题本
  if(ok) delete store.wrong[q.value.id]
  else store.wrong[q.value.id] = true
}

function optClass(i){
  const letter = letters[i]
  const cls = ['opt']
  if(answered.value){
    const ans = q.value.answer.split(',').map(s => s.trim())
    if(ans.includes(letter)) cls.push('correct')
    if(sel.value.includes(letter) && !ans.includes(letter)) cls.push('wrong')
  } else if(sel.value.includes(letter)){
    cls.push('sel')
  }
  return cls
}

function toggleFav(){
  if(!q.value) return
  if(store.fav[q.value.id]) delete store.fav[q.value.id]
  else store.fav[q.value.id] = true
}

function abToBase64(buf){
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for(let i = 0; i < bytes.length; i += chunk){
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// 把打包在 APK 内的题目图片先落到「可分享缓存目录」，返回 content:// URI
async function getShareImageUri(imageRel){
  const res = await fetch(imageRel)
  if(!res.ok) return null
  const buf = await res.arrayBuffer()
  const base64 = abToBase64(buf)
  const fname = 'share_' + imageRel.split('/').pop()
  await Filesystem.writeFile({ path: 'share/' + fname, data: base64, directory: Directory.Cache, recursive: true })
  const { uri } = await Filesystem.getUri({ path: 'share/' + fname, directory: Directory.Cache })
  return uri
}

async function askAI(){
  if(!q.value) return
  const ans = q.value.answer.split(',').map(s => s.trim())
  const ansText = ans.map(l => l + '.' + q.value.options[letters.indexOf(l)]).join('；')
  const optText = q.value.options.map((o, i) => letters[i] + '. ' + o).join('；')
  const text = `【驾考${props.subject === 1 ? '科目一' : '科目四'}·${typeLabel.value}】\n题目：${q.value.question}\n选项：${optText}\n正确答案：${ansText}\n请帮我用通俗的语言讲解这道题，并解释为什么选${q.value.answer}。`

  try{
    // 1) 原生 APP（安卓）：调起系统分享面板，有图则连图一起带过去
    if(Capacitor.isNativePlatform()){
      let uri = null
      if(q.value.image){ try{ uri = await getShareImageUri(q.value.image) }catch(e){ uri = null } }
      const opts = { title: '驾考题目求讲解', text, dialogTitle: '转发给豆包 / 千问 讲解' }
      if(uri) opts.files = [uri]
      await Share.share(opts)
      return
    }
    // 2) 浏览器（H5）：尽量用 Web Share 带图，否则退化为纯文本
    if(navigator.share){
      try{
        if(q.value.image && navigator.canShare){
          const res = await fetch(q.value.image)
          const blob = await res.blob()
          const file = new File([blob], 'question.jpg', { type: 'image/jpeg' })
          if(navigator.canShare({ files: [file] })){
            await navigator.share({ title: '驾考题目求讲解', text, files: [file] })
            return
          }
        }
      }catch(e){ /* 落到纯文本分享 */ }
      await navigator.share({ title: '驾考题目求讲解', text }).catch(() => {})
      return
    }
  }catch(e){ /* 用户取消分享：静默返回 */ }
  // 3) 不支持分享的环境：复制文本
  copy(text)
}
function copy(text){
  if(navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('已复制，去豆包/千问粘贴')).catch(() => toast('已复制题目'))
  else toast('已复制题目，去豆包/千问粘贴')
}
function onImgErr(e){ e.target.style.display = 'none' }
function setFs(d){ store.fs = Math.min(32, Math.max(18, store.fs + d)); toast('字号 ' + store.fs) }
</script>
