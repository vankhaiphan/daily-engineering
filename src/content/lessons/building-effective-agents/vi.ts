import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const SRC = "building-effective-agents";
const code = codeFor("vi");

export const vi: LessonBody = {
  title: "Workflow hay Agent: Xây dựng hệ thống LLM hiệu quả",
  subtitle:
    "Khi nào code của bạn nên quyết định bước tiếp theo, và khi nào nên để model quyết định? Sáu pattern, chi phí của chúng, và cách bảo vệ lựa chọn trong buổi phỏng vấn system design.",
  hook: "Các hệ thống agent thành công nhất lại đơn giản đến bất ngờ. Học sáu pattern và khi nào mỗi pattern xứng đáng với chi phí của nó.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "Một phát hiện bất ngờ",
      blocks: [
        {
          type: "p",
          text: "Hãy tưởng tượng người phỏng vấn hỏi: “Thiết kế một hệ thống AI tự sửa các test đang lỗi trong một codebase lớn.” Rất dễ bị cuốn vào việc vẽ ngay một framework multi-agent với planner, critic và memory store ngay nét bút đầu tiên trên bảng.",
        },
        {
          type: "p",
          text: "Tháng 12/2024, các kỹ sư Anthropic công bố những gì họ học được khi làm việc với hàng chục đội xây dựng agent LLM ở nhiều ngành khác nhau. Nhận xét chính của họ đi ngược lại phản xạ đó:",
        },
        {
          type: "quote",
          text: "the most successful implementations weren't using complex frameworks or specialized libraries",
          translation: "những triển khai thành công nhất không dùng framework phức tạp hay thư viện chuyên biệt",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Thay vào đó, các đội này xây dựng từ một số ít **pattern đơn giản, có thể kết hợp với nhau**. Bài học này dạy các pattern theo cách một kỹ sư sử dụng chúng: mỗi pattern làm gì, tốn bao nhiêu, hỏng như thế nào, và làm sao để giải thích vì sao bạn chọn nó.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "Sau bài học, bạn sẽ có thể",
          text: "Giải thích khác biệt giữa workflow và agent trong một câu; chọn pattern cho một bài toán và lập luận bằng độ trễ, chi phí và độ tin cậy; phác thảo vòng lặp agent bằng pseudocode, kể cả điều kiện dừng.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Trực giác: công thức nấu ăn và đầu bếp",
      blocks: [
        {
          type: "p",
          text: "Hãy hình dung hai căn bếp. Ở bếp thứ nhất, người nấu làm theo một tấm thẻ công thức: thái, rồi xào, rồi nêm. Thứ tự đã được người viết công thức quyết định từ trước. Ở bếp thứ hai, một đầu bếp nhận mục tiêu “nấu bữa tối từ những gì có trong tủ lạnh” và tự quyết định từng bước bằng cách quan sát, nếm và điều chỉnh.",
        },
        {
          type: "p",
          text: "Đó chính là khác biệt cốt lõi trong bài viết. Cả hai căn bếp đều là **hệ thống agentic**, nhưng khác nhau ở chỗ ai điều khiển luồng xử lý:",
        },
        {
          type: "list",
          items: [
            "**Workflow**: LLM và tool được điều phối qua các luồng code định sẵn. *Code của bạn* quyết định bước tiếp theo.",
            "**Agent**: LLM tự điều hướng quá trình và cách dùng tool của mình. *Model* quyết định bước tiếp theo.",
          ],
        },
        {
          type: "quote",
          text: "Workflows are systems where LLMs and tools are orchestrated through predefined code paths.",
          translation: "Workflow là những hệ thống mà LLM và tool được điều phối thông qua các luồng code định sẵn.",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Việc đầu bếp nếm thử mới là điểm quan trọng. Một agent tốt không tin vào phỏng đoán của chính nó: ở mỗi bước, nó thu thập **sự thật từ môi trường** (ground truth), như kết quả tool, kết quả chạy test hay lỗi compiler, rồi dùng chúng để chọn hành động tiếp theo.",
        },
        {
          type: "callout",
          tone: "analogy",
          title: "Một câu hỏi cần ghi nhớ",
          text: "Ai quyết định bước tiếp theo: code của bạn hay model? Chỉ một câu hỏi này đã giúp phân loại gần như mọi hệ thống LLM bạn sẽ thiết kế.",
        },
      ],
    },
    {
      id: "simplest",
      kind: "concept",
      title: "Bắt đầu từ thứ đơn giản nhất chạy được",
      blocks: [
        {
          type: "p",
          text: "Nguyên tắc đầu tiên của bài viết là sự kiềm chế: tìm giải pháp đơn giản nhất có thể, và chỉ tăng độ phức tạp khi thật cần. Hệ thống agentic thường đánh đổi **độ trễ và chi phí** để lấy hiệu quả công việc tốt hơn, nên mỗi lần gọi LLM thêm vào đều phải xứng đáng.",
        },
        {
          type: "p",
          text: "Một mô hình tư duy hữu ích là chiếc thang. Chỉ leo lên một bậc khi số liệu đo được cho thấy bậc hiện tại chưa đủ:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**Một lần gọi LLM**, được tối ưu bằng retrieval và ví dụ trong ngữ cảnh. Với nhiều ứng dụng, như vậy là đủ.",
            "**Một workflow**: nhiều lần gọi được nối với nhau bằng code của bạn. Workflow mang lại tính dự đoán được và nhất quán cho các tác vụ được định nghĩa rõ.",
            "**Một agent**: model tự chọn các bước. Phù hợp hơn khi cần sự linh hoạt và quyết định do model đưa ra ở quy mô lớn.",
          ],
        },
        {
          type: "p",
          text: "Mọi bậc thang đều được xây từ cùng một viên gạch: **augmented LLM**, tức một model được tăng cường bằng retrieval, tool và memory. Bài viết nhấn mạnh hai điều: điều chỉnh các khả năng này cho đúng use case, và cung cấp cho model một giao diện dễ dùng, được tài liệu hóa tốt. Model Context Protocol (MCP) là một cách để kết nối nó với tool của bên thứ ba.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Lỗi phỏng vấn thường gặp",
          text: "Đề xuất một agent tự chủ cho tác vụ có chuỗi bước cố định và đã biết trước, như “trích xuất trường từ hóa đơn, kiểm tra, rồi lưu”. Workflow rẻ hơn, nhanh hơn, dễ test hơn và hỏng theo những cách có thể dự đoán.",
        },
      ],
    },
    {
      id: "workflows",
      kind: "deep-dive",
      title: "Năm pattern workflow",
      blocks: [
        {
          type: "p",
          text: "Trong mỗi workflow dưới đây, luồng điều khiển nằm trong code của bạn. Hãy đọc phần mô tả, rồi dùng trình khám phá tương tác ở phần sau để xem từng pattern chạy từng bước.",
        },
        { type: "h3", text: "1. Prompt chaining (chuỗi prompt)" },
        {
          type: "p",
          text: "Chia tác vụ thành một chuỗi bước cố định; mỗi lần gọi LLM xử lý đầu ra của lần trước. Giữa các bước, bạn có thể đặt một **cổng kiểm tra** (gate) bằng code: code thuần kiểm tra kết quả trung gian và dừng chuỗi nếu có gì sai.",
        },
        {
          type: "p",
          text: "**Dùng khi** tác vụ tách được gọn gàng thành các tác vụ con cố định. Bạn đánh đổi độ trễ lấy độ chính xác, vì mỗi lần gọi có một nhiệm vụ dễ hơn. Ví dụ trong bài: viết dàn ý, kiểm tra dàn ý theo tiêu chí, rồi viết tài liệu.",
        },
        { type: "h3", text: "2. Routing (định tuyến)" },
        {
          type: "p",
          text: "Phân loại đầu vào, rồi chuyển nó tới một bước xử lý chuyên biệt: prompt, bộ tool hoặc model khác. Cách này tạo ra **tách biệt trách nhiệm** (separation of concerns): tinh chỉnh prompt cho một loại không làm giảm chất lượng các loại khác.",
        },
        {
          type: "p",
          text: "**Dùng khi** có các nhóm đầu vào khác biệt rõ ràng và xử lý riêng sẽ tốt hơn, đồng thời việc phân loại có thể làm chính xác, bằng LLM hoặc bộ phân loại truyền thống. Ví dụ: yêu cầu chăm sóc khách hàng được chia thành câu hỏi chung, yêu cầu hoàn tiền và hỗ trợ kỹ thuật; câu hỏi dễ gửi cho model nhỏ, rẻ hơn, câu khó gửi cho model mạnh hơn.",
        },
        { type: "h3", text: "3. Parallelization (song song hóa)" },
        {
          type: "p",
          text: "Chạy nhiều lần gọi LLM cùng lúc rồi tổng hợp đầu ra bằng code. Có hai biến thể: **sectioning** (chia phần) tách tác vụ thành các tác vụ con độc lập (một model trả lời người dùng trong khi model khác sàng lọc nội dung không phù hợp); **voting** (bỏ phiếu) chạy cùng một tác vụ nhiều lần để có nhiều kết quả khác nhau (nhiều prompt cùng review code tìm lỗ hổng, và một ngưỡng sẽ quyết định).",
        },
        {
          type: "p",
          text: "**Dùng khi** các tác vụ con độc lập và bạn cần tốc độ, hoặc khi cần nhiều góc nhìn để tăng độ tin cậy. Hãy nói chính xác về đánh đổi: gọi song song tăng **chi phí** (nhiều lần gọi hơn) nhưng không tăng **độ sâu độ trễ** (vẫn chỉ một vòng).",
        },
        { type: "h3", text: "4. Orchestrator-workers (điều phối – thực thi)" },
        {
          type: "p",
          text: "Một LLM trung tâm chia nhỏ tác vụ lúc chạy, giao các phần cho các LLM worker, rồi tổng hợp kết quả. Nhìn giống song song hóa, nhưng khác biệt then chốt là **tính linh hoạt**: các tác vụ con không được định sẵn, mà do orchestrator quyết định dựa trên đầu vào cụ thể.",
        },
        {
          type: "p",
          text: "**Dùng khi** không thể dự đoán trước các tác vụ con. Ví dụ: một thay đổi code mà số file cần sửa, và đó là những file nào, phụ thuộc vào yêu cầu.",
        },
        { type: "h3", text: "5. Evaluator-optimizer (đánh giá – tối ưu)" },
        {
          type: "p",
          text: "Một LLM tạo câu trả lời; một LLM khác đánh giá và đưa phản hồi; lặp lại. Bài viết so sánh nó với cách một người viết chỉnh sửa bản nháp qua nhiều lượt.",
        },
        {
          type: "p",
          text: "**Dùng khi** có tiêu chí đánh giá rõ ràng và việc lặp lại mang lại giá trị đo được. Hai dấu hiệu phù hợp: phản hồi của con người sẽ cải thiện rõ rệt kết quả, và LLM có khả năng đưa ra phản hồi như vậy. Ví dụ: dịch văn học với những nhận xét tinh tế; tìm kiếm phức tạp cần nhiều vòng, trong đó evaluator quyết định có cần tìm thêm hay không.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "Mẹo nhận diện pattern",
          text: "Các bước cố định → chaining. Nhiều loại đầu vào khác nhau → routing. Các phần độc lập hoặc cần đồng thuận → parallelization. Chỉ biết các phần khi thấy đầu vào → orchestrator-workers. Chất lượng tăng nhờ phản biện → evaluator-optimizer.",
        },
      ],
    },
    {
      id: "explorer",
      kind: "explore",
      title: "Xem các pattern vận hành",
      blocks: [
        {
          type: "p",
          text: "Chọn một pattern và một kịch bản, rồi bấm Phát hoặc đi từng bước. Theo dõi hai bộ đếm: **số lần gọi LLM** (đại diện cho chi phí) và **số vòng tuần tự** (đại diện cho độ trễ). Các kịch bản là ví dụ minh họa được viết cho bài học này, không phải số liệu đo thực tế.",
        },
        { type: "interactive", widget: "flow-explorer", ref: "patterns" },
      ],
    },
    {
      id: "agents",
      kind: "deep-dive",
      title: "Agent: tool trong một vòng lặp",
      blocks: [
        {
          type: "p",
          text: "Agent bắt đầu từ một mệnh lệnh hoặc một cuộc trao đổi với con người. Khi tác vụ đã rõ, nó tự lập kế hoạch và vận hành độc lập, và có thể dừng lại xin ý kiến con người ở các checkpoint hoặc khi gặp trở ngại.",
        },
        {
          type: "quote",
          text: "They are typically just LLMs using tools based on environmental feedback in a loop.",
          translation: "Về cơ bản, chúng thường chỉ là LLM dùng tool dựa trên phản hồi từ môi trường trong một vòng lặp.",
          sourceId: SRC,
        },
        { type: "p", text: "Có ba ý trong câu này đáng phân tích:" },
        {
          type: "list",
          items: [
            "**Tool**: agent tác động lên thế giới qua tool như đọc file, chạy test hay gọi API. Vì vậy thiết kế tool quan trọng ngang với thiết kế prompt.",
            "**Phản hồi từ môi trường**: sau mỗi hành động, agent quan sát kết quả thật. Với agent viết code, kết quả test là sự thật; độ tự tin của model thì không.",
            "**Vòng lặp có lối thoát**: agent lặp cho đến khi đạt mục tiêu, cần con người can thiệp, hoặc chạm điều kiện dừng như số vòng lặp tối đa.",
          ],
        },
        {
          type: "p",
          text: "**Dùng khi** bài toán mở, khó hoặc không thể dự đoán số bước cần thiết, và bạn có thể tin quyết định của model trong môi trường đó. Bài viết nói rõ cái giá phải trả: tính tự chủ đồng nghĩa với chi phí cao hơn và nguy cơ lỗi cộng dồn, vì vậy cần test kỹ trong môi trường sandbox với các guardrail phù hợp.",
        },
        { type: "h3", text: "Vì sao lỗi cộng dồn" },
        {
          type: "p",
          text: "Một phép tính nhanh để minh họa (của chúng tôi, không phải của bài viết): nếu mỗi bước trong 20 bước thành công độc lập với xác suất 95%, cả lượt chạy chỉ thành công với xác suất 0,95²⁰ ≈ 36%. Thực tế các bước không độc lập và agent có thể tự sửa sai, nhưng chỉ khi nó nhận được phản hồi. Đó chính là lý do ground truth, checkpoint và điều kiện dừng quan trọng đến vậy.",
        },
        {
          type: "callout",
          tone: "example",
          title: "Nơi agent tỏa sáng: viết code",
          text: "Lập trình rất hợp với agent: lời giải kiểm chứng được bằng test tự động, agent có thể lặp lại dựa trên kết quả test, và không gian bài toán được xác định rõ. Bài viết nhắc tới việc agent giải quyết các GitHub issue thật trong benchmark SWE-bench Verified chỉ dựa vào mô tả pull request, đồng thời nhấn mạnh rằng review của con người vẫn rất quan trọng.",
        },
      ],
    },
    {
      id: "pseudocode",
      kind: "example",
      title: "Pseudocode: từ workflow đến agent",
      blocks: [
        {
          type: "p",
          text: "Các đoạn dưới đây là pseudocode kiểu TypeScript. `llm()` đại diện cho một lần gọi model bất kỳ, không phải hàm SDK thật. Ở mỗi đoạn, hãy để ý **luồng điều khiển nằm ở đâu**.",
        },
        {
          type: "code",
          language: "ts",
          code: code.chaining,
          caption: "Prompt chaining: mỗi lần gọi có một nhiệm vụ hẹp, và cổng kiểm tra chặn đầu ra lỗi từ sớm.",
        },
        {
          type: "code",
          language: "ts",
          code: code.routing,
          caption: "Routing: một lần phân loại, sau đó đúng một nhánh chuyên biệt.",
        },
        {
          type: "code",
          language: "ts",
          code: code.agent,
          caption: "Vòng lặp agent: model chọn hành động; code của bạn nắm các giới hạn.",
        },
        {
          type: "p",
          text: "Hãy so sánh hình dạng. Với workflow, bạn vẽ được đồ thị luồng điều khiển trước khi chạy. Với agent, đồ thị chỉ tồn tại sau khi chạy, dưới dạng trace. Đó là lý do agent cần khả năng quan sát (observability), ghi log mọi bước, và vì sao bài viết khuyên nên hiển thị rõ các bước lập kế hoạch của agent.",
        },
      ],
    },
    {
      id: "tradeoffs",
      kind: "tradeoffs",
      title: "Những đánh đổi bạn cần bảo vệ được",
      blocks: [
        {
          type: "table",
          caption: "Bảng so sánh tổng hợp từ bài viết; cột chi phí mang tính định tính.",
          columns: ["Pattern", "Ai chọn luồng", "Chi phí & độ trễ", "Rủi ro chính"],
          rows: [
            ["Một lần gọi", "Không ai: một phát", "Thấp nhất", "Không đủ cho tác vụ nhiều bước"],
            ["Prompt chaining", "Code của bạn", "+1 lần gọi tuần tự mỗi bước", "Lỗi sớm lan truyền (dùng gate)"],
            ["Routing", "Bộ phân loại, rồi code", "+1 lần gọi phân loại", "Phân loại sai thì đi sai nhánh"],
            ["Parallelization", "Code của bạn", "Nhiều lần gọi, cùng độ sâu", "Chi phí nhân lên; logic tổng hợp"],
            ["Orchestrator-workers", "LLM orchestrator", "Biến động, khó giới hạn", "Kế hoạch tồi; worker không nhất quán"],
            ["Evaluator-optimizer", "Vòng lặp của bạn, LLM chấm", "Tăng theo mỗi vòng", "Không bao giờ hài lòng nếu thiếu giới hạn vòng"],
            ["Agent tự chủ", "Model", "Cao nhất, khó đoán", "Lỗi cộng dồn"],
          ],
        },
        {
          type: "p",
          text: "Số liệu cụ thể rất có ích khi phỏng vấn. Trong một bài viết sau đó của Anthropic Engineering về hệ thống nghiên cứu multi-agent (tháng 6/2025), các tác giả cho biết agent thường dùng khoảng **gấp 4 lần token** so với chat, còn hệ thống multi-agent khoảng **gấp 15 lần**. Đổi lại, hệ multi-agent của họ vượt agent đơn Claude Opus 4 tới **90,2%** trên bộ đánh giá nghiên cứu nội bộ. Bài học: điều phối multi-agent có thể đáng giá, nhưng chỉ khi giá trị của tác vụ đủ lớn để trả hóa đơn token.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Về framework",
          text: "Framework giúp bắt đầu nhanh, nhưng thêm các lớp trừu tượng có thể che khuất prompt và phản hồi thực sự, khiến debug khó hơn, và dễ khiến bạn thêm độ phức tạp không cần thiết. Bài viết khuyên bắt đầu bằng cách gọi trực tiếp API của LLM, vì nhiều pattern chỉ cần vài dòng code, và nếu dùng framework thì phải hiểu phần code bên dưới.",
        },
      ],
    },
    {
      id: "aci",
      kind: "deep-dive",
      title: "Giao diện agent–máy tính (ACI)",
      blocks: [
        {
          type: "p",
          text: "Một chi tiết đáng chú ý trong phụ lục: khi xây agent cho SWE-bench, nhóm tác giả dành nhiều thời gian cho tool hơn là cho prompt. Tool là đôi tay của agent, và mỗi định nghĩa tool là một prompt mà model sẽ đọc.",
        },
        {
          type: "quote",
          text: "we actually spent more time optimizing our tools than the overall prompt.",
          translation: "thực ra chúng tôi dành nhiều thời gian tối ưu tool hơn là tối ưu prompt tổng thể.",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Ví dụ cụ thể của họ: model mắc lỗi với đường dẫn file tương đối sau khi đã rời khỏi thư mục gốc. Cách sửa không phải một prompt thông minh hơn. Họ đổi tool để luôn bắt buộc đường dẫn tuyệt đối, và sau đó model dùng nó hoàn hảo. Đây là **poka-yoke**, một thuật ngữ sản xuất chỉ việc thiết kế chi tiết sao cho không thể lắp sai.",
        },
        {
          type: "list",
          items: [
            "**Cho model đủ token để suy nghĩ** trước khi nó tự dồn mình vào ngõ cụt.",
            "**Giữ định dạng gần với văn bản xuất hiện tự nhiên trên internet.**",
            "**Tránh gánh nặng định dạng**: viết diff đòi hỏi biết trước số dòng thay đổi trong header của chunk trước khi viết code; code nằm trong JSON cần escape thêm dấu xuống dòng và dấu nháy.",
            "**Viết tài liệu tool như một docstring tốt cho lập trình viên junior**: ví dụ sử dụng, trường hợp biên, yêu cầu định dạng đầu vào, và ranh giới rõ ràng với các tool khác.",
            "**Kiểm thử** cách model thực sự dùng tool của bạn với nhiều đầu vào mẫu, rồi cải tiến.",
          ],
        },
        {
          type: "code",
          language: "jsonc",
          code: code.toolDefinition,
          caption: "Ví dụ minh họa định nghĩa tool (ví dụ của chúng tôi, áp dụng hướng dẫn của bài viết).",
        },
        {
          type: "p",
          text: "Bài viết khép lại bằng ba nguyên tắc: **giữ thiết kế agent đơn giản**; **ưu tiên tính minh bạch** bằng cách hiển thị rõ các bước lập kế hoạch của agent; và **chăm chút giao diện agent–máy tính** bằng tài liệu tool kỹ lưỡng và kiểm thử.",
        },
      ],
    },
    {
      id: "quiz",
      kind: "quiz",
      title: "Kiểm tra mức độ hiểu bài",
      blocks: [
        {
          type: "quiz",
          questions: [
            {
              id: "q-routing",
              prompt:
                "Một hệ thống hỗ trợ phân loại mỗi email đến thành thanh toán, báo lỗi hoặc khách hàng tiềm năng, rồi trả lời bằng prompt và bộ tool chuyên cho loại đó. Đây là pattern nào?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "Orchestrator-workers",
                  feedback:
                    "Chưa đúng. Orchestrator tự nghĩ ra tác vụ con lúc chạy. Ở đây các loại đã cố định từ trước, và mỗi email đi theo đúng một nhánh định sẵn.",
                },
                {
                  id: "b",
                  text: "Routing",
                  feedback:
                    "Chính xác. Phân loại rồi chuyển tới nhánh chuyên biệt. Nhờ tách biệt trách nhiệm, tinh chỉnh prompt thanh toán không làm hỏng việc xử lý báo lỗi.",
                },
                {
                  id: "c",
                  text: "Parallelization (bỏ phiếu)",
                  feedback:
                    "Bỏ phiếu chạy cùng một tác vụ nhiều lần rồi tổng hợp. Ở đây mỗi email chỉ được xử lý một lần, bởi một nhánh chuyên biệt.",
                },
              ],
            },
            {
              id: "q-parallel",
              prompt:
                "Trợ lý review code của bạn chạy ba reviewer độc lập (bảo mật, hiệu năng, style) cùng lúc thay vì lần lượt. Điều gì thay đổi?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "Ít lần gọi LLM hơn, nên rẻ hơn",
                  feedback: "Không. Vẫn là ba lần gọi. Chạy song song không làm chúng rẻ hơn.",
                },
                {
                  id: "b",
                  text: "Số lần gọi như cũ, độ trễ tổng thể thấp hơn",
                  feedback:
                    "Đúng. Chi phí vẫn là ba lần gọi, nhưng chúng diễn ra trong một vòng thay vì ba. Đây là sectioning: các tác vụ con độc lập chạy đồng thời.",
                },
                {
                  id: "c",
                  text: "Nó trở thành một agent tự chủ",
                  feedback:
                    "Không. Code của bạn vẫn quyết định chính xác ba lần gọi nào được chạy. Model không điều hướng quá trình.",
                },
              ],
            },
            {
              id: "q-stopping",
              prompt:
                "Agent viết code của bạn đôi khi lặp rất lâu, sửa file rồi chạy lại test liên tục. Thay đổi nào đúng tinh thần bài viết nhất?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "Bỏ test khỏi vòng lặp để agent xong nhanh hơn",
                  feedback:
                    "Như vậy là lấy mất ground truth của agent. Kết quả test chính là phản hồi từ môi trường giúp nó phát hiện và sửa lỗi.",
                },
                {
                  id: "b",
                  text: "Đặt số vòng lặp tối đa và chuyển trace cho con người khi chạm giới hạn",
                  feedback:
                    "Chính xác. Bài viết khuyên dùng điều kiện dừng, như số vòng lặp tối đa, để giữ quyền kiểm soát, và agent có thể dừng lại xin ý kiến con người khi gặp trở ngại.",
                },
                {
                  id: "c",
                  text: "Chuyển sang framework lớn hơn với nhiều lớp trừu tượng hơn",
                  feedback:
                    "Bài viết cảnh báo rằng các lớp trừu tượng có thể che khuất prompt và phản hồi bên dưới, khiến đúng loại vấn đề này càng khó debug.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "interview",
      kind: "interview",
      title: "Tóm tắt cho phỏng vấn",
      blocks: [
        {
          type: "interview",
          pitchTitle: "Câu trả lời trong 30 giây",
          pitch:
            "Tôi bắt đầu từ thứ đơn giản nhất chạy được: một lần gọi LLM với prompt tốt và retrieval. Nếu tác vụ có các bước đã biết, tôi dùng workflow như chaining, routing, parallelization, orchestrator-workers hoặc evaluator-optimizer, vì luồng điều khiển nằm trong code: dễ dự đoán, dễ test và rẻ hơn. Tôi chỉ dùng agent tự chủ khi không thể dự đoán số bước và có cách kiểm chứng kết quả, như thay đổi code được kiểm tra bằng test. Khi đó tôi đầu tư vào thiết kế tool, điều kiện dừng, sandbox và tracing, vì tính tự chủ làm tăng chi phí và lỗi cộng dồn.",
          keyPointsTitle: "Ý chính",
          keyPoints: [
            "Workflow: code của bạn quyết định luồng. Agent: model quyết định luồng.",
            "Chỉ leo thang độ phức tạp khi số liệu đo được chứng minh là cần.",
            "Gọi song song tốn hơn nhưng giảm độ sâu độ trễ; vòng lặp nhân chi phí lên.",
            "Agent cần ground truth từ môi trường, checkpoint và điều kiện dừng.",
            "Tool cũng là prompt: đầu tư vào giao diện agent–máy tính (đường dẫn tuyệt đối, tài liệu rõ, test).",
            "Ba nguyên tắc: đơn giản, minh bạch, và tool được tài liệu hóa, kiểm thử kỹ.",
          ],
          followUpsTitle: "Câu hỏi tiếp theo thường gặp",
          followUps: [
            {
              question: "Khi nào bạn không dùng agent?",
              answer:
                "Khi các bước đã biết trước, khi ngân sách độ trễ hoặc chi phí eo hẹp, khi lỗi đắt đỏ và khó phát hiện, hoặc khi không có cách đáng tin để kiểm chứng thành công. Workflow hay một lần gọi sẽ dễ đoán và dễ test hơn.",
            },
            {
              question: "Bạn đánh giá một agent thế nào trước khi đưa vào production?",
              answer:
                "Xây bộ tác vụ thực tế có kết quả kiểm chứng được, ví dụ các test bắt buộc phải pass. Chạy agent trong sandbox, lưu đầy đủ trace, và đo tỷ lệ thành công, chi phí mỗi tác vụ và các kiểu thất bại. Để ý vòng lặp và lỗi cộng dồn, và giữ checkpoint con người cho các hành động có tác động lớn.",
            },
            {
              question: "Orchestrator-workers khác parallelization thế nào?",
              answer:
                "Cả hai đều tỏa ra nhiều lần gọi LLM. Với parallelization, code của bạn định sẵn các tác vụ con. Với orchestrator-workers, một LLM quyết định tác vụ con lúc chạy dựa trên đầu vào: linh hoạt hơn, nhưng khó giới hạn chi phí và khó test hơn.",
            },
            {
              question: "Làm sao để model dùng tool dễ hơn?",
              answer:
                "Coi định nghĩa tool như prompt: tên rõ ràng, mô tả kiểu docstring có ví dụ và trường hợp biên, định dạng gần văn bản tự nhiên, và các ràng buộc khiến lỗi không thể xảy ra, như bắt buộc đường dẫn tuyệt đối.",
            },
          ],
        },
      ],
    },
    {
      id: "sources",
      kind: "sources",
      title: "Nguồn tham khảo",
      blocks: [
        {
          type: "p",
          text: "Bài học này là phần giải thích nguyên bản. Các trích dẫn được giữ nguyên văn tiếng Anh từ nguồn bên dưới, kèm bản dịch của chúng tôi. Các phép so sánh, sơ đồ, kịch bản, pseudocode, ví dụ định nghĩa tool và phép tính lỗi cộng dồn là minh họa của chúng tôi.",
        },
        { type: "sources" },
      ],
    },
  ],
};
