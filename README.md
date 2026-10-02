# 🎓 SubDict - YouTube Subtitle Offline Dictionary & Flashcards

> **Tiện ích mở rộng (Browser Extension) tra từ điển Anh – Việt offline tốc độ cao trực tiếp trên phụ đề YouTube và mọi trang web, tích hợp Flashcard ôn tập thông minh & kho thuật ngữ chuyên ngành Khoa học Máy tính (IT / Computer Science).**

---

## 🌟 Giới thiệu

Khi xem video bài giảng kỹ thuật, lập trình hay các video tiếng Anh trên YouTube, người học thường gặp phải các rào cản:
1. Phải dừng video, mở tab mới hoặc từ điển ngoài để tra từ, làm đứt quãng mạch tiếp thu.
2. Các công cụ dịch phụ đề thông thường chỉ dịch máy theo câu rời rạc hoặc chỉ tra từng từ đơn lẻ, bỏ qua các cụm từ (phrasal verbs, idioms) và thuật ngữ chuyên ngành kỹ thuật.
3. Không có cơ chế lưu lại từ vựng vừa gặp để ôn tập một cách có hệ thống.

**SubDict** được phát triển để giải quyết triệt để các vấn đề trên:
- **100% Offline**: Chạy cơ sở dữ liệu SQLite cục bộ ngay trong trình duyệt thông qua **WebAssembly (WASM)**. Không cần mạng, không gọi API, không thu thập dữ liệu người dùng, tốc độ phản hồi tức thì (<1ms).
- **Kho từ vựng khổng lồ**: Sở hữu hơn **219.000 từ vựng**, hơn **1,5 triệu phiên âm UK/US**, bao quát từ vựng thông dụng và toàn bộ chuyên ngành **Khoa học Máy tính / Công nghệ Thông tin**.
- **Trải nghiệm YouTube hoàn hảo**: Tự động tạm dừng video khi rê chuột, nhận diện cụm từ thông minh, hỗ trợ cuộn chuột xem nghĩa và không che phụ đề ngay cả khi xem toàn màn hình (Fullscreen).
- **Lưu Flashcard tức thì**: Thêm từ vào bộ thẻ ôn tập với phím tắt `Alt + S` hoặc `Alt + D` chỉ trong 1 giây!

---

## ✨ Tính năng nổi bật

### 1. 📺 Smart HUD Subtitle trên YouTube
- **Rê chuột tra từ tức thì**: Rê chuột lên bất kỳ từ hoặc cụm từ nào trên phụ đề YouTube, video sẽ tự động tạm dừng (`pause`) và hiển thị popup giải nghĩa chi tiết. Khi rời chuột, video tự động phát tiếp (`play`).
- **Vị trí thông minh**: Khung popup luôn được tính toán hiển thị **phía trên** khung phụ đề và căn chỉnh theo từ đang hover, đảm bảo **không bao giờ che mất dòng phụ đề đang đọc**.
- **Tương thích toàn màn hình (Fullscreen)**: Tự động xuống dòng khi câu phụ đề dài, hoạt động mượt mà ở mọi độ phân giải từ cửa sổ nhỏ đến Fullscreen 4K.
- **Cuộn chuột trực tiếp (Wheel Forwarding)**: Bạn có thể lăn con trỏ chuột ngay trên từ hoặc khung phụ đề để cuộn xem toàn bộ các tầng nghĩa mà không sợ bị cuộn trang web bên ngoài hay thay đổi âm lượng YouTube.
- **Tương tác trong suốt**: Di chuột qua khung popup được tính như di chuột trên màn hình YouTube, không làm kẹt giao diện điều khiển của trình phát.

### 2. 🧠 Nhận diện cụm từ thông minh (Greedy Phrase Matching)
- Thay vì tách câu thành từng chữ đơn lẻ, thuật toán sẽ ưu tiên tìm kiếm và bắt trọn các cụm từ dài nhất trước:
  - *Cụm từ thông dụng / Thành ngữ*: `look forward to`, `give up`, `make up one's mind`, `as well as`...
  - *Thuật ngữ chuyên ngành*: `binary search tree`, `machine learning`, `relational database`, `large language model`, `event-driven architecture`...
- Các cụm từ được đánh dấu màu xanh nổi bật trên phụ đề để bạn nhận biết ngay lập tức.

