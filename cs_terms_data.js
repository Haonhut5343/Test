/**
 * Comprehensive Computer Science, Software Engineering, AI/ML, and DevOps Terminology
 * Provides high-accuracy Vietnamese definitions, standard POS, UK/US IPAs, and technical examples.
 */

const csTerms = [
  // --- Concurrency & Threading ---
  {
    word: "multithreading",
    ipa: "/ˌmʌl.tiˈθred.ɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Kỹ thuật đa luồng; khả năng của một hệ điều hành hoặc phần mềm thực thi nhiều luồng tác vụ song song trong cùng một tiến trình.",
    example: "Multithreading helps improve the responsiveness of user interfaces and backend servers."
  },
  {
    word: "concurrency",
    ipa: "/kənˈkɜː.rən.si/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Tính đồng thời; khả năng quản lý và thực hiện nhiều tác vụ trong các khoảng thời gian xen kẽ nhau mà không nhất thiết phải chạy song song tuyệt đối.",
    example: "Go handles concurrency using lightweight goroutines and channels."
  },
  {
    word: "parallelism",
    ipa: "/ˈpær.ə.lel.ɪ.zəm/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Tính song song; việc thực thi đồng thời nhiều tác vụ trên nhiều lõi vi xử lý vật lý hoặc nhiều CPU riêng biệt.",
    example: "Parallelism achieves high performance for heavy computing tasks like image processing."
  },
  {
    word: "deadlock",
    ipa: "/ˈded.lɑːk/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Tắc nghẽn giam lỏng; trạng thái hai hoặc nhiều tiến trình dừng hẳn vì mỗi tiến trình đều chờ tài nguyên mà tiến trình kia đang nắm giữ.",
    example: "Avoid deadlock by acquiring locks in a strict predefined order."
  },
  {
    word: "race condition",
    ipa: "/ˈreɪs kənˌdɪʃ.ən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Tranh đoạt tài nguyên (race condition); lỗi phát sinh khi kết quả của chương trình phụ thuộc vào thứ tự thực thi không xác định của các luồng.",
    example: "A mutex can prevent race conditions when updating shared state."
  },
  {
    word: "thread pool",
    ipa: "/ˈθred ˌpuːl/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Bể luồng; tập hợp các luồng được khởi tạo sẵn sàng nhận tác vụ nhằm giảm chi phí tạo và hủy luồng liên tục.",
    example: "The web server uses a thread pool of 50 workers to handle incoming HTTP requests."
  },
  {
    word: "mutex",
    ipa: "/ˈmjuː.teks/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Khóa loại trừ tương hỗ (Mutual Exclusion); đối tượng đồng bộ hóa chỉ cho phép một luồng duy nhất truy cập vào phần găng tại một thời điểm.",
    example: "Lock the mutex before writing to the shared cache."
  },
  {
    word: "semaphore",
    ipa: "/ˈsem.ə.fɔːr/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Đèn báo đồng bộ; biến điều khiển số lượng tiến trình hoặc luồng được phép truy cập vào một tài nguyên giới hạn.",
    example: "A counting semaphore allows at most 5 concurrent database connections."
  },

  // --- Data Structures & Algorithms ---
  {
    word: "data structure",
    ipa: "/ˈdeɪ.tə ˌstrʌk.tʃɚ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Cấu trúc dữ liệu; cách tổ chức, lưu trữ và quản lý dữ liệu hiệu quả trong bộ nhớ máy tính để dễ dàng thao tác.",
    example: "Choosing the right data structure can drastically reduce execution time."
  },
  {
    word: "linked list",
    ipa: "/ˌlɪŋkt ˈlɪst/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cấu trúc dữ liệu) Danh sách liên kết; tập hợp tuần tự các nút dữ liệu, trong đó mỗi nút chứa giá trị và con trỏ trỏ tới nút kế tiếp.",
    example: "Inserting at the beginning of a singly linked list takes O(1) time."
  },
  {
    word: "binary tree",
    ipa: "/ˌbaɪ.nə.ri ˈtriː/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cấu trúc dữ liệu) Cây nhị phân; cấu trúc dữ liệu hình cây phi tuyến trong đó mỗi nút có tối đa hai nút con (nút con trái và nút con phải).",
    example: "Traversing a binary tree in-order prints elements in sorted order if it is a BST."
  },
  {
    word: "binary search tree",
    ipa: "/ˌbaɪ.nə.ri ˈsɜːrtʃ ˌtriː/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cấu trúc dữ liệu) Cây tìm kiếm nhị phân (BST); cây nhị phân trong đó nút con trái luôn nhỏ hơn nút cha và nút con phải luôn lớn hơn nút cha.",
    example: "A balanced binary search tree provides O(log n) lookup and insertion."
  },
  {
    word: "b-tree",
    ipa: "/ˈbiːˌtriː/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cấu trúc dữ liệu) Cây B; cấu trúc cây tìm kiếm tự cân bằng tối ưu cho việc đọc/ghi các khối dữ liệu lớn, được ứng dụng rộng rãi trong hệ quản trị cơ sở dữ liệu và hệ thống tệp.",
    example: "Database indexes are commonly implemented using B-Tree data structures."
  },
  {
    word: "hash table",
    ipa: "/ˈhæʃ ˌteɪ.bəl/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cấu trúc dữ liệu) Bảng băm; cấu trúc lưu trữ cặp khóa - giá trị dựa trên hàm băm để tính toán chỉ mục lưu trữ với thời gian tra cứu trung bình O(1).",
    example: "Hash tables resolve collisions using chaining or open addressing."
  },
  {
    word: "stack overflow",
    ipa: "/ˌstæk ˈoʊ.vɚ.floʊ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Tràn ngăn xếp; lỗi nghiêm trọng xảy ra khi kích thước bộ nhớ vùng stack bị đầy vượt ngưỡng, thường do đệ quy vô hạn.",
    example: "Infinite recursion without a base case will trigger a stack overflow error."
  },
  {
    word: "buffer overflow",
    ipa: "/ˌbʌf.ɚ ˈoʊ.vɚ.floʊ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(An ninh mạng) Tràn bộ đệm; lỗ hổng bảo mật khi dữ liệu ghi vào vùng đệm bộ nhớ vượt quá sức chứa được phân bổ, ghi đè lên bộ nhớ liền kề.",
    example: "Modern languages prevent buffer overflow attacks by doing automatic bounds checking."
  },
  {
    word: "binary search",
    ipa: "/ˌbaɪ.nə.ri ˈsɜːrtʃ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Thuật toán) Tìm kiếm nhị phân; thuật toán tìm kiếm phần tử trên danh sách đã sắp xếp bằng cách liên tục chia đôi khoảng tìm kiếm, đạt độ phức tạp O(log n).",
    example: "Binary search requires the input array to be sorted beforehand."
  },
  {
    word: "recursion",
    ipa: "/rɪˈkɜːr.ʒən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Thuật toán / Lập trình) Đệ quy; phương pháp giải quyết bài toán trong đó một hàm tự gọi lại chính nó với các tham số thu nhỏ dần về trường hợp cơ sở.",
    example: "The Fibonacci sequence can be computed using recursion or dynamic programming."
  },
  {
    word: "dynamic programming",
    ipa: "/daɪˌnæm.ɪk ˈproʊ.ɡræm.ɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Thuật toán) Quy hoạch động; kỹ thuật giải quyết bài toán phức tạp bằng cách chia nhỏ thành các bài toán con trùng lặp và lưu trữ kết quả để không phải tính lại.",
    example: "Dynamic programming reduces exponential time to polynomial time via memoization."
  },
  {
    word: "big o notation",
    ipa: "/ˌbɪɡ ˈoʊ noʊˌteɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Ký hiệu Big-O; ký hiệu toán học mô tả tiệm cận trên của thời gian thực thi hoặc dung lượng bộ nhớ thuật toán khi kích thước đầu vào tăng dần.",
    example: "Binary search runs in O(log n) time complexity in Big O notation."
  },
  {
    word: "time complexity",
    ipa: "/ˈtaɪm kəmˌplek.sə.t̬i/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Độ phức tạp thời gian; thước đo lượng thời gian mà một thuật toán cần để chạy hoàn thành dựa trên số lượng phần tử đầu vào.",
    example: "Merge sort has a guaranteed time complexity of O(n log n)."
  },
  {
    word: "space complexity",
    ipa: "/ˈspeɪs kəmˌplek.sə.t̬i/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Độ phức tạp không gian; thước đo tổng dung lượng bộ nhớ máy tính mà một thuật toán sử dụng trong suốt quá trình thực thi.",
    example: "Recursive algorithms often have O(n) space complexity due to the call stack."
  },

  // --- Software Engineering & DevOps ---
  {
    word: "kubernetes",
    ipa: "/ˌkuː.bɚˈnet.iːz/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Điện toán đám mây) Kubernetes (k8s); nền tảng mã nguồn mở tự động hóa việc triển khai, mở rộng quy mô và quản lý các ứng dụng đóng gói container.",
    example: "Kubernetes coordinates container clusters across multiple cloud servers."
  },
  {
    word: "docker",
    ipa: "/ˈdɑː.kɚ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Điện toán đám mây / DevOps) Nền tảng container hóa mã nguồn mở cho phép đóng gói ứng dụng và tất cả thư viện phụ thuộc thành một container độc lập chạy trên mọi môi trường.",
    example: "Docker containers ensure consistency between local development and production environments."
  },
  {
    word: "microservice",
    ipa: "/ˈmaɪ.kroʊˌsɜːr.vɪs/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kiến trúc phần mềm) Vi dịch vụ; một dịch vụ độc lập, nhỏ gọn thực hiện một chức năng nghiệp vụ chuyên biệt trong kiến trúc microservices.",
    example: "Each microservice communicates via lightweight protocols such as HTTP REST or gRPC."
  },
  {
    word: "microservices",
    ipa: "/ˈmaɪ.kroʊˌsɜːr.vɪs.ɪz/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kiến trúc phần mềm) Kiến trúc vi dịch vụ; phong cách kiến trúc phân rã ứng dụng thành một tập hợp các dịch vụ nhỏ, triển khai độc lập và ghép nối lỏng lẻo.",
    example: "Migrating from a monolith to microservices enabled teams to deploy features independently."
  },
  {
    word: "monolith",
    ipa: "/ˈmɑː.nə.lɪθ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kiến trúc phần mềm) Ứng dụng khối đơn (Monolith); mô hình phần mềm trong đó toàn bộ giao diện, logic nghiệp vụ và truy cập cơ sở dữ liệu được xây dựng trong một khối mã nguồn duy nhất.",
    example: "Starting with a modular monolith is often easier than managing dozens of microservices."
  },
  {
    word: "serverless",
    ipa: "/ˈsɜːr.vɚ.ləs/",
    region: "US",
    pos: "A",
    posLabel: "Tính từ",
    definition: "(Điện toán đám mây) Không máy chủ; mô hình điện toán đám mây trong đó nhà cung cấp đám mây tự động cấp phát và quản lý hạ tầng máy chủ, người dùng chỉ trả tiền theo lượt chạy hàm.",
    example: "AWS Lambda provides a serverless platform for running event-driven backend functions."
  },
  {
    word: "devops",
    ipa: "/ˈdev.ɑːps/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Công nghệ thông tin) DevOps; sự kết hợp giữa phát triển phần mềm (Dev) và vận hành hệ thống (Ops) nhằm rút ngắn vòng đời phát triển và liên tục phân phối sản phẩm chất lượng cao.",
    example: "DevOps practices emphasize CI/CD pipelines, automated testing, and infrastructure monitoring."
  },
  {
    word: "ci/cd",
    ipa: "/ˌsiː.aɪ ˌsiːˈdiː/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kỹ thuật phần mềm) Tích hợp liên tục và Phân phối/Triển khai liên tục (Continuous Integration / Continuous Delivery/Deployment); quy trình tự động hóa kiểm thử, đóng gói và phát hành mã nguồn.",
    example: "GitHub Actions and GitLab CI provide automated CI/CD pipelines."
  },
  {
    word: "middleware",
    ipa: "/ˈmɪd.əl.wer/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Phần mềm) Phần mềm trung gian; tầng phần mềm nằm giữa hệ điều hành / ứng dụng và mạng, hoặc giữa router và controller trong web server để xử lý trước yêu cầu.",
    example: "Authentication middleware verifies JWT tokens before passing requests to route handlers."
  },
  {
    word: "frontend",
    ipa: "/ˈfrʌnt.end/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Phát triển web / Phần mềm) Giao diện người dùng; phần tương tác trực tiếp với người dùng của một trang web hoặc ứng dụng (thường dùng HTML, CSS, JavaScript, React, Vue).",
    example: "The frontend was built with React and Tailwind CSS."
  },
  {
    word: "backend",
    ipa: "/ˈbæk.end/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Phát triển phần mềm) Phần phụ trợ máy chủ; phần xử lý logic nghiệp vụ, kết nối cơ sở dữ liệu và xử lý bảo mật phía máy chủ của ứng dụng.",
    example: "The backend is powered by Node.js and PostgreSQL."
  },
  {
    word: "fullstack",
    ipa: "/ˈfʊl.stæk/",
    region: "US",
    pos: "A",
    posLabel: "Tính từ",
    definition: "(Phát triển phần mềm) Toàn ngăn xếp; khả năng làm việc trên cả tầng giao diện (frontend) và tầng máy chủ, cơ sở dữ liệu (backend).",
    example: "A fullstack developer designs user interfaces and manages server-side APIs."
  },
  {
    word: "refactoring",
    ipa: "/riːˈfæk.tɚ.ɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kỹ thuật phần mềm) Tái cấu trúc mã nguồn; việc chỉnh sửa và cải thiện cấu trúc bên trong của mã nguồn để nâng cao tính dễ đọc, bảo trì mà không làm thay đổi hành vi bên ngoài.",
    example: "Code refactoring simplified the complex conditional logic into a strategy pattern."
  },
  {
    word: "endpoint",
    ipa: "/ˈend.pɔɪnt/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Mạng / API) Điểm cuối API; địa chỉ URL cụ thể mà một client gửi yêu cầu HTTP (GET, POST, PUT, DELETE) đến để tương tác với dịch vụ web.",
    example: "The `/api/v1/users` endpoint returns a list of active user accounts."
  },
  {
    word: "webhook",
    ipa: "/ˈweb.hʊk/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Mạng / Web) Cơ chế phản hồi tức thời qua HTTP (reverse API); máy chủ tự động gửi thông báo dạng HTTP POST đến địa chỉ URL được cấu hình sẵn khi có sự kiện diễn ra.",
    example: "Stripe sends a webhook notification when a customer's payment succeeds."
  },
  {
    word: "bytecode",
    ipa: "/ˈbaɪt.koʊd/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Mã byte; dạng mã trung gian sinh ra bởi trình biên dịch (như Java hoặc Python), được thiết kế để thực thi hiệu quả trên máy ảo (như JVM).",
    example: "Java source code is compiled into bytecode stored in `.class` files."
  },
  {
    word: "tokenization",
    ipa: "/ˌtoʊ.kən.aɪˈzeɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Xử lý ngôn ngữ tự nhiên / An ninh mạng) Quá trình tách văn bản thành các đơn vị từ/ký tự (tokens); hoặc quá trình thay thế dữ liệu nhạy cảm bằng một chuỗi mã định danh ngẫu nhiên (token).",
    example: "Tokenization splits a prompt into subwords before processing by a language model."
  },
  {
    word: "load balancing",
    ipa: "/ˈloʊd ˌbæl.ən.sɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Mạng / Hệ thống phân tán) Cân bằng tải; kỹ thuật phân phối lưu lượng truy cập mạng đều giữa nhiều máy chủ nhằm tối ưu hiệu năng và tránh quá tải.",
    example: "NGINX provides efficient load balancing across backend application servers."
  },
  {
    word: "virtual machine",
    ipa: "/ˌvɜːr.tʃu.əl məˈʃiːn/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Điện toán) Máy ảo (VM); môi trường mô phỏng phần cứng máy tính độc lập chạy một hệ điều hành riêng biệt trên một máy chủ vật lý.",
    example: "Virtual machines isolate applications and prevent host contamination."
  },
  {
    word: "distributed system",
    ipa: "/dɪˈstrɪb.jə.t̬ɪd ˌsɪs.təm/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Hệ thống thông tin) Hệ thống phân tán; mạng lưới nhiều máy tính độc lập kết nối với nhau và phối hợp hoạt động giống như một hệ thống thống nhất đối với người dùng.",
    example: "Distributed systems must handle network partitions and consistency tradeoffs."
  },
  {
    word: "garbage collection",
    ipa: "/ˈɡɑːr.bɪdʒ kəˌlek.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Thu gom rác tự động; cơ chế quản lý bộ nhớ tự động phát hiện và giải phóng vùng nhớ không còn được tham chiếu trong chương trình.",
    example: "Java and JavaScript feature automated garbage collection to prevent memory leaks."
  },
  {
    word: "memory leak",
    ipa: "/ˈmem.ə.ri ˌliːk/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Lập trình phần mềm) Rò rỉ bộ nhớ; lỗi xảy ra khi vùng nhớ đã cấp phát không còn sử dụng nhưng không được giải phóng, làm cạn kiệt tài nguyên RAM theo thời gian.",
    example: "Detached DOM elements and forgotten event listeners cause memory leaks in single-page apps."
  },
  {
    word: "dependency injection",
    ipa: "/dɪˈpen.dən.si ɪnˌdʒek.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Mẫu thiết kế) Tiêm phụ thuộc (DI); kỹ thuật truyền các đối tượng phụ thuộc từ bên ngoài vào một lớp thay vì để lớp tự khởi tạo, giúp giảm sự gắn kết và dễ dàng viết unit test.",
    example: "Spring and NestJS utilize dependency injection heavily for service management."
  },
  {
    word: "inversion of control",
    ipa: "/ɪnˈvɜːr.ʒən əv kənˈtroʊl/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kỹ thuật phần mềm) Đảo ngược quyền điều khiển (IoC); nguyên lý thiết kế trong đó luồng điều khiển của ứng dụng do framework điều hành thay vì mã tùy biến của lập trình viên.",
    example: "Inversion of control allows frameworks to handle lifecycle events automatically."
  },
  {
    word: "polymorphism",
    ipa: "/ˌpɑː.liˈmɔːr.fɪ.zəm/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Lập trình hướng đối tượng) Tính đa hình; khả năng một đối tượng hoặc phương thức thể hiện dưới nhiều hình thái khác nhau thông qua việc ghi đè (override) hoặc nạp chồng (overload).",
    example: "Polymorphism lets a function accept any class that implements the `Shape` interface."
  },
  {
    word: "encapsulation",
    ipa: "/ɪnˌkæp.səˈleɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Lập trình hướng đối tượng) Tính đóng gói; việc đóng gói dữ liệu nội bộ và các phương thức thao tác trên dữ liệu đó trong cùng một đối tượng, che giấu chi tiết cài đặt qua access modifiers.",
    example: "Encapsulation prevents direct mutation of private fields from outside the class."
  },
  {
    word: "inheritance",
    ipa: "/ɪnˈher.ɪ.təns/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Lập trình hướng đối tượng) Tính kế thừa; cơ chế cho phép một lớp con thừa hưởng các thuộc tính và phương thức từ một lớp cha có sẵn.",
    example: "Inheritance promotes code reuse by sharing core logic among subclasses."
  },
  {
    word: "abstraction",
    ipa: "/æbˈstræk.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Khoa học máy tính) Tính trừu tượng; nguyên lý ẩn đi các chi tiết triển khai phức tạp và chỉ phơi bày giao diện đơn giản, cần thiết cho người dùng hoặc module khác tương tác.",
    example: "Abstraction hides the complex SQL queries behind simple repository methods."
  },
  {
    word: "unit testing",
    ipa: "/ˈjuː.nɪt ˌtes.tɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kiểm thử phần mềm) Kiểm thử đơn vị; phương pháp kiểm tra tự động các khối mã nguồn nhỏ nhất (như hàm hoặc phương thức) để đảm bảo chúng hoạt động đúng như mong đợi.",
    example: "Jest and Mocha are popular frameworks for unit testing JavaScript applications."
  },
  {
    word: "clean code",
    ipa: "/ˌkliːn ˈkoʊd/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kỹ nghệ phần mềm) Mã nguồn sạch; mã nguồn được viết rõ ràng, dễ đọc, dễ hiểu, dễ bảo trì và mở rộng bởi bất kỳ lập trình viên nào.",
    example: "Writing clean code requires meaningful variable names and small focused functions."
  },
  {
    word: "code smell",
    ipa: "/ˈkoʊd ˌsmel/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Kỹ nghệ phần mềm) Dấu hiệu mã xấu; đặc điểm trong cấu trúc mã nguồn cảnh báo về nguy cơ thiết kế kém hoặc lỗi tiềm ẩn cần được tái cấu trúc.",
    example: "Duplicated code and overly long functions are common code smells."
  },
  {
    word: "technical debt",
    ipa: "/ˌtek.nɪ.kəl ˈdet/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Quản lý dự án phần mềm) Nợ kỹ thuật; chi phí ngầm tích lũy trong tương lai khi đội ngũ lập trình chọn giải pháp tạm thời, chắp vá thay vì thiết kế kiến trúc chuẩn mực.",
    example: "Paying down technical debt requires dedicated sprints for refactoring and test coverage."
  },

  // --- AI, ML & NLP ---
  {
    word: "machine learning",
    ipa: "/məˈʃiːn ˌlɜːr.nɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Trí tuệ nhân tạo) Học máy; lĩnh vực trí tuệ nhân tạo tập trung xây dựng các thuật toán có khả năng tự động học hỏi và cải thiện hiệu năng từ dữ liệu mà không cần lập trình tường minh từng bước.",
    example: "Machine learning models classify spam emails based on historical training data."
  },
  {
    word: "deep learning",
    ipa: "/ˌdiːp ˈlɜːr.nɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Trí tuệ nhân tạo) Học sâu; nhánh của học máy sử dụng mạng nơ-ron nhân tạo nhiều lớp (deep neural networks) để mô phỏng khả năng xử lý thông tin phức tạp như nhận diện giọng nói và hình ảnh.",
    example: "Deep learning models excel at computer vision and natural language understanding."
  },
  {
    word: "neural network",
    ipa: "/ˌnʊr.əl ˈnet.wɜːrk/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Trí tuệ nhân tạo) Mạng nơ-ron nhân tạo; mô hình tính toán lấy cảm hứng từ cấu trúc mạng thần kinh sinh học, gồm các nút (nơ-ron) kết nối có trọng số.",
    example: "A convolutional neural network is designed for analyzing visual imagery."
  },
  {
    word: "large language model",
    ipa: "/ˌlɑːrdʒ ˈlæŋ.ɡwɪdʒ ˌmɑː.dəl/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Trí tuệ nhân tạo) Mô hình ngôn ngữ lớn (LLM); mô hình học sâu với hàng tỷ tham số được huấn luyện trên lượng dữ liệu văn bản khổng lồ để hiểu và sinh văn bản tự nhiên.",
    example: "Modern chatbots are built on top of large language models like GPT and Gemini."
  },
  {
    word: "prompt engineering",
    ipa: "/ˈprɑːmpt ˌen.dʒəˌnɪr.ɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Trí tuệ nhân tạo) Kỹ nghệ câu lệnh; phương pháp thiết kế và tinh chỉnh văn bản đầu vào (prompt) để hướng dẫn mô hình AI tạo ra câu trả lời chính xác, tối ưu nhất.",
    example: "Prompt engineering techniques like few-shot prompting improve model accuracy."
  },
  {
    word: "transformer",
    ipa: "/trænsˈfɔːr.mɚ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Trí tuệ nhân tạo) Kiến trúc Transformer; kiến trúc mạng học sâu dựa trên cơ chế tự chú ý (self-attention), nền tảng cốt lõi của các mô hình LLM hiện đại.",
    example: "The Transformer architecture processes entire sequences in parallel instead of sequentially."
  },
  {
    word: "embedding",
    ipa: "/ɪmˈbed.ɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Xử lý ngôn ngữ tự nhiên / AI) Phép nhúng vector; việc biểu diễn từ ngữ, câu văn hoặc hình ảnh dưới dạng một vector số thực trong không gian nhiều chiều phản ánh mối liên hệ ngữ nghĩa.",
    example: "Text embeddings capture semantic similarity between different phrases."
  },
  {
    word: "vector database",
    ipa: "/ˈvek.tɚ ˌdeɪ.tə.beɪs/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cơ sở dữ liệu) Cơ sở dữ liệu vector; hệ quản trị cơ sở dữ liệu chuyên biệt lưu trữ và tìm kiếm tương đồng trên các vector đa chiều theo khoảng cách cosine hoặc Euclidean.",
    example: "Vector databases like Pinecone and Chroma enable fast semantic search for RAG systems."
  },
  {
    word: "retrieval-augmented generation",
    ipa: "/rɪˈtriː.vəl ɔːɡˈmen.tɪd ˌdʒen.əˈreɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Trí tuệ nhân tạo) Sinh tăng cường truy xuất (RAG); kỹ thuật kết hợp truy vấn tài liệu bên ngoài với mô hình ngôn ngữ lớn để cung cấp thông tin chính xác, cập nhật.",
    example: "RAG reduces hallucinations by grounding AI responses in verified company documents."
  },
  {
    word: "hallucination",
    ipa: "/həˌluː.səˈneɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Trí tuệ nhân tạo) Hiện tượng ảo giác của AI; tình trạng mô hình ngôn ngữ tự tạo ra thông tin sai lệch hoặc bịa đặt nhưng trình bày với giọng điệu rất thuyết phục.",
    example: "Strict temperature settings and verification steps help prevent AI hallucination."
  },
  {
    word: "fine-tuning",
    ipa: "/ˈfaɪn ˌtuː.nɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Học máy) Tinh chỉnh mô hình; việc tiếp tục huấn luyện một mô hình AI tiền huấn luyện trên tập dữ liệu chuyên ngành cụ thể nhằm tối ưu hóa hiệu năng cho tác vụ đó.",
    example: "Fine-tuning an open-source model allows it to specialize in medical question answering."
  },
  {
    word: "loss function",
    ipa: "/ˈlɑːs ˌfʌŋk.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Học máy) Hàm mất mát; hàm toán học đo lường độ chênh lệch giữa giá trị dự đoán của mô hình và giá trị thực tế của dữ liệu trong quá trình huấn luyện.",
    example: "Mean Squared Error is a popular loss function for linear regression models."
  },
  {
    word: "gradient descent",
    ipa: "/ˌɡreɪ.di.ənt dɪˈsent/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Thuật toán / Học máy) Hạ độ dốc; thuật toán tối ưu hóa lặp lại các bước ngược chiều với vector gradient để tìm điểm cực tiểu của hàm mất mát.",
    example: "Stochastic gradient descent updates model weights after each training batch."
  },
  {
    word: "backpropagation",
    ipa: "/ˌbæk.prɑːp.əˈɡeɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Học máy) Thuật toán lan truyền ngược; phương pháp tính đạo hàm riêng của hàm mất mát theo từng trọng số trong mạng nơ-ron từ tầng đầu ra về tầng đầu vào để cập nhật trọng số.",
    example: "Backpropagation makes training multi-layer neural networks computationally practical."
  },
  {
    word: "overfitting",
    ipa: "/ˌoʊ.vɚˈfɪt.ɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Học máy) Hiện tượng quá khớp; tình trạng mô hình học quá kỹ các chi tiết và nhiễu của tập dữ liệu huấn luyện khiến nó dự đoán kém trên tập dữ liệu mới.",
    example: "Dropout layers and regularization techniques are used to combat overfitting."
  },
  {
    word: "underfitting",
    ipa: "/ˌʌn.dɚˈfɪt.ɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Học máy) Hiện tượng chưa khớp; tình trạng mô hình quá đơn giản không thể nắm bắt được quy luật tiềm ẩn trong dữ liệu huấn luyện.",
    example: "Underfitting can be resolved by increasing model complexity and training for more epochs."
  },

  // --- Databases & Cloud ---
  {
    word: "relational database",
    ipa: "/rɪˌleɪ.ʃən.əl ˈdeɪ.tə.beɪs/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cơ sở dữ liệu) Cơ sở dữ liệu quan hệ (RDBMS); hệ thống quản lý dữ liệu dưới dạng các bảng gồm hàng và cột với các khóa chính và khóa ngoại liên kết với nhau.",
    example: "PostgreSQL and MySQL are leading relational database systems."
  },
  {
    word: "nosql",
    ipa: "/ˌnoʊ ˈes.kjuː.el/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cơ sở dữ liệu) Cơ sở dữ liệu phi quan hệ (NoSQL); hệ quản trị cơ sở dữ liệu không dùng cấu trúc bảng truyền thống, lưu trữ dữ liệu dạng tài liệu (document), cặp khóa-giá trị, đồ thị.",
    example: "MongoDB is a document-oriented NoSQL database favored for flexible schemas."
  },
  {
    word: "sharding",
    ipa: "/ˈʃɑːr.dɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cơ sở dữ liệu) Phân mảnh dữ liệu; kỹ thuật phân vùng ngang cơ sở dữ liệu thành nhiều mảnh nhỏ (shards) lưu trữ trên các máy chủ khác nhau để mở rộng quy mô.",
    example: "Database sharding distributes user data across servers based on user ID ranges."
  },
  {
    word: "replication",
    ipa: "/ˌrep.lɪˈkeɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Hệ thống phân tán) Sao chép dữ liệu; việc đồng bộ dữ liệu liên tục từ máy chủ chính (primary) sang một hoặc nhiều máy chủ dự phòng (replicas) để tăng tính sẵn sàng và chịu lỗi.",
    example: "Read replication allows scaling read-heavy web traffic across multiple replicas."
  },
  {
    word: "schema migration",
    ipa: "/ˈskiː.mə maɪˌɡreɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cơ sở dữ liệu) Chuyển đổi cấu trúc cơ sở dữ liệu; việc quản lý các phiên bản thay đổi cấu trúc bảng, cột, khóa của cơ sở dữ liệu một cách có kiểm soát và an toàn.",
    example: "Prisma and Flyway handle database schema migrations through automated versioned scripts."
  },
  {
    word: "primary key",
    ipa: "/ˌpraɪ.mer.i ˈkiː/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cơ sở dữ liệu) Khóa chính; một hoặc một tập hợp các trường định danh duy nhất mỗi bản ghi trong bảng cơ sở dữ liệu, không được phép trùng lặp và không chứa giá trị null.",
    example: "Every record in the users table has a unique primary key ID."
  },
  {
    word: "foreign key",
    ipa: "/ˌfɔːr.ən ˈkiː/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cơ sở dữ liệu) Khóa ngoại; trường trong một bảng liên kết tham chiếu tới khóa chính của một bảng khác nhằm đảm bảo tính toàn vẹn dữ liệu quan hệ.",
    example: "The `user_id` column in the orders table acts as a foreign key referencing the users table."
  },
  {
    word: "indexing",
    ipa: "/ˈɪn.dek.sɪŋ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Cơ sở dữ liệu) Tạo chỉ mục; cấu trúc dữ liệu bổ trợ (như B-Tree hoặc Hash) giúp tăng tốc độ tìm kiếm và lọc dữ liệu trên các cột được truy vấn thường xuyên.",
    example: "Creating an index on the email column speeds up login lookup queries."
  },

  // --- Web & Network Protocols ---
  {
    word: "rest api",
    ipa: "/ˌrest eɪ.piːˈaɪ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Phát triển web) Giao diện lập trình ứng dụng RESTful; phong cách kiến trúc API dựa trên giao thức HTTP, định dạng dữ liệu JSON và các động từ GET, POST, PUT, DELETE.",
    example: "The mobile application interacts with the backend server via a REST API."
  },
  {
    word: "json web token",
    ipa: "/ˌdʒeɪ.sɑːn ˈweb ˌtoʊ.kən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Bảo mật web) Mã xác thực JSON Web Token (JWT); chuẩn mở nhỏ gọn và độc lập dùng để truyền tải thông tin an toàn giữa các bên dưới dạng đối tượng JSON có chữ ký số.",
    example: "JWT tokens are stored in HTTP-only cookies to maintain stateless user sessions."
  },
  {
    word: "jwt",
    ipa: "/ˌdʒeɪ.dʌb.əl.juːˈtiː/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Bảo mật web) Viết tắt của JSON Web Token; phương thức xác thực và ủy quyền phổ biến trong ứng dụng web và API.",
    example: "The server validates the JWT signature on every protected request."
  },
  {
    word: "oauth",
    ipa: "/ˈoʊ.ɑːθ/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Bảo mật mạng) Chuẩn ủy quyền mở OAuth; giao thức cho phép ứng dụng bên thứ ba truy cập tài nguyên của người dùng mà không cần biết mật khẩu (như Đăng nhập bằng Google).",
    example: "OAuth 2.0 provides secure delegated access to user profile data."
  },
  {
    word: "websocket",
    ipa: "/ˈwebˌsɑː.kɪt/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Giao thức mạng) Giao thức WebSocket; giao thức truyền thông hai chiều toàn phần (full-duplex) qua một kết nối TCP duy nhất, cho phép máy chủ đẩy dữ liệu thời gian thực tới client.",
    example: "Real-time chat applications use WebSockets for instant message delivery."
  },
  {
    word: "graphql",
    ipa: "/ˈɡræf.kjuːˌel/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Phát triển API) GraphQL; ngôn ngữ truy vấn cho API cho phép phía client yêu cầu chính xác các trường dữ liệu cần thiết, tránh thừa (over-fetching) hoặc thiếu dữ liệu (under-fetching).",
    example: "GraphQL simplifies mobile app queries by fetching related resources in a single request."
  },
  {
    word: "cors",
    ipa: "/kɔːrz/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(Bảo mật web) Chia sẻ tài nguyên khác nguồn (Cross-Origin Resource Sharing); cơ chế bảo mật của trình duyệt kiểm soát việc trang web truy cập tài nguyên từ miền khác.",
    example: "Configure CORS headers on your backend server to allow API requests from your frontend origin."
  },
  {
    word: "authentication",
    ipa: "/ɑːˌθen.tɪˈkeɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(An ninh thông tin) Xác thực người dùng; quá trình xác minh danh tính của người dùng hoặc hệ thống (ví dụ kiểm tra tên đăng nhập và mật khẩu, sinh trắc học hoặc OTP).",
    example: "Two-factor authentication adds an extra layer of defense against account takeover."
  },
  {
    word: "authorization",
    ipa: "/ˌɑː.θɚ.əˈzeɪ.ʃən/",
    region: "US",
    pos: "N",
    posLabel: "Danh từ",
    definition: "(An ninh thông tin) Phân quyền; quá trình kiểm tra và cấp phép cho người dùng đã xác thực quyền thực hiện một hành động cụ thể hoặc truy cập tài nguyên nhất định.",
    example: "Role-based access control manages authorization across team members."
  }
];

module.exports = csTerms;
