# BookStore Buổi 10 — Câu hỏi bổ sung (mục 3 trong file doc)

Mỗi câu trả lời ngắn gọn, không quá năm dòng.

## 1. Vì sao khi đổi numColumns của FlatList phải đổi cả key? Bỏ key thì chuyện gì xảy ra?

FlatList không hỗ trợ đổi `numColumns` khi đang chạy: nó tính layout theo số cột lúc khởi tạo.
Đổi `key={String(numColumns)}` làm React huỷ FlatList cũ và dựng một FlatList mới với số cột mới.
Bỏ `key` thì React tái sử dụng đúng instance cũ, và app báo lỗi
"Changing numColumns on the fly is not supported" (hoặc layout không đổi sang 2 cột).

## 2. Dữ liệu nào nên để trong useState của màn hình, dữ liệu nào nên đưa vào Redux? Lấy ví dụ từ BookStore.

`useState` của màn hình cho dữ liệu chỉ màn đó dùng và mất đi cũng không sao:
`keyword`, `category`, `isTile`, `loading`/`refreshing` của Home.
Redux cho dữ liệu dùng chung nhiều màn và phải còn khi chuyển tab:
giỏ hàng (`cart.items`) dùng ở Detail, Cart và badge ở tab; yêu thích (`favorites.ids`)
dùng ở Detail và tab Yêu thích.

## 3. Trong createSlice được viết state.items.push(…) và found.quantity += 1. Vì sao viết như vậy được, trong khi ở component bình thường không được sửa trực tiếp state?

Vì `createSlice` dùng Immer: `state` trong reducer chỉ là một bản nháp (draft) được Immer bọc bằng Proxy,
mọi lần "sửa" đều được ghi lại rồi Immer tạo ra một state mới bất biến.
Trong component, state của `useState` là object thật: sửa trực tiếp không tạo object mới
nên React không biết state đã đổi, không render lại, và dữ liệu cũ bị làm hỏng.

## 4. selectIsFavorite(id) trả về một hàm. Vì sao viết như vậy? Danh sách yêu thích chỉ lưu id mà không lưu cả đối tượng sách thì có lợi gì?

`useSelector` cần một hàm nhận `state` và trả về dữ liệu, nên `selectIsFavorite(id)` là một
"selector factory": nó nhận `id` trước, trả về selector `(state) => state.favorites.ids.includes(id)`
để mỗi màn Detail đọc đúng trạng thái của riêng sách đó.
Chỉ lưu `id`: tránh trùng lặp dữ liệu (thông tin sách vẫn lấy từ mảng `BOOKS` — một nguồn sự thật duy nhất),
store nhẹ hơn, và khi thông tin sách đổi thì tab Yêu thích tự cập nhật theo.

## 5. BookCard dùng React.memo, còn onSelect ở Home được bọc bằng useCallback. Nếu bỏ useCallback thì React.memo còn tác dụng không? Giải thích.

Không còn tác dụng với các thẻ sách. `React.memo` so sánh nông (shallow) các props:
nếu `onSelect` là một hàm mới tạo ra ở mỗi lần render, prop đó luôn "khác" so với lần trước,
nên memo coi như props đã đổi và vẽ lại toàn bộ BookCard — đúng việc memo định tránh.
`useCallback` giữ cùng một tham chiếu hàm khi `navigation` không đổi, nên memo mới phát huy tác dụng.

## 6. (Bonus) Một createAsyncThunk có ba hành động pending, fulfilled, rejected. Mỗi hành động làm thay đổi những trường nào của state trong booksSlice?

- `pending`: `status = "loading"`, `error = null` (đang tải, xoá lỗi cũ).
- `fulfilled`: `status = "succeeded"`, `items = action.payload` (danh sách sách từ API).
- `rejected`: `status = "failed"`, `error = action.payload ?? "Không tải được dữ liệu"`
  (thông báo lỗi tiếng Việt do `rejectWithValue` gửi về).

---

## Ghi chú nộp bài

- Bản hoàn thành nằm ở `workspace/BookStore_Buoi10/BookStore_Buoi10_HoanThanh/` — đã làm xong
  Bài 10.1–10.10 và Bonus 10.11, không còn dòng `TODO BT10` nào trong code.
- `ALL_IN_ONE_HOAN_THANH.md` trong cùng thư mục: dán từng mục vào Snack theo đúng đường dẫn file.
- `config.ts` đang để `USE_API = false` (đọc mảng, mặc định để nộp bài). Chỉ đổi thành `true`
  khi đã chạy json-server (`npx json-server@0.17.4 --watch db.json --port 3000`) để kiểm tra Bài 10.11.
- Ảnh minh chứng (10.1.png … 10.10.png, 10.11a/b.png) phải chụp trên Snack theo mục 1.4 của file doc
  (thấy cả khung code lẫn khung Web preview và đồng hồ hệ thống) — không thể chụp thay bằng bản chạy local.
- Thử thách T1 (chỉ còn hàng) và T2 (sắp xếp theo giá) chưa làm — là phần cộng điểm, làm thêm khi cần.