### 3. 🔍 Tự động trích xuất từ gốc (Root Word / Lemmatization)
- Khi gặp các dạng biến thể ngữ pháp như quá khứ, phân từ, thì tiếp diễn (ví dụ `squared`, `running`, `matrices`, `dependencies`):
  - Hệ thống tự động phân tích và hiển thị nhãn từ gốc: `Gốc: square`.
  - Đồng thời truy xuất và hiển thị trọn vẹn toàn bộ các lớp nghĩa của từ gốc, giúp bạn nắm bắt đầy đủ ngữ nghĩa mà không cần tra lại từ nguyên mẫu.

### 4. 💻 Kho thuật ngữ Khoa học Máy tính (IT / Computer Science) chuyên sâu
Được tích hợp sẵn bộ từ điển chuyên ngành toàn diện với giải nghĩa tiếng Việt chuẩn xác và ví dụ lập trình thực tế:
- **Đa luồng & Đồng thời (Concurrency)**: `multithreading`, `concurrency`, `deadlock`, `race condition`, `thread pool`, `mutex`, `semaphore`...
- **Cấu trúc dữ liệu & Giải thuật (DSA)**: `linked list`, `binary tree`, `b-tree`, `hash table`, `stack overflow`, `recursion`, `dynamic programming`, `big o notation`...
- **Kiến trúc phần mềm & DevOps**: `kubernetes`, `docker`, `microservices`, `serverless`, `monolith`, `devops`, `ci/cd`, `middleware`, `frontend`, `backend`, `fullstack`, `refactoring`, `endpoint`, `webhook`...
- **Trí tuệ nhân tạo (AI & Machine Learning)**: `deep learning`, `neural network`, `large language model`, `prompt engineering`, `transformer`, `embedding`, `vector database`, `retrieval-augmented generation (RAG)`, `fine-tuning`, `gradient descent`, `overfitting`...
- **Cơ sở dữ liệu & Giao thức mạng**: `relational database`, `nosql`, `sharding`, `replication`, `rest api`, `graphql`, `websocket`, `cors`, `jwt`, `oauth`...

### 5. 🗂️ Hệ thống Flashcards ôn tập chuyên nghiệp
- **Thêm từ bằng phím tắt**: Khi đang tra từ trên YouTube hoặc trang web, chỉ cần bấm **`Alt + S`** hoặc **`Alt + D`** (hoặc bấm nút `☆ Lưu từ`), từ vựng kèm toàn bộ nghĩa, phiên âm và ví dụ sẽ được lưu ngay vào Flashcard.
- **Trang ôn tập Flashcard chuyên biệt**:
  - Giao diện thẻ bài hiện đại, bấm lật mặt trước (từ vựng + IPA) và mặt sau (nghĩa tiếng Việt + ví dụ).
  - Đánh giá mức độ ghi nhớ: **Khó (Hard)**, **Tốt (Good)**, **Dễ (Easy)** theo phương pháp Spaced Repetition.
  - Bộ đếm thống kê số từ đã học, thanh tìm kiếm từ vựng và nút phát âm audio chuẩn.

### 6. 🌐 Tra từ khi bôi đen trên MỌI trang web
- Khi đọc báo, tài liệu kỹ thuật, blog hay GitHub: Chỉ cần dùng chuột bôi đen từ/cụm từ bất kỳ.
- Biểu tượng tra cứu 📖 sẽ hiển thị ngay cạnh con trỏ để mở popup từ điển offline đầy đủ thông tin.

---

## 📊 So sánh thông số cơ sở dữ liệu

| Thông số | Phiên bản cũ | Phiên bản hiện tại |
| :--- | :--- | :--- |
| **Tổng số từ & cụm từ** | 104.840 | **219.404** (Gấp hơn 2 lần) |
| **Phiên âm IPA** | 108.787 | **1.516.738** (Đầy đủ UK & US) |
| **Định nghĩa tiếng Việt** | 158.318 | **327.496** |
| **Liên kết từ vựng - nghĩa** | 175.746 | **492.168** |
| **Thuật ngữ chuyên ngành IT** | Rời rạc / Thiếu | **Đầy đủ, chuẩn xác, có ví dụ** |
| **Thời gian nạp DB vào RAM** | ~50ms | **~60ms** (Siêu nhanh qua WebAssembly) |

