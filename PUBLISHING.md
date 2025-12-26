# Publishing Guide

Hướng dẫn đẩy thư viện Meet Layout Grid lên **npm** và **GitHub**.

---

## 📋 Yêu cầu

- Node.js >= 18
- pnpm (`npm install -g pnpm`)
- Tài khoản [npm](https://www.npmjs.com/)
- Tài khoản [GitHub](https://github.com/)

---

## 🚀 Bước 1: Chuẩn bị

### 1.1. Cài đặt dependencies

```bash
cd meet-layout-grid
pnpm install
```

### 1.2. Build tất cả packages

```bash
pnpm build
```

### 1.3. Kiểm tra build thành công

```bash
# Kiểm tra dist folder của mỗi package
ls packages/core/dist
ls packages/react/dist
ls packages/vue/dist
ls packages/angular/dist
```

---

## 📦 Bước 2: Đẩy lên npm

### 2.1. Đăng nhập npm

```bash
npm login
# Nhập username, password, email, OTP (nếu bật 2FA)
```

### 2.2. Tạo organization (nếu chưa có)

Vì packages dùng scope `@meet-layout-grid`, bạn cần tạo organization trên npm:

1. Truy cập https://www.npmjs.com/org/create
2. Tạo org với tên: `meet-layout-grid`
3. Hoặc đổi tên package trong `package.json` thành unscoped (ví dụ: `meet-layout-grid-core`)

### 2.3. Publish từng package

```bash
# Core package
cd packages/core
npm publish --access public

# React package
cd ../react
npm publish --access public

# Vue package
cd ../vue
npm publish --access public

# Angular package
cd ../angular
npm publish --access public
```

### 2.4. Kiểm tra trên npm

Truy cập:
- https://www.npmjs.com/package/@meet-layout-grid/core
- https://www.npmjs.com/package/@meet-layout-grid/react
- https://www.npmjs.com/package/@meet-layout-grid/vue
- https://www.npmjs.com/package/@meet-layout-grid/angular

---

## 🐙 Bước 3: Đẩy lên GitHub

### 3.1. Tạo repository trên GitHub

1. Truy cập https://github.com/new
2. Repository name: `meet-layout-grid`
3. Description: `A modern, framework-agnostic responsive grid library for meeting/video layouts`
4. Chọn **Public**
5. **Không** tick "Add README" (đã có sẵn)
6. Click **Create repository**

### 3.2. Khởi tạo Git và push

```bash
cd meet-layout-grid

# Khởi tạo git
git init

# Add tất cả files
git add .

# Commit
git commit -m "feat: initial release v1.0.0

- Core package with grid calculations and layout modes
- React integration with Motion animations
- Vue 3 integration with motion-v
- Angular integration with Motion directives
- Demo apps for React, Vue, Angular"

# Thêm remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/meet-layout-grid.git

# Đổi branch sang main
git branch -M main

# Push lên GitHub
git push -u origin main
```

### 3.3. Tạo Release trên GitHub

1. Truy cập `https://github.com/YOUR_USERNAME/meet-layout-grid/releases/new`
2. Tag: `v1.0.0`
3. Release title: `v1.0.0 - Initial Release`
4. Description:

```markdown
## 🎉 Initial Release

### Packages
- `@meet-layout-grid/core` - Core grid calculation logic
- `@meet-layout-grid/react` - React hooks and components
- `@meet-layout-grid/vue` - Vue 3 composables and components  
- `@meet-layout-grid/angular` - Angular service and directives

### Features
- 4 Layout modes: Gallery, Speaker, Spotlight, Sidebar
- Motion spring animations
- Responsive grid calculations
- TypeScript support

### Demo Apps
- React demo (port 5173)
- Vue demo (port 5174)
- Angular demo (port 4200)
```

5. Click **Publish release**

---

## 🔄 Cập nhật version sau này

### Tăng version

```bash
# Trong mỗi package, sửa version trong package.json
# Ví dụ: "version": "1.0.0" -> "version": "1.1.0"

# Hoặc dùng npm version
cd packages/core
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### Publish version mới

```bash
pnpm build
cd packages/core && npm publish
cd ../react && npm publish
cd ../vue && npm publish
cd ../angular && npm publish
```

### Commit và tag

```bash
git add .
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push origin main --tags
```

---

## 📝 Checklist

- [ ] `pnpm install` thành công
- [ ] `pnpm build` không có lỗi
- [ ] `npm login` đã đăng nhập
- [ ] Tạo npm organization `@meet-layout-grid`
- [ ] Publish 4 packages lên npm
- [ ] Tạo GitHub repository
- [ ] Push code lên GitHub
- [ ] Tạo GitHub release v1.0.0

---

## ❓ Troubleshooting

### Lỗi "Package name too similar to existing package"

Đổi tên package trong `package.json`, ví dụ:
- `@meet-layout-grid/core` → `@your-name/meet-grid-core`

### Lỗi "You must be logged in"

```bash
npm logout
npm login
```

### Lỗi "Organization not found"

Tạo organization trên npm: https://www.npmjs.com/org/create

### Lỗi permission denied khi push GitHub

```bash
# Kiểm tra remote URL
git remote -v

# Đổi sang HTTPS hoặc SSH
git remote set-url origin https://github.com/YOUR_USERNAME/meet-layout-grid.git
# hoặc
git remote set-url origin git@github.com:YOUR_USERNAME/meet-layout-grid.git
```
