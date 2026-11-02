import { reactive, watch } from 'vue'

const KEY = 'jiaxiao_v1'
const saved = JSON.parse(localStorage.getItem(KEY) || '{}')

// wrong / fav 存题目 id；fs 为字体大小（默认超大 24px）
export const store = reactive({
  wrong: saved.wrong || {},
  fav: saved.fav || {},
  fs: saved.fs || 24
})

watch(
  () => JSON.stringify({ wrong: store.wrong, fav: store.fav, fs: store.fs }),
  () => {
    localStorage.setItem(KEY, JSON.stringify({ wrong: store.wrong, fav: store.fav, fs: store.fs }))
  }
)
