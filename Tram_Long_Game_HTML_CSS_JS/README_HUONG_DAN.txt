TRẢM LONG — GAME ANH HÙNG VS RỒNG
================================

NỘI DUNG BỘ FILE
- tran_chien.html          Giao diện trò chơi
- tran_chien.css           Thiết kế, chuyển động và hiệu ứng
- tran_chien.js            Logic chiến đấu, chỉ số, âm thanh Web Audio API
- tran_chien_anh_hung.jpg  Ảnh anh hùng (bản sao ảnh bạn cung cấp)
- tran_chien_rong.jpg      Ảnh rồng (bản sao ảnh bạn cung cấp)

CÁCH CHẠY (VS CODE)
1. Giải nén ZIP vào một thư mục. Để cả 5 file ở CÙNG một thư mục.
2. Mở thư mục đó trong VS Code.
3. Nhấp chuột phải vào tran_chien.html, chọn Open with Live Server.
4. Nhập tên, chọn Chiến Binh / Sát Thủ / Thợ Săn, bấm BẮT ĐẦU.
5. Bấm nút trên màn hình hoặc phím 1, 2, 3 để chiến đấu.
6. Nút loa góc trên phải cho phép bật/tắt âm thanh.

LƯU Ý VỀ FILE GỐC
- KHÔNG sửa/xóa/ghi đè anhhung.html và anhhung.js của bài tập.
- Game mới KHÔNG nhúng trực tiếp anhhung.js vì code gốc dùng vòng lặp
  while + prompt + alert làm trình duyệt không thể hiển thị hoạt ảnh.
- tran_chien.js kế thừa CÁC CÔNG THỨC trong anhhung.js dưới dạng chức năng
  chạy theo lượt và điều khiển qua nút bấm.
- Hai ảnh trong ZIP là bản sao, được đặt tên khác để KHÔNG ghi đè ảnh gốc.

LOGIC THAM KHẢO BÀI TẬP GỐC
- Cấp độ, XP, skillPoints, strength, agility, intel tính theo code ban đầu.
- Ba phân cấp và mức cộng trừ chỉ số được giữ nguyên.
- Rồng vẫn có 600 HP, sức mạnh 100, nhanh nhẹn 15, trí tuệ 80.
- Đòn đánh dùng Math.random(), có thể né và chí mạng.
- Để trận chiến không kết thúc trong một đòn: máu anh hùng x2; sát thương
  rồng còn 32% so với chỉ số STR; tỷ lệ né, chí mạng được cân bằng.
- TUYỆT KỸ và PHÒNG THỦ là tính năng mở rộng ngoài bài tập gốc.

HOẠT ĐỘNG HOÀN TOÀN OFFLINE
HTML + CSS + JavaScript thuần. Không có thư viện ngoài, không tải MP3,
không cần cài npm. Âm thanh được tổng hợp bằng Web Audio API.
