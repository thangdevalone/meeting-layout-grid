<p align="center">
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-core?color=blue&label=core" alt="npm core" />
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-react?color=blue&label=react" alt="npm react" />
  <img src="https://img.shields.io/npm/v/@thangdevalone/meet-layout-grid-vue?color=blue&label=vue" alt="npm vue" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
</p>

<h1 align="center">Meet Layout Grid</h1>

<p align="center">
  Thư viện grid responsive cho bố cục video meeting với animation mượt mà.
  <br />
  Hỗ trợ Vanilla JS, React và Vue.
</p>

<p align="center">
  <a href="#demos">Demos</a> ·
  <a href="#tính-năng">Tính năng</a> ·
  <a href="#các-gói">Các gói</a> ·
  <a href="#cài-đặt">Cài đặt</a> ·
  <a href="#bắt-đầu-nhanh">Bắt đầu nhanh</a> ·
  <a href="#chế-độ-layout">Chế độ layout</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#giấy-phép">Giấy phép</a>
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

---

## Demos

- [React Demo](https://meeting-react-grid.modern-ui.org/)
- [Vue Demo](https://meeting-vue-grid.modern-ui.org/)

---

## Tính năng

| Tính năng                  | Mô tả                                                  |
| -------------------------- | ------------------------------------------------------ |
| **2 chế độ layout**        | Gallery (có hỗ trợ ghim), Spotlight                    |
| **Ghim participant**       | Ghim bất kỳ participant nào làm view chính             |
| **Animation spring**       | Motion (Framer Motion / Motion One) khi chuyển layout  |
| **Phân trang**             | Chia participant qua nhiều trang                       |
| **Giới hạn hiển thị "+N"** | Giới hạn số item và hiển thị chỉ báo overflow          |
| **Tỉ lệ linh hoạt**        | Tỉ lệ riêng cho từng item (phone 9:16, desktop 16:9)   |
| **Floating PiP**           | Picture-in-Picture kéo thả, snap vào góc               |
| **Grid Overlay**           | Overlay toàn grid cho screen sharing, whiteboard, v.v. |
| **Responsive**             | Tự động co giãn theo container với justified packing   |
| **Đa framework**           | Vanilla JS, React 18+, Vue 3                           |
| **TypeScript**             | Type đầy đủ                                            |
| **Tree-shakeable**         | Chỉ import phần cần dùng                               |

---

## Các gói

| Gói                                                                                                            | Mô tả                              | Dung lượng |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------- |
| [`@thangdevalone/meet-layout-grid-core`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-core)   | Chỉ tính toán grid (Vanilla JS/TS) | ~3KB       |
| [`@thangdevalone/meet-layout-grid-react`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-react) | Component React + Motion           | ~8KB       |
| [`@thangdevalone/meet-layout-grid-vue`](https://www.npmjs.com/package/@thangdevalone/meet-layout-grid-vue)     | Component Vue 3 + Motion           | ~8KB       |

> Gói React và Vue đã re-export mọi thứ từ core — không cần cài core riêng.

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

---

## Bắt đầu nhanh

### React

```tsx
import { GridContainer, GridItem } from '@thangdevalone/meet-layout-grid-react'

function MeetingGrid({ participants }) {
  return (
    <GridContainer aspectRatio="16:9" gap={8} layoutMode="gallery" count={participants.length}>
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
  <GridContainer aspect-ratio="16:9" :gap="8" :count="participants.length" layout-mode="gallery">
    <GridItem v-for="(p, index) in participants" :key="p.id" :index="index">
      <VideoTile :participant="p" />
    </GridItem>
  </GridContainer>
</template>
```

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

---

## Chế độ layout

| Chế độ      | Mô tả                                                         |
| ----------- | ------------------------------------------------------------- |
| `gallery`   | Grid linh hoạt lấp đầy không gian. Dùng `pinnedIndex` để ghim |
| `spotlight` | Một participant chiếm toàn bộ container                       |

### Gallery với ghim

Khi đặt `pinnedIndex`, layout chia thành **Vùng chính** (item được ghim) và **Vùng phụ** (thumbnail):

```tsx
<GridContainer
  layoutMode="gallery"
  pinnedIndex={0}              // Participant được ghim
  othersPosition="right"       // Thumbnail bên phải
  count={participants.length}
>
```

| `othersPosition` | Mô tả                              |
| ---------------- | ---------------------------------- |
| `right`          | Thumbnail bên phải (mặc định)      |
| `left`           | Thumbnail bên trái                 |
| `top`            | Thumbnail phía trên (dải ngang)    |
| `bottom`         | Thumbnail phía dưới (kiểu speaker) |

---

## Phân trang

Chia participant qua nhiều trang:

```tsx
<GridContainer
  count={participants.length}
  maxItemsPerPage={9}
  currentPage={currentPage}
>
```

Với chế độ ghim, dùng `maxVisible` và `currentVisiblePage` để phân trang vùng "others":

```tsx
<GridContainer
  layoutMode="gallery"
  pinnedIndex={0}
  maxVisible={4}
  currentVisiblePage={othersPage}
>
```

---

## Giới hạn hiển thị "+N thêm"

Giới hạn số item hiển thị và hiện chỉ báo overflow:

```tsx
<GridContainer maxVisible={4} count={12}>
  {participants.map((p, index) => (
    <GridItem key={p.id} index={index}>
      {({ isLastVisibleOther, hiddenCount }) => (
        <>
          {isLastVisibleOther && hiddenCount > 0 ? (
            <div className="more-indicator">+{hiddenCount} thêm</div>
          ) : (
            <VideoTile participant={p} />
          )}
        </>
      )}
    </GridItem>
  ))}
</GridContainer>
```

---

## Tỉ lệ linh hoạt

Hỗ trợ tỉ lệ khác nhau cho từng participant (ví dụ: mobile dọc vs desktop ngang):

```tsx
const itemAspectRatios = [
  "16:9",    // Desktop ngang
  "9:16",    // Mobile dọc
  undefined, // Dùng aspectRatio chung
]

<GridContainer
  aspectRatio="16:9"
  itemAspectRatios={itemAspectRatios}
>
```

| Giá trị     | Mô tả                                              |
| ----------- | -------------------------------------------------- |
| `"16:9"`    | Tỉ lệ ngang cố định                                |
| `"9:16"`    | Video dọc (điện thoại)                             |
| `"4:3"`     | Tỉ lệ tablet cổ điển                               |
| `"auto"`    | Co giãn lấp đầy cell (mặc định khi không chỉ định) |
| `undefined` | Sử dụng global `aspectRatio`                       |

---

## Floating PiP (Picture-in-Picture)

Item nổi kéo thả, snap vào góc:

```tsx
import { FloatingGridItem } from '@thangdevalone/meet-layout-grid-react'

;<GridContainer>
  {/* Các grid item chính */}

  <FloatingGridItem
    width={130}
    height={175}
    anchor="bottom-right"
    visible={true}
    edgePadding={12}
    borderRadius={8}
    onAnchorChange={(anchor) => console.log(anchor)}
  >
    <VideoTile participant={floatingParticipant} />
  </FloatingGridItem>
</GridContainer>
```

---

## Grid Overlay

Overlay toàn grid cho screen sharing, whiteboard, hoặc nội dung khác:

```tsx
import { GridOverlay } from '@thangdevalone/meet-layout-grid-react'

;<GridContainer>
  {/* Các grid item */}

  <GridOverlay visible={isScreenSharing} backgroundColor="rgba(0,0,0,0.8)">
    <ScreenShareView />
  </GridOverlay>
</GridContainer>
```

---

## Preset animation

| Preset   | Dùng khi              |
| -------- | --------------------- |
| `snappy` | Phản hồi nhanh        |
| `smooth` | Đổi layout (mặc định) |
| `gentle` | Chuyển động nhẹ       |
| `bouncy` | Hơi overshoot         |

```tsx
<GridContainer springPreset="smooth">
```

---

## API Reference

### `createMeetGrid(options): MeetGridResult`

| Option               | Kiểu                                     | Mặc định    | Mô tả                                 |
| -------------------- | ---------------------------------------- | ----------- | ------------------------------------- |
| `dimensions`         | `{ width, height }`                      | bắt buộc    | Kích thước container (px)             |
| `count`              | `number`                                 | bắt buộc    | Số item                               |
| `aspectRatio`        | `string`                                 | `'16:9'`    | Tỉ lệ tile mặc định                   |
| `gap`                | `number`                                 | `8`         | Khoảng cách giữa tile (px)            |
| `layoutMode`         | `'gallery' \| 'spotlight'`               | `'gallery'` | Chế độ layout                         |
| `pinnedIndex`        | `number`                                 | -           | Index của participant được ghim       |
| `othersPosition`     | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'`   | Vị trí thumbnail khi ghim             |
| `maxItemsPerPage`    | `number`                                 | `0`         | Số item tối đa mỗi trang              |
| `currentPage`        | `number`                                 | `0`         | Trang hiện tại (0-based)              |
| `maxVisible`         | `number`                                 | `0`         | Số item hiển thị tối đa (vùng others) |
| `currentVisiblePage` | `number`                                 | `0`         | Trang hiện tại cho visible items      |
| `itemAspectRatios`   | `(ItemAspectRatio \| undefined)[]`       | -           | Tỉ lệ riêng cho từng item             |

### `MeetGridResult`

| Method / Property                         | Trả về              | Mô tả                                    |
| ----------------------------------------- | ------------------- | ---------------------------------------- |
| `getPosition(index)`                      | `{ top, left }`     | Vị trí của item                          |
| `getItemDimensions(index)`                | `{ width, height }` | Kích thước cell                          |
| `getItemContentDimensions(index, ratio?)` | `ContentDimensions` | Kích thước content thực tế với offset    |
| `isItemVisible(index)`                    | `boolean`           | Item có hiển thị trên trang hiện tại     |
| `isMainItem(index)`                       | `boolean`           | Item có phải là item chính (pinned)      |
| `getLastVisibleOthersIndex()`             | `number`            | Index item cuối cùng hiển thị ở "others" |
| `hiddenCount`                             | `number`            | Số item bị ẩn (cho "+N thêm")            |
| `pagination`                              | `PaginationInfo`    | Thông tin phân trang                     |

### `PaginationInfo`

| Property      | Kiểu      | Mô tả                       |
| ------------- | --------- | --------------------------- |
| `enabled`     | `boolean` | Phân trang có bật không     |
| `currentPage` | `number`  | Index trang hiện tại        |
| `totalPages`  | `number`  | Tổng số trang               |
| `itemsOnPage` | `number`  | Số item trên trang hiện tại |
| `startIndex`  | `number`  | Index bắt đầu của trang     |
| `endIndex`    | `number`  | Index kết thúc của trang    |

### `ContentDimensions`

| Property     | Kiểu     | Mô tả                    |
| ------------ | -------- | ------------------------ |
| `width`      | `number` | Chiều rộng content       |
| `height`     | `number` | Chiều cao content        |
| `offsetTop`  | `number` | Offset dọc để căn giữa   |
| `offsetLeft` | `number` | Offset ngang để căn giữa |

---

## Phát triển

```bash
git clone https://github.com/thangdevalone/meet-layout-grid.git
cd meet-layout-grid

pnpm install
pnpm build

# Chạy demo
pnpm dev
# React: http://localhost:5173
# Vue: http://localhost:5174
```

Cấu trúc dự án:

```
meet-layout-grid/
├── packages/
│   ├── core/       # Logic grid (không phụ thuộc framework)
│   ├── react/      # React component + hooks
│   └── vue/        # Vue 3 component + composables
├── examples/
│   ├── react-demo/
│   └── vue-demo/
└── package.json
```

---

## Giấy phép

MIT © [@thangdevalone](https://github.com/thangdevalone)

Xem [LICENSE](./LICENSE) để biết chi tiết.
