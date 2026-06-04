# Google Sheet Schema

## Cột và Định Nghĩa

| Cột | Kiểu | Mô tả | Ví dụ |
|-----|------|--------|-------|
| `ma_mau` | string | Mã định danh duy nhất, dùng làm slug URL | `NP-01` |
| `ten` | string | Tên đầy đủ của mẫu thiết kế | `Nhà Phố Hiện Đại 2 Tầng` |
| `loai` | enum | Loại công trình | `nha-pho` / `biet-thu` / `chung-cu` / `nha-vuon` |
| `dien_tich_dat` | number | Diện tích đất (m²) | `60` |
| `so_tang` | number | Số tầng (không kể tum) | `2` |
| `so_phong_ngu` | number | Số phòng ngủ | `3` |
| `phong_cach` | string | Phong cách kiến trúc | `hien-dai` / `co-dien` / `tan-co-dien` / `biet-thu-phap` / `bac-au` / `dia-trung-hai` / `nhat-ban` |
| `huong` | string | Hướng nhà | `dong` / `tay` / `nam` / `bac` / `dong-nam` / `tay-nam` |
| `chi_phi_xay_du_kien` | number | Chi phí xây dựng dự kiến (VND) | `890000000` |
| `gia_ban_ho_so` | number | Giá bán hồ sơ thiết kế (VND) | `4500000` |
| `anh_url` | string | URL ảnh đại diện (Google Drive hoặc URL công khai) | `https://drive.google.com/uc?id=ABC123` |
| `mo_ta` | string | Mô tả chi tiết mẫu thiết kế | `Nhà phố 2 tầng thiết kế hiện đại...` |
| `file_url` | string | URL tải file hồ sơ (Google Drive) — KHÔNG hiển thị công khai | `https://drive.google.com/uc?id=XYZ789&export=download` |
| `trang_thai` | enum | Trạng thái hiển thị | `active` / `draft` |

---

## 3 Dữ Liệu Mẫu

### Dòng 1 — Nhà Phố 2 Tầng Hiện Đại

```
ma_mau:              NP-01
ten:                 Nhà Phố Hiện Đại 2 Tầng — Mặt Tiền 5m
loai:                nha-pho
dien_tich_dat:       60
so_tang:             2
so_phong_ngu:        3
phong_cach:          hien-dai
huong:               dong-nam
chi_phi_xay_du_kien: 890000000
gia_ban_ho_so:       4500000
anh_url:             https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop
mo_ta:               Mẫu nhà phố 2 tầng thiết kế hiện đại tối giản với mặt tiền 5m. Tầng 1 gồm phòng khách liên thông bếp, 1 phòng ngủ phụ và vệ sinh riêng. Tầng 2 có 2 phòng ngủ chính với ban công riêng, phòng thờ và sân thượng. Thiết kế tận dụng ánh sáng tự nhiên tối đa, hệ cửa kính lớn. Phù hợp với lô đất mặt phố 4-6m.
file_url:            https://drive.google.com/uc?id=SAMPLE_FILE_ID_01&export=download
trang_thai:          active
```

### Dòng 2 — Biệt Thự Vườn 3 Tầng Cổ Điển

```
ma_mau:              BT-01
ten:                 Biệt Thự Vườn Cổ Điển Pháp 3 Tầng
loai:                biet-thu
dien_tich_dat:       250
so_tang:             3
so_phong_ngu:        5
phong_cach:          biet-thu-phap
huong:               nam
chi_phi_xay_du_kien: 4500000000
gia_ban_ho_so:       12000000
anh_url:             https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop
mo_ta:               Biệt thự vườn 3 tầng phong cách Pháp cổ điển sang trọng, phù hợp với lô đất từ 200-300m². Tầng trệt rộng rãi với phòng khách, phòng bếp kiểu mở, phòng ăn, phòng ngủ khách. Tầng 2-3 có 4 phòng ngủ suite đầy đủ, phòng làm việc, ban công nhìn ra vườn. Tầng mái có terrace và hồ bơi mini. Hệ thống cột, vòm và chi tiết đắp nổi chuẩn kiến trúc Pháp.
file_url:            https://drive.google.com/uc?id=SAMPLE_FILE_ID_02&export=download
trang_thai:          active
```

### Dòng 3 — Nhà Phố 3 Tầng Tân Cổ Điển

```
ma_mau:              NP-02
ten:                 Nhà Phố Tân Cổ Điển 3 Tầng — Mặt Tiền 6m
loai:                nha-pho
dien_tich_dat:       80
so_tang:             3
so_phong_ngu:        4
phong_cach:          tan-co-dien
huong:               tay-nam
chi_phi_xay_du_kien: 1800000000
gia_ban_ho_so:       6000000
anh_url:             https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop
mo_ta:               Nhà phố 3 tầng phong cách tân cổ điển với mặt tiền 6m, thiết kế cân đối sang trọng. Tầng 1 có phòng khách + bếp mở, tầng 2 có 2 phòng ngủ master suite, tầng 3 có 2 phòng ngủ phụ + phòng thờ, sân thượng. Chi tiết cornice, cột tròn và cửa sổ vòm trang trí mặt tiền. Nội thất phòng khách có trần thạch cao trang trí, phù hợp với gia đình 4-5 người.
file_url:            https://drive.google.com/uc?id=SAMPLE_FILE_ID_03&export=download
trang_thai:          active
```

---

## Hướng Dẫn Thêm Dữ Liệu

1. Mở Google Sheet của bạn
2. Thêm dòng mới với đầy đủ 14 cột theo đúng thứ tự trên
3. Đặt `trang_thai = draft` nếu chưa sẵn sàng hiển thị
4. Đặt `trang_thai = active` để mẫu hiển thị trên website
5. Trigger Vercel rebuild (xem README.md) để cập nhật website

## Lưu Ý Quan Trọng

- `file_url`: Đây là URL tải file hồ sơ thực tế — **không bao giờ** xuất hiện trong HTML công khai. Chỉ được đọc từ server khi khách hàng có token hợp lệ.
- `anh_url`: URL ảnh an toàn để nhúng vào HTML. Nên dùng Google Drive public link hoặc Cloudinary.
- `ma_mau`: Không được chứa ký tự đặc biệt hay dấu cách — chỉ dùng chữ hoa, số và gạch ngang (ví dụ: `NP-01`, `BT-02`).
- `gia_ban_ho_so` và `chi_phi_xay_du_kien`: Nhập số nguyên (VND), không dùng dấu phẩy hay ký tự khác.
