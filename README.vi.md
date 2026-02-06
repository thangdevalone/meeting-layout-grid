<p align="center">
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-core?color=blue&label=core" alt="npm core" />
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-react?color=blue&label=react" alt="npm react" />
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-vue?color=blue&label=vue" alt="npm vue" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
</p>

<h1 align="center">Meet Layout Grid</h1>

<p align="center">
  Grid responsive cho bố cục video meeting. Dùng được với Vanilla JS, React và Vue. Dùng Motion cho animation khi đổi layout.
</p>

<p align="center">
  <a href="#demos">Demos</a> ·
  <a href="#tính-năng">Tính năng</a> ·
  <a href="#các-gói">Các gói</a> ·
  <a href="#cài-đặt">Cài đặt</a> ·
  <a href="#bắt-đầu-nhanh">Bắt đầu nhanh</a> ·
  <a href="#thuật-toán">Thuật toán</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#giấy-phép">Giấy phép</a>
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

---

## Demos

- [React demo](https://meeting-react-grid.modern-ui.org/)
- [Vue demo](https://meeting-vue-grid.modern-ui.org/)

---

## Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| **3 chế độ layout** | Gallery, Spotlight, Sidebar (dùng `sidebarPosition: 'bottom'` cho layout giống speaker) |
| **Animation spring** | Motion (Framer Motion / Motion One) khi chuyển layout |
| **Responsive** | Tự co giãn theo container; hàng cuối có thể căn giữa |
| **Phân trang** | Có thể bật phân trang khi nhiều người hoặc màn nhỏ |
| **Tỉ lệ linh hoạt** | Hỗ trợ tỉ lệ khác nhau cho từng item (phone 9:16, desktop 16:9, whiteboard fill) |
| **Vanilla / React / Vue** | Core không phụ thuộc framework; có gói React 18+ và Vue 3 |
| **Tree-shakeable** | Chỉ import phần cần dùng |
| **TypeScript** | Có type đầy đủ |

---

## Các gói

Monorepo với ba gói có thể publish:

| Gói | Mô tả | Dung lượng |
|-----|-------|------------|
| [`@thangdevalone/meet-layout-grid-core`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-core) | Chỉ tính toán grid (Vanilla JS/TS) | ~3KB |
| [`@thangdevalone/meet-layout-grid-react`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-react) | Component React + Motion | ~8KB |
| [`@thangdevalone/meet-layout-grid-vue`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-vue) | Component Vue 3 + Motion | ~8KB |

---

## Cài đặt

```bash
# Chỉ core (Vanilla JavaScript/TypeScript)
npm install @thangdevalone/meet-layout-grid-core

# React 18+
npm install @thangdevalone/meet-layout-grid-react

# Vue 3
npm install @thangdevalone/meet-layout-grid-vue
```

Dùng pnpm:

```bash
pnpm add @thangdevalone/meet-layout-grid-react
```

Dùng yarn:

```bash
yarn add @thangdevalone/meet-layout-grid-react
```

---

## Bắt đầu nhanh

### Vanilla JavaScript

```javascript
import { createMeetGrid } from '@thangdevalone/meet-layout-grid-core'

const grid = createMeetGrid({
  dimensions: { width: 800, height: 600 },
  count: 6,
  aspectRatio: '16:9',
  gap: 8,
  layoutMode: 'gallery',
})

for (let i = 0; i < 6; i++) {
  const { top, left } = grid.getPosition(i)
  const { width, height } = grid.getItemDimensions(i)
  
  element.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: ${width}px;
    height: ${height}px;
  `
}
```

### React

```tsx
import { GridContainer, GridItem } from '@thangdevalone/meet-layout-grid-react'

function MeetingGrid({ participants }) {
  return (
    <GridContainer
      aspectRatio="16:9"
      gap={8}
      layoutMode="gallery"
      count={participants.length}
    >
      {participants.map((p, index) => (
        <GridItem key={p.id} index={index}>
          <VideoTile participant={p} />
        </GridItem>
      ))}
    </GridContainer>
  )
}
```

### Vue 3

```vue
<script setup>
import { GridContainer, GridItem } from '@thangdevalone/meet-layout-grid-vue'

const participants = ref([...])
</script>

<template>
  <GridContainer
    aspect-ratio="16:9"
    :gap="8"
    :count="participants.length"
    layout-mode="gallery"
  >
    <GridItem
      v-for="(p, index) in participants"
      :key="p.id"
      :index="index"
    >
      <VideoTile :participant="p" />
    </GridItem>
  </GridContainer>
</template>
```

---

## Thuật toán

### Chọn kích thước tile (Focused / Sidebar)

Với layout có một vùng “chính” và phần còn lại là grid, thư viện chọn số cột sao cho diện tích tile ở vùng phụ là lớn nhất:

```
Cho: N items, vùng W × H, tỉ lệ R, gap G

Với mỗi số cột C từ 1 đến N:
  1. rows = ceil(N / C)
  2. tileW = (W - (C - 1) × G) / C
  3. tileH = tileW × R
  4. Nếu tổng chiều cao > H thì scale giảm:
     scale = H / (rows × tileH + (rows - 1) × G)
     tileH = tileH × scale, tileW = tileH / R
  5. area = tileW × tileH

Chọn (C, rows) có area lớn nhất
```

### Tính vị trí

Vị trí tính từ index bằng hàm thuần, nên cùng index luôn ra cùng tọa độ (tránh lệch khi re-render). Hàng cuối được căn giữa nếu ít ô hơn các hàng trên.

---

## Các chế độ layout

| Chế độ | Mô tả |
|--------|-------|
| `gallery` | Các ô cùng kích thước; hàng cuối căn giữa (dùng `pinnedIndex` để ghim) |
| `spotlight` | Chỉ một người |
| `sidebar` | Vùng chính + dải thumbnail (trái/phải/trên/dưới, dùng `sidebarPosition: 'bottom'` cho layout giống speaker) |

---

## Preset animation

| Preset | Dùng khi |
|--------|----------|
| `snappy` | Phản hồi nhanh |
| `smooth` | Đổi layout (mặc định) |
| `gentle` | Chuyển động nhẹ |
| `bouncy` | Hơi overshoot |

---

## Phân trang

Dùng `maxItemsPerPage` và `currentPage` để tile không bị thu nhỏ quá khi có nhiều người:

```tsx
<GridContainer
  count={participants.length}
  maxItemsPerPage={9}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
>
  {/* ... */}
</GridContainer>
```

Kích thước tile tính theo số item trên trang hiện tại, không phải tổng số.

---

## Tỉ lệ linh hoạt (Flexible Aspect Ratios)

Hỗ trợ tỉ lệ khác nhau cho từng participant, rất hữu ích khi:
- **Whiteboard/Screen share** cần chiếm full cell hoặc có tỉ lệ riêng
- **Participants từ điện thoại** có video dọc (9:16)
- **Participants từ desktop** có video ngang (16:9)

### Sử dụng

```tsx
// Định nghĩa tỉ lệ cho từng participant
const itemAspectRatios = [
  "16:9",    // Participant 0: desktop landscape
  "9:16",    // Participant 1: mobile portrait  
  "fill",    // Participant 2: whiteboard (stretch to fill)
  undefined, // Participant 3: use global aspectRatio
]

const grid = createMeetGrid({
  dimensions: { width: 800, height: 600 },
  count: 4,
  aspectRatio: '16:9', // Default ratio
  gap: 8,
  layoutMode: 'gallery',
  itemAspectRatios, // Per-item ratios
})

// Lấy kích thước content thực tế (có offset để center)
for (let i = 0; i < 4; i++) {
  const cellDims = grid.getItemDimensions(i)              // Cell size
  const contentDims = grid.getItemContentDimensions(i)    // Content size + offset

  // Render cell wrapper
  cell.style.cssText = `
    width: ${cellDims.width}px;
    height: ${cellDims.height}px;
  `

  // Render video content inside (centered)
  video.style.cssText = `
    width: ${contentDims.width}px;
    height: ${contentDims.height}px;
    margin-top: ${contentDims.offsetTop}px;
    margin-left: ${contentDims.offsetLeft}px;
  `
}
```

### Các giá trị ItemAspectRatio

| Giá trị | Mô tả |
|---------|-------|
| `"16:9"` | Tỉ lệ cố định (width:height) |
| `"9:16"` | Video dọc từ điện thoại |
| `"4:3"`, `"1:1"` | Các tỉ lệ khác |
| `"fill"` | Stretch để fill toàn bộ cell (dùng cho whiteboard) |
| `"auto"` | Fill cell (giống `"fill"`) |
| `undefined` | Sử dụng global `aspectRatio` |

### React example với mixed ratios

```tsx
import { GridContainer, GridItem } from '@thangdevalone/meet-layout-grid-react'

function MeetingGrid({ participants, whiteboard }) {
  // Build aspect ratios array
  const itemAspectRatios = participants.map(p => {
    if (p.isWhiteboard) return 'fill'
    if (p.isMobile) return '9:16'
    return '16:9'
  })

  return (
    <GridContainer
      aspectRatio="16:9"
      gap={8}
      layoutMode="gallery"
      count={participants.length}
      itemAspectRatios={itemAspectRatios}
    >
      {participants.map((p, index) => (
        <GridItem key={p.id} index={index}>
          {({ contentDimensions }) => (
            <div 
              className="video-content"
              style={{
                width: contentDimensions.width,
                height: contentDimensions.height,
                marginTop: contentDimensions.offsetTop,
                marginLeft: contentDimensions.offsetLeft,
              }}
            >
              <VideoTile participant={p} />
            </div>
          )}
        </GridItem>
      ))}
    </GridContainer>
  )
}
```

---

## Phát triển

- Node.js 18+
- pnpm 8+

```bash
git clone https://github.com/thangdevalone/meet-layout-grid.git
cd meet-layout-grid

pnpm install
pnpm build

# Chạy demo
cd examples/react-demo && pnpm dev   # http://localhost:5173
cd examples/vue-demo && pnpm dev     # http://localhost:5174
```

Cấu trúc:

```
meet-layout-grid/
├── packages/
│   ├── core/       # Logic grid
│   ├── react/      # React
│   └── vue/        # Vue 3
├── examples/
│   ├── react-demo/
│   └── vue-demo/
└── package.json
```

---

## API Reference

### Core: `createMeetGrid(options): MeetGrid`

| Option | Kiểu | Mặc định | Mô tả |
|--------|------|----------|-------|
| `dimensions` | `{ width, height }` | bắt buộc | Kích thước container |
| `count` | `number` | bắt buộc | Số item |
| `aspectRatio` | `string` | `'16:9'` | Tỉ lệ tile mặc định |
| `gap` | `number` | `8` | Khoảng cách giữa tile (px) |
| `layoutMode` | `LayoutMode` | `'gallery'` | `gallery` \| `spotlight` \| `sidebar` |
| `pinnedIndex` | `number` | - | Index của participant được ghim |
| `maxItemsPerPage` | `number` | - | Số item tối đa mỗi trang |
| `currentPage` | `number` | `0` | Trang hiện tại (0-based) |
| `sidebarPosition` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | Vị trí sidebar |
| `itemAspectRatios` | `(ItemAspectRatio \| undefined)[]` | - | Tỉ lệ riêng cho từng item |

### Kiểu `ItemAspectRatio`

```typescript
type ItemAspectRatio = string | 'fill' | 'auto'
// string: "16:9", "9:16", "4:3", "1:1", etc.
// 'fill': Stretch to fill cell (whiteboard)
// 'auto': Same as 'fill'
```

### Kết quả `MeetGridResult`

| Method | Mô tả |
|--------|-------|
| `getPosition(index)` | Trả về `{ top, left }` của item |
| `getItemDimensions(index)` | Trả về `{ width, height }` của cell |
| `getItemContentDimensions(index, ratio?)` | Trả về `{ width, height, offsetTop, offsetLeft }` của content thực tế |
| `isItemVisible(index)` | Item có hiển thị trên trang hiện tại không |
| `isMainItem(index)` | Item có phải là item chính (pinned) không |

---

## Giấy phép

MIT. Dùng được cho dự án cá nhân và thương mại; giữ attribution theo [LICENSE](./LICENSE).

Duy trì bởi [@thangdevalone](https://github.com/thangdevalone).