---

## 🏗️ Cấu trúc thư mục dự án

```text
Offical_Dictionary/
│
├── manifest.json              # Cấu hình Chrome/Edge Manifest V3
├── package.json               # Cấu hình dependencies
│
├── Database/
│   └── dictionary_en_vi.db    # Cơ sở dữ liệu SQLite offline (219k từ, 1.5M phiên âm)
│
├── Lib/
│   ├── sql-wasm.js            # Trình nạp WebAssembly của SQLite (sql.js)
│   ├── sql-wasm.wasm          # File thực thi nhị phân WASM
│   └── dictionary.js          # Engine xử lý tra từ, phân tích cụm từ, trích xuất từ gốc
│
├── Background/
│   └── background.js          # Service Worker quản lý kết nối DB & đồng bộ Flashcards
│
├── Content/
│   ├── content.js             # Content Script theo dõi phụ đề YouTube, hover popup, phím tắt
│   └── content.css            # Stylesheet cho HUD phụ đề và popup nổi
│
├── Popup/
│   ├── popup.html             # Giao diện tra cứu nhanh trên thanh công cụ
│   ├── popup.css
│   └── popup.js
│
├── Flashcards/
│   ├── flashcards.html        # Giao diện ôn tập thẻ ghi nhớ chuyên sâu
│   ├── flashcards.css
│   └── flashcards.js
│
├── cs_terms_data.js           # Bộ dữ liệu thuật ngữ chuyên ngành Khoa học Máy tính
├── import_stardict.js         # Script tự động phân tích & hợp nhất StarDict vào SQLite
├── test_engine_node.js        # Kiểm thử DictionaryEngine trên môi trường Node.js
└── run_browser_test.js        # Script kiểm thử tự động trên Microsoft Edge Headless
```

---

## 🚀 Hướng dẫn cài đặt

Bạn có thể cài đặt trực tiếp vào trình duyệt **Google Chrome**, **Microsoft Edge**, **Brave**, **Cốc Cốc** hoặc bất kỳ trình duyệt nền Chromium nào:

1. **Tải mã nguồn về máy**:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   ```
2. **Mở trang quản lý tiện ích**:
   - Trên **Chrome**: Truy cập `chrome://extensions/`
   - Trên **Microsoft Edge**: Truy cập `edge://extensions/`
3. **Bật Developer Mode**:
   - Gạt công tắc **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải hoặc thanh menu bên trái.
4. **Cài đặt tiện ích**:
   - Bấm vào nút **Load unpacked** (Tải tiện ích đã giải nén).
   - Chọn thư mục dự án `Offical_Dictionary`.
5. **Hoàn tất**: Biểu tượng **SubDict** sẽ xuất hiện trên thanh công cụ trình duyệt. Bật một video tiếng Anh trên YouTube có phụ đề (CC) để trải nghiệm ngay!

---

## ⌨️ Phím tắt tiện dụng

| Phím tắt | Phạm vi | Chức năng |
| :--- | :--- | :--- |
| **`Alt + S`** hoặc **`Alt + D`** | YouTube Subtitle / Web Selection | Lưu ngay từ/cụm từ đang tra vào **Flashcard** (hoặc bấm lại để xóa) |
| **`Space`** hoặc **`Phím mũi tên lên/xuống`** | Giao diện Flashcards | Lật thẻ / Chuyển thẻ tiếp theo |
| **`Cuộn chuột (Mouse Wheel)`** | Trên từ vựng hoặc khung phụ đề | Cuộn mượt các tầng định nghĩa trong popup |

---

## 🧪 Kiểm thử tự động

Dự án đi kèm các bộ kiểm thử tự động để bảo đảm tính ổn định:

1. **Kiểm tra truy vấn từ điển & thuật ngữ Khoa học máy tính (Node.js)**:
   ```bash
   node test_engine_node.js
   ```

2. **Kiểm tra tự động trên trình duyệt thật (Edge Headless Browser Test)**:
   ```bash
   node run_browser_test.js
   ```

---

## 📄 Giấy phép (License)

Dự án được phân phối dưới giấy phép mã nguồn mở [MIT License](LICENSE).
Cơ sở dữ liệu từ điển tích hợp dữ liệu mở từ cộng đồng mã nguồn mở StarDict.
