# Vi Vu Admin

Next.js App Router + shadcn/ui dành cho quản trị Vi Vu, chạy riêng với `trip-budget-web`. Dùng lại logo, font Manrope, màu navy/sky, gradient, VI/EN, dark/light mode và cấu trúc `src/base` / `src/features` của web hiện tại.

## Chạy local

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3001`. `CORE_SERVICE_URL` là origin của Core, mặc định `http://localhost:8866`; BFF tự thêm `/api`.

Trước khi dùng các màn quản trị:

1. Xem và áp dụng thủ công `../trip-budget/tripbudget-core/src/main/resources/db/migration/V15__admin_console.sql` theo quy trình triển khai DB. Không tự áp dụng khi chưa được cho phép. Core dùng Hibernate `validate`, không tự chạy Flyway.
2. Đặt `ADMIN_EMAILS=admin@gmail.com` trong `.env` của Core. Có thể thêm nhiều email ngăn bằng dấu phẩy.
3. Build/restart Core sau khi migration hoàn tất.
4. Đăng nhập bằng tài khoản Vi Vu đã tồn tại, đã xác thực và chấp nhận chính sách. Không có tài khoản hoặc mật khẩu mẫu; `.env` chỉ cấp quyền cho email, không tạo tài khoản.

## Chức năng

- Tổng quan: số người dùng thật theo trạng thái và nhật ký gần đây.
- Người dùng: tìm tên/email (debounce 300ms), lọc, phân trang, xem toàn bộ hồ sơ đã lưu; sửa tên/email và gỡ avatar; hiển thị phương thức đăng nhập, chính sách, ngày tạo/cập nhật.
- Một thao tác vô hiệu hóa/khôi phục duy nhất: `DELETED` chặn truy cập; `ACTIVE` / `INACTIVE` biểu thị xác thực email. `status_before_deletion` lưu trạng thái để khôi phục không vượt OTP. `BLOCKED` cũ được đọc tương thích và vẫn bị chặn, không tự sửa dữ liệu cũ.
- Đổi email yêu cầu xác thực lại và thu hồi phiên. Không đổi email quản trị hoặc gán email thuộc allowlist cho tài khoản khác. Không sửa bằng chứng chấp nhận chính sách thay người dùng.
- Phiên: chọn người dùng, xem thời điểm tạo/hết hạn, thu hồi một hoặc tất cả phiên. Redis hiện chưa có IP/thiết bị, nên không hiển thị các trường đó. Lấy theo chỉ mục người dùng, không quét Redis bằng `KEYS`.
- Cài đặt: tên console, email hỗ trợ, ngưỡng cảnh báo phiên sắp hết hạn; xem dịch vụ nào đã có cấu hình. Các trạng thái cấu hình không phải kiểm tra kết nối.
- Nhật ký: người thực hiện, hành động, đối tượng, lý do, kết quả và thời gian. Mọi thao tác sửa cần lý do.

`UserEntity` kế thừa `BaseEntity`, dùng chung ID và timestamps. `is_del` là trường chung được bổ sung với mặc định false; trạng thái vô hiệu hóa nghiệp vụ dùng `status=DELETED`.

## Kiến trúc và quyền

Browser → shared Axios → Next BFF → Core Controller → AdminService → repositories. Core kiểm tra allowlist và trạng thái tài khoản ở mọi API quản trị. Next dùng cookie HttpOnly riêng cho admin, kiểm tra Origin cho mutation và chỉ proxy danh sách đường dẫn được cho phép. Token không xuất hiện trong JSON hay localStorage.

Tài khoản quản trị được bảo vệ khỏi thao tác vô hiệu hóa. Mật khẩu/hash, refresh secret và API key không được hiển thị hoặc cho sửa trực tiếp. Thông tin xác thực và chấp nhận chính sách chỉ được cập nhật qua các luồng nghiệp vụ tương ứng.

Khóa/đổi email lưu thay đổi và audit trong transaction PostgreSQL; thu hồi Redis sau commit. Kiểm tra trạng thái tài khoản trên mỗi access request chặn quyền ngay cả khi Redis cleanup lỗi. Thu hồi phiên trực tiếp lưu audit `PENDING` trước khi gọi Redis, rồi ghi `SUCCESS`/`FAILED`; SQL và Redis không có transaction chung nên một thao tác lỗi có thể đã thu hồi một phần phiên. Tải lại dữ liệu để kiểm tra trước khi thử lại.

## Kiểm tra

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Core: `mvn -o clean test`. Khi Core đang chạy từ `target/classes` và DB chưa có migration, chạy build trên bản sao tạm để không kích hoạt devtools với schema chưa sẵn sàng.

Kiểm tra PostgreSQL tạm, từ thư mục Core:

```bash
python3 scripts/test-admin-postgres.py
```

Script chỉ cho localhost, tạo database mới tên `template_test`, nạp schema snapshot + V15 hai lần, chạy 2 kiểm tra JPA rồi xóa database do chính script tạo. Nếu database đã tồn tại, script dừng và không xóa nó. Không dùng DB ứng dụng. Browser/smoke được bỏ qua theo rule hiện tại.
