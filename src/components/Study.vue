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

    <div class="body" ref="bodyEl" v-if="q">
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

      <div v-if="answered" ref="feedbackEl" class="feedback">
        <div class="fb-bar" :class="correct ? 'ok' : 'no'">{{ correct ? '✓ 回答正确' : '✗ 回答错误' }}</div>
        <div class="explain" v-if="q.explain"><b>解析：</b>{{ q.explain }}</div>
        <button class="ai-btn" @click="askAI">问 AI 讲解</button>
      </div>
    </div>

    <div class="body empty" v-else>
      <p>{{ emptyText }}</p>
      <button class="back-home" @click="$emit('home')">返回首页</button>
    </div>

    <div v-if="q" class="actionbar">
      <button v-if="answered" class="fav" :class="{on: isFav}" @click="toggleFav">{{ isFav ? '★ 已收藏' : '☆ 收藏' }}</button>
      <button class="nav" @click="prev">上一题</button>
      <button class="nav primary" @click="next">下一题</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { store, adjustFont, getProgress, setProgress } from '../store.js'

const props = defineProps({ mode: String, subject: Number, bank: Object })
const emit = defineEmits(['back', 'home'])
const toast = inject('toast')

const letters = ['A', 'B', 'C', 'D', 'E', 'F']
const list = ref([])
const idx = ref(0)
const sel = ref([])
const answered = ref(false)
const correct = ref(false)
const feedbackEl = ref(null)
const bodyEl = ref(null)

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
  // 恢复上次看到第几题（按模式+科目记忆），越界则夹到合法范围
  const saved = getProgress(props.mode, props.subject)
  idx.value = Math.min(Math.max(0, saved), Math.max(0, list.value.length - 1))
  reset()
  saveProgress()
})

function reset(){
  sel.value = []
  answered.value = false
  correct.value = false
  // 切题后回到题干顶部，避免停在上一题的解析处
  nextTick(() => { if(bodyEl.value) bodyEl.value.scrollTop = 0 })
}
function saveProgress(){ setProgress(props.mode, props.subject, idx.value) }
function prev(){ if(idx.value > 0){ idx.value--; reset(); saveProgress() } }
function next(){
  if(idx.value < list.value.length - 1){ idx.value++; reset(); saveProgress() }
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
  // 答完题把「判分 + 解析 + 问 AI」滚进视野，老人不用自己往下找
  nextTick(() => feedbackEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
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

// ---------- 题目卡片图：把「文字 + 原图」合成到同一张图，根治「带图分享丢文字」----------
function wrapText(ctx, text, maxWidth){
  const lines = []
  let line = ''
  for(const ch of text){
    const test = line + ch
    if(ctx.measureText(test).width > maxWidth && line){
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if(line) lines.push(line)
  return lines
}

async function loadLocalImage(src){
  const res = await fetch(src)
  if(!res.ok) return null
  const blob = await res.blob()
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
  return await new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = dataUrl
  })
}

async function blobToBase64(blob){
  if(blob.arrayBuffer){
    const buf = await blob.arrayBuffer()
    return abToBase64(buf)
  }
  return await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result.split(',')[1])
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

// 把题目（题干 + 选项 + 答案 + 解析 + 原图）渲染成一张 jpeg 图，返回 blob
async function renderCardBlob(q, subject){
  const W = 750, dpr = 2, pad = 44, lineH = 1.45
  const mctx = document.createElement('canvas').getContext('2d')

  const ans = q.answer.split(',').map(s => s.trim())
  const ansText = ans.map(l => l + '. ' + q.options[letters.indexOf(l)]).join('\n')
  const blocks = [
    { text: `【驾考${subject === 1 ? '科目一' : '科目四'} · ${typeLabel.value}】`, size: 42, color: '#1565C0', bold: true },
    { text: q.question, size: 38, color: '#1a1a1a', bold: false },
    { text: q.options.map((o, i) => letters[i] + '. ' + o).join('\n'), size: 38, color: '#1a1a1a', bold: false },
    { text: '正确答案：\n' + ansText, size: 38, color: '#2196F3', bold: true },
  ]
  if(q.explain) blocks.push({ text: '解析：' + q.explain, size: 34, color: '#555', bold: false })
  blocks.push({ text: '请帮我用通俗的语言讲解这道题，并解释为什么选 ' + q.answer + '。', size: 34, color: '#555', bold: false })

  // 测量文字总高度
  let textH = pad * 2
  const blockLines = []
  for(const b of blocks){
    mctx.font = `${b.bold ? 'bold ' : ''}${b.size}px sans-serif`
    const innerW = W - pad * 2
    const lines = []
    for(const para of b.text.split('\n')){
      lines.push(...wrapText(mctx, para, innerW))
    }
    blockLines.push({ ...b, lines })
    textH += lines.length * (b.size * lineH) + 18
  }

  // 加载原图并算高度
  let img = null, imgH = 0, imgScale = 1
  if(q.image){
    img = await loadLocalImage(q.image)
    if(img){
      const maxW = W - pad * 2
      imgScale = Math.min(1, maxW / img.width)
      imgH = img.height * imgScale
      textH += imgH + 24
    }
  }

  const H = Math.ceil(textH)
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  let y = pad
  for(const bl of blockLines){
    ctx.font = `${bl.bold ? 'bold ' : ''}${bl.size}px sans-serif`
    ctx.fillStyle = bl.color
    ctx.textBaseline = 'top'
    const lh = bl.size * lineH
    for(const line of bl.lines){
      ctx.fillText(line, pad, y)
      y += lh
    }
    y += 18
  }
  if(img){
    ctx.drawImage(img, pad, y, img.width * imgScale, imgH)
    y += imgH
  }

  return await new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.92)
  })
}

// 原生安卓：卡片图写入缓存目录并返回可被其他 App 读取的 content:// URI
async function buildCardUri(q, subject){
  const blob = await renderCardBlob(q, subject)
  const base64 = await blobToBase64(blob)
  const fname = 'card_' + String(q.id).replace(/[^a-zA-Z0-9_-]/g, '_') + '.jpg'
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

  // 只调起一次分享面板；失败/取消一律静默返回，绝不写剪贴板、也不重试第二次
  try{
    if(Capacitor.isNativePlatform()){
      let opts = { title: '驾考题目求讲解', text, dialogTitle: '转发给豆包 / 千问 讲解' }
      // 有图：把「题目文字 + 原图」合成一张卡片图
      if(q.value.image){
        const uri = await buildCardUri(q.value, props.subject)   // 失败会抛出，交给外层统一处理
        opts.files = [uri]
      }
      await Share.share(opts)
      return
    }
    // 浏览器（H5）
    if(navigator.share){
      const opts = { title: '驾考题目求讲解', text }
      if(q.value.image){
        const blob = await renderCardBlob(q.value, props.subject)
        const file = new File([blob], 'question_card.jpg', { type: 'image/jpeg' })
        if(!navigator.canShare || navigator.canShare({ files: [file] })) opts.files = [file]
      }
      await navigator.share(opts)
    }
  }catch(e){ /* 用户取消或分享失败：静默返回，保持题目页面不变 */ }
}
function onImgErr(e){ e.target.style.display = 'none' }
function setFs(d){ const v = adjustFont(d); toast('字号 ' + v) }
</script>
