import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const SRC = "demystifying-evals";
const code = codeFor("vi");

export const vi: LessonBody = {
  title: "Eval cho AI Agent: Làm sao biết agent của bạn thực sự hoạt động",
  subtitle:
    "Task, trial, grader, và hai con số kể hai câu chuyện khác nhau: pass@k và pass^k. Cách các đội đo lường agent trước khi người dùng làm việc đó thay họ.",
  hook: "Agent của bạn qua được buổi demo. Nhưng liệu nó có qua được một trăm lần chạy tiếp theo? Học cách eval biến cảm nhận thành con số.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "Qua được demo là chưa đủ",
      blocks: [
        {
          type: "p",
          text: "Bạn đưa vào production một agent xử lý hoàn tiền cho khách hàng. Demo nào cũng hoàn hảo. Một tuần sau, ticket bắt đầu đổ về: lúc thì nó hoàn tiền hai lần, lúc thì lặp mãi cho đến khi cuộc hội thoại hết thời gian. Bạn sửa một lỗi, một lỗi khác lại xuất hiện ở chỗ khác. Mỗi thay đổi đều là phỏng đoán, vì không có gì cho bạn biết tổng thể agent đang tốt lên hay tệ đi.",
        },
        {
          type: "p",
          text: "Đội kỹ sư của Anthropic gọi tình trạng này là bị mắc kẹt trong các vòng lặp phản ứng (reactive loops), và bài viết “Demystifying evals for AI agents” (tháng 1/2026) của họ chỉ ra lối thoát. Câu mở đầu nêu rõ mục tiêu:",
        },
        {
          type: "quote",
          text: "Good evaluations help teams ship AI agents more confidently.",
          translation: "Eval tốt giúp các đội đưa AI agent vào thực tế một cách tự tin hơn.",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Một **eval** đưa cho hệ thống AI một đầu vào và chấm điểm đầu ra. Với chatbot, đó là một câu hỏi và một câu trả lời. Với agent thì khó hơn nhiều: nhiều bước, nhiều tool, môi trường thay đổi, và mỗi lần chạy lại hành xử khác nhau. Bài học này đi qua cách các đội eval agent trong thực tế, và vì sao một con số duy nhất không bao giờ đủ.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "Sau bài học, bạn sẽ có thể",
          text: "Định nghĩa task, trial, grader, transcript và outcome; chọn grader bằng code, bằng model hay bằng con người cho từng loại kiểm tra; giải thích pass@k và pass^k bằng số liệu cụ thể; và phác thảo bộ eval đầu tiên cho agent bạn đang xây.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Trực giác: thi sát hạch lái xe, không phải bài kiểm tra viết",
      blocks: [
        {
          type: "p",
          text: "Bài kiểm tra viết chấm từng câu trả lời một. Thi sát hạch lái xe thì quan sát bạn lái: hàng chục quyết định nối tiếp nhau, trong môi trường thật, nơi một sai lầm ban đầu làm thay đổi mọi thứ phía sau. Eval một câu trả lời của model giống bài kiểm tra viết. Eval một agent giống thi sát hạch: qua nhiều lượt, sai lầm có thể lan truyền và cộng dồn.",
        },
        {
          type: "p",
          text: "Agent còn có thể sáng tạo. Bài viết kể Claude Opus 4.5 “trượt” một task đặt vé máy bay của τ2-bench vì nó tìm ra một kẽ hở trong chính sách của hãng bay, một kẽ hở thực ra mang lại kết quả tốt hơn cho người dùng. Một grader chỉ chấp nhận đúng chuỗi bước mong đợi sẽ đánh trượt một kết quả tốt.",
        },
        { type: "p", text: "Bộ thuật ngữ trong bài viết, sẽ dùng xuyên suốt bài học:" },
        {
          type: "list",
          items: [
            "**Task**: một bài kiểm tra với đầu vào và tiêu chí đạt được xác định rõ.",
            "**Trial**: một lần thử làm task. Agent không tất định, nên mỗi task cần chạy nhiều trial.",
            "**Grader**: phần logic chấm điểm một khía cạnh nào đó trong cách agent làm việc. Một task có thể có nhiều grader.",
            "**Transcript** (còn gọi là trace hay trajectory): bản ghi đầy đủ của một trial: tin nhắn, lần gọi tool, kết quả.",
            "**Outcome**: trạng thái cuối của môi trường khi trial kết thúc, ví dụ khoản hoàn tiền có thực sự tồn tại trong database hay không.",
            "**Harness**: *evaluation harness* chạy các task và ghi lại kết quả; *agent harness* (hay scaffold) là thứ cho phép model hoạt động như một agent. Bài viết lấy Claude Code làm ví dụ về agent harness.",
          ],
        },
        {
          type: "quote",
          text: "A task (a.k.a problem or test case) is a single test with defined inputs and success criteria.",
          translation: "Một task (còn gọi là problem hay test case) là một bài kiểm tra đơn lẻ với đầu vào và tiêu chí thành công được xác định.",
          sourceId: SRC,
        },
        {
          type: "callout",
          tone: "analogy",
          title: "Một phân biệt cần nhớ",
          text: "Transcript là những gì agent nói nó đã làm. Outcome là những gì thực sự đúng sau đó. Khi hai thứ mâu thuẫn, hãy tin outcome.",
        },
      ],
    },
    {
      id: "anatomy",
      kind: "deep-dive",
      title: "Giải phẫu một lần eval agent",
      blocks: [
        {
          type: "p",
          text: "Một lượt eval là một pipeline nhỏ. Với mỗi task, harness khởi tạo môi trường sạch, để agent thử làm task, ghi lại transcript và outcome cuối cùng, rồi chuyển cho một hoặc nhiều grader. Sau đó lặp lại cho trial tiếp theo, rồi tổng hợp. Hãy đi từng bước qua ba tình huống bên dưới: một task lập trình, một cuộc hội thoại hỗ trợ, và một task lần nào cũng thất bại.",
        },
        { type: "interactive", widget: "flow", ref: "pipeline" },
        {
          type: "p",
          text: "Hai chi tiết quan trọng hơn vẻ ngoài của chúng. **Cô lập**: mỗi trial phải bắt đầu từ môi trường sạch. Bài viết kể rằng Claude từng có lợi thế không công bằng ở một số task nhờ đọc git history do các trial trước để lại; trạng thái dùng chung cũng khiến các lần thất bại dính chùm với nhau. **Task hỏng**: tỷ lệ pass 0% qua nhiều trial thường là dấu hiệu task bị hỏng, chứ không phải agent kém. Hãy đọc transcript trước khi đổ lỗi cho model.",
        },
        {
          type: "p",
          text: "Để ý bộ đếm trong sơ đồ: một LLM chấm điểm tốn thêm một lần gọi model ở mỗi trial, còn grader bằng code thì không tốn gì. Qua hàng nghìn trial trong pipeline CI, chênh lệch đó cộng dồn rất nhanh.",
        },
      ],
    },
    {
      id: "graders",
      kind: "deep-dive",
      title: "Ba loại grader",
      blocks: [
        {
          type: "p",
          text: "Grader quyết định thế nào là “tốt”, nên chọn grader là quyết định thiết kế cốt lõi của một eval. Bài viết chia chúng thành ba nhóm:",
        },
        {
          type: "table",
          caption: "Điểm mạnh và điểm yếu theo tóm tắt của bài viết; ví dụ được rút gọn.",
          columns: ["Grader", "Ví dụ", "Điểm mạnh", "Điểm yếu"],
          rows: [
            ["Bằng code", "Test pass, kiểm tra trạng thái, kiểm tra lần gọi tool, phân tích tĩnh", "Nhanh, rẻ, khách quan, tái lập được, dễ debug", "Dễ gãy trước những câu trả lời đúng nhưng khác dạng mong đợi"],
            ["Bằng model (LLM chấm)", "Chấm theo rubric, khẳng định bằng ngôn ngữ tự nhiên, so sánh từng cặp", "Linh hoạt, mở rộng được, nắm được sắc thái và đầu ra mở", "Không tất định, tốn hơn, cần hiệu chỉnh theo con người"],
            ["Con người", "Chuyên gia review, kiểm tra ngẫu nhiên, A/B test", "Tiêu chuẩn vàng; dùng để hiệu chỉnh grader bằng model", "Đắt, chậm, khó mở rộng"],
          ],
        },
        {
          type: "p",
          text: "Quy tắc thực tế: chọn grader tất định khi có thể, dùng LLM khi cần hoặc để thêm linh hoạt, và dùng con người một cách tiết kiệm, chủ yếu để hiệu chỉnh các grader khác. Vài thói quen giúp grader đáng tin hơn nhiều:",
        },
        {
          type: "list",
          items: [
            "**Chấm outcome, không chấm đường đi.** Đừng đánh trượt agent chỉ vì nó đi một con đường khác để đến kết quả đúng.",
            "**Chấm riêng từng tiêu chí** (hoàn tiền đúng, giọng văn lịch sự, trong giới hạn số lượt) để khi thất bại bạn biết cái gì hỏng.",
            "**Cho điểm từng phần** với các task gồm nhiều phần.",
            "**Cho LLM chấm điểm một lối thoát:** để nó trả lời “Unknown” thay vì đoán khi transcript không đủ thông tin.",
            "**Chống đường tắt:** nếu agent có thể pass bằng cách sửa test thay vì sửa code, eval đang đo khả năng lách luật chứ không phải năng lực.",
          ],
        },
        {
          type: "quote",
          text: "it’s often better to grade what the agent produced, not the path it took.",
          translation: "thường thì tốt hơn nên chấm những gì agent tạo ra, chứ không phải con đường nó đã đi.",
          sourceId: SRC,
        },
      ],
    },
    {
      id: "pass-k",
      kind: "explore",
      title: "Một con số là không đủ: pass@k và pass^k",
      blocks: [
        {
          type: "p",
          text: "Chạy cùng một task nhiều lần, agent sẽ lúc đạt lúc trượt. Có hai chỉ số tóm tắt các trial đó, và chúng trả lời hai câu hỏi ngược nhau:",
        },
        {
          type: "list",
          items: [
            "**pass@k**: khả năng có ít nhất một lần thành công trong k lần thử. Dùng khi chỉ cần một câu trả lời tốt, ví dụ khi các bản sửa lỗi ứng viên được test kiểm tra trước khi có ai nhìn thấy.",
            "**pass^k**: xác suất cả k trial đều thành công. Dùng khi người dùng kỳ vọng agent lần nào cũng chạy đúng, như agent hỗ trợ mà khách hàng nói chuyện hết lần này đến lần khác.",
          ],
        },
        {
          type: "p",
          text: "Nếu các trial độc lập và mỗi trial thành công với xác suất p, thì pass@k = 1 − (1 − p)^k và pass^k = p^k. Ví dụ trong bài viết: với 75% mỗi trial, xác suất qua cả ba trial liên tiếp là 0,75³ ≈ 42%. Hãy chọn một tỷ lệ thành công và kéo thanh trượt: khi k tăng, pass@k tiến dần đến 100% còn pass^k giảm xuống.",
        },
        { type: "interactive", widget: "chart", ref: "passk" },
        {
          type: "callout",
          tone: "warning",
          title: "Đọc đúng con số",
          text: "Một agent đạt 90% nghe rất ấn tượng. Nhưng một khách hàng liên hệ năm lần chỉ có 59% khả năng (0,9⁵) cả năm cuộc trò chuyện đều suôn sẻ. Hãy xác định sản phẩm của bạn cần trả lời câu hỏi nào trước khi ăn mừng một con số.",
        },
      ],
    },
    {
      id: "suites",
      kind: "deep-dive",
      title: "Eval năng lực và eval hồi quy",
      blocks: [
        {
          type: "p",
          text: "Bài viết tách hai loại bộ eval với mục tiêu khác nhau. **Eval năng lực** (capability eval) hỏi agent làm tốt được những gì. Nó nên bắt đầu ở tỷ lệ pass thấp, với những task agent còn chật vật, để cả đội có một ngọn đồi để leo. **Eval hồi quy** (regression eval) hỏi agent có còn xử lý được mọi task nó từng làm được không. Nó nên luôn gần 100%; bất kỳ sụt giảm nào cũng có nghĩa là có gì đó vừa hỏng.",
        },
        {
          type: "p",
          text: "Hai loại này liên kết với nhau: các task năng lực có tỷ lệ pass cao có thể “tốt nghiệp” sang bộ hồi quy. Và bộ eval nào rồi cũng bão hòa. Một eval ở mức 100% vẫn bắt được lỗi hồi quy nhưng không còn cho tín hiệu cải thiện. Bài viết ghi nhận rằng trên SWE-bench Verified, một benchmark lập trình nổi tiếng, các LLM đã tăng từ 40% lên hơn 80% chỉ trong một năm.",
        },
        {
          type: "callout",
          tone: "example",
          title: "Trong pipeline CI",
          text: "Chạy bộ hồi quy ở mọi thay đổi, như unit test: nó phải luôn xanh. Chạy bộ năng lực thưa hơn (hằng đêm, hoặc khi đổi model hay prompt) và theo dõi xu hướng. Khi một task năng lực xanh liên tục nhiều tuần, chuyển nó sang bộ hồi quy và viết một task khó hơn.",
        },
      ],
    },
    {
      id: "example",
      kind: "example",
      title: "Ví dụ thực hành: eval một agent hoàn tiền",
      blocks: [
        {
          type: "p",
          text: "Dưới đây là một task cho agent hỗ trợ, viết dạng YAML. Đây là ví dụ minh họa của chúng tôi, lấy cảm hứng từ cấu trúc bài viết mô tả, không phải định dạng của một framework cụ thể. Nó kết hợp kiểm tra trạng thái trên outcome, kiểm tra lần gọi tool, rubric LLM cho giọng văn, giới hạn số lượt, và nhiều trial.",
        },
        {
          type: "code",
          language: "yaml",
          code: code.taskSpec,
          caption: "Kiểm tra tất định cho những gì kiểm chứng được; rubric LLM chỉ cho những gì không kiểm chứng được.",
        },
        {
          type: "p",
          text: "Khi mỗi task đã có nhiều trial, biến chúng thành hai chỉ số chỉ mất vài dòng code. Phiên bản này chỉ đơn giản xét k trial đầu tiên của mỗi task:",
        },
        {
          type: "code",
          language: "ts",
          code: code.summarize,
          caption: "pass@k và pass^k đo trực tiếp từ kết quả, không cần giả định độc lập.",
        },
      ],
    },
    {
      id: "pitfalls",
      kind: "tradeoffs",
      title: "Các kiểu thất bại và cách tránh",
      blocks: [
        {
          type: "table",
          caption: "Tổng hợp từ lộ trình trong bài viết; triệu chứng và cách sửa do chúng tôi diễn đạt.",
          columns: ["Kiểu thất bại", "Triệu chứng", "Cách sửa"],
          rows: [
            ["Task mơ hồ", "Chuyên gia bất đồng về đạt/trượt", "Hai chuyên gia phải cùng một kết luận; thêm lời giải tham chiếu"],
            ["Grader quá cứng", "Câu trả lời đúng bị chấm sai", "Chấm outcome, chuẩn hóa định dạng, cho điểm từng phần"],
            ["Trạng thái dùng chung", "Điểm cao bất thường hoặc thất bại theo chùm", "Mỗi trial bắt đầu từ môi trường sạch"],
            ["Bộ task lệch", "Agent lúc nào cũng (hoặc không bao giờ) hành động", "Test cả khi hành vi nên xảy ra và khi không nên"],
            ["Grader bị lách", "Điểm tăng, người dùng không vui", "Grader chống đường tắt; đọc transcript"],
            ["Bộ eval bão hòa", "100% hàng tháng, không còn tín hiệu", "Thêm task năng lực khó hơn; giữ task cũ làm hồi quy"],
          ],
        },
        {
          type: "p",
          text: "Một ví dụ ấn tượng trong bài viết: ban đầu Claude Opus 4.5 chỉ đạt 42% trên CORE-Bench. Sau khi đội sửa các lỗi chấm điểm và dùng scaffold ít ràng buộc hơn, điểm số nhảy lên 95%. Phần lớn khoảng cách nằm ở eval chứ không phải ở model. Trước khi ăn mừng hay hoảng hốt vì một con số, hãy kiểm tra chính eval.",
        },
        {
          type: "p",
          text: "Cuối cùng, eval tự động chỉ là một lớp phòng thủ, không phải toàn bộ hệ thống. Bài viết so sánh chúng với Mô hình pho mát Thụy Sĩ trong kỹ thuật an toàn: giám sát production, A/B test, phản hồi người dùng, đọc transcript và nghiên cứu với con người, mỗi lớp bắt được những vấn đề mà các lớp khác bỏ sót.",
        },
        {
          type: "quote",
          text: "Like the Swiss Cheese Model from safety engineering, no single evaluation layer catches every issue.",
          translation: "Giống như Mô hình pho mát Thụy Sĩ trong kỹ thuật an toàn, không lớp eval nào bắt được mọi vấn đề.",
          sourceId: SRC,
        },
      ],
    },
    {
      id: "roadmap",
      kind: "concept",
      title: "Từ con số không đến bộ eval đầu tiên",
      blocks: [
        {
          type: "p",
          text: "Bạn không cần hàng trăm task hay một đội riêng để bắt đầu. Lời khuyên của bài viết có thể gói gọn thành một lộ trình ngắn:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**Bắt đầu sớm và nhỏ**: 20–50 task đơn giản lấy từ các lỗi thực tế là khởi đầu rất tốt.",
            "**Biến kiểm tra thủ công thành task**: những gì bạn tự tay kiểm tra trước mỗi lần release, và các lỗi người dùng báo.",
            "**Viết task rõ ràng**, có lời giải tham chiếu, để hai chuyên gia cùng đi đến một kết luận.",
            "**Cân bằng bộ task**: có trường hợp hành vi nên xảy ra và trường hợp không nên.",
            "**Cô lập các trial** và ghi lại transcript đầy đủ.",
            "**Chọn grader có chủ đích**: code trước, LLM chấm khi cần, con người để hiệu chỉnh.",
            "**Đọc transcript thường xuyên**, nhất là các lần thất bại.",
            "**Bảo trì bộ eval**: chuyển task bão hòa sang hồi quy, thêm task khó hơn, để chuyên gia nghiệp vụ đóng góp task.",
          ],
        },
        {
          type: "quote",
          text: "20-50 simple tasks drawn from real failures is a great start.",
          translation: "20–50 task đơn giản lấy từ các lỗi thực tế là một khởi đầu rất tốt.",
          sourceId: SRC,
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
              id: "q-pass-hat-k",
              prompt:
                "Một agent hỗ trợ thành công ở 90% số trial. Khách hàng kỳ vọng lần nào liên hệ nó cũng chạy đúng. Chỉ số nào khớp với kỳ vọng đó, và giá trị của nó qua 5 cuộc hội thoại (các trial độc lập) là bao nhiêu?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "pass@5, khoảng 100%",
                  feedback: "pass@5 trả lời câu hỏi “ít nhất một trong năm lần có chạy đúng không?”. Đó là câu hỏi sai khi mọi cuộc hội thoại đều phải suôn sẻ.",
                },
                {
                  id: "b",
                  text: "pass^5, khoảng 59%",
                  feedback: "Đúng. 0,9⁵ ≈ 0,59: cứ mười khách liên hệ năm lần thì bốn người sẽ gặp ít nhất một lần thất bại. pass^k làm lộ ra điều đó.",
                },
                {
                  id: "c",
                  text: "pass@1, 90%: một con số là đủ",
                  feedback: "pass@1 mô tả một trial duy nhất. Nó che đi độ ổn định khi dùng lặp lại, mà đó chính là trải nghiệm của khách hàng.",
                },
              ],
            },
            {
              id: "q-zero",
              prompt: "Một task mới thất bại ở cả 50 trial. Việc đầu tiên bạn nên làm là gì?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "Chuyển sang model lớn hơn",
                  feedback: "Có thể sau này. Nhưng 0% qua nhiều trial thường là dấu hiệu task bị hỏng, và model lớn hơn không sửa được một grader hỏng.",
                },
                {
                  id: "b",
                  text: "Xóa task đi: nó không cho thêm thông tin gì",
                  feedback: "Bạn sẽ mất độ bao phủ, và cùng một lỗi (grader quá cứng, đặc tả mơ hồ) có thể đang ẩn trong các task khác.",
                },
                {
                  id: "c",
                  text: "Đọc transcript và kiểm tra lại task và grader",
                  feedback: "Chính xác. Tìm tiêu chí mơ hồ, grader so khớp tuyệt đối với câu trả lời hợp lệ, hoặc thiết lập bất khả thi, như tình huống grader quá cứng ở trên.",
                },
              ],
            },
            {
              id: "q-grader",
              prompt:
                "Bạn cần kiểm tra bản sửa của một agent lập trình làm test đang lỗi pass mà không làm hỏng các test khác. Grader nào phù hợp nhất?",
              correctOptionId: "a",
              options: [
                {
                  id: "a",
                  text: "Bằng code: chạy bộ test gốc trong môi trường sạch",
                  feedback: "Đúng. Điều này kiểm chứng được, nên hãy dùng kiểm tra nhanh, khách quan, tái lập được, và chạy test gốc để agent không thể pass bằng cách sửa test.",
                },
                {
                  id: "b",
                  text: "Một LLM chấm điểm đọc diff",
                  feedback: "Hữu ích cho những phẩm chất code không kiểm được, như tính dễ đọc, nhưng không tất định và tốn hơn. Đừng dùng cho điều test có thể kiểm chứng.",
                },
                {
                  id: "c",
                  text: "Một người review ở mọi trial",
                  feedback: "Con người là tiêu chuẩn vàng nhưng chậm và đắt. Hãy dùng họ để hiệu chỉnh grader tự động, không phải để chạy từng trial.",
                },
              ],
            },
            {
              id: "q-path",
              prompt:
                "Agent đặt được một chuyến bay hợp lệ, rẻ hơn, bằng một chuỗi lần gọi tool khác với lời giải tham chiếu, và mục tiêu của người dùng đã đạt. Grader đánh trượt nó. Vấn đề nằm ở đâu?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "Agent phải làm đúng các bước tham chiếu",
                  feedback: "Bắt buộc một con đường cụ thể là trừng phạt sự sáng tạo. Mục tiêu của người dùng đã đạt.",
                },
                {
                  id: "b",
                  text: "Grader chấm đường đi thay vì chấm outcome",
                  feedback: "Chính xác. Hãy chấm những gì agent tạo ra (một vé hợp lệ đáp ứng mục tiêu), chứ không phải con đường nó đã đi.",
                },
                {
                  id: "c",
                  text: "Cần thêm trial",
                  feedback: "Thêm trial với một grader cứng nhắc chỉ lặp lại cùng một kết luận sai. Hãy sửa grader trước.",
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
            "Tôi eval agent bằng một bộ task có tiêu chí thành công rõ ràng. Mỗi task chạy nhiều trial cô lập, và tôi chấm outcome chứ không chấm đường đi: grader bằng code trước vì nhanh và khách quan, LLM chấm điểm theo rubric cho những phẩm chất code không kiểm được, và con người để hiệu chỉnh. Tôi báo cáo pass@k khi một lần thành công là đủ, và pass^k khi người dùng cần sự ổn định. Tôi giữ eval năng lực bắt đầu từ mức khó và eval hồi quy gần 100%, khởi đầu với 20 đến 50 task từ các lỗi thực tế, và đọc transcript, vì một task ở mức 0% thường là task hỏng chứ không phải agent kém.",
          keyPointsTitle: "Ý chính",
          keyPoints: [
            "Task, trial, grader, transcript, outcome: transcript là điều agent nói, outcome là điều thực sự đúng.",
            "Chọn grader: code khi kiểm chứng được, LLM chấm khi cần, con người để hiệu chỉnh.",
            "Chấm outcome, tách từng tiêu chí, cho điểm từng phần và cho phép “Unknown”.",
            "pass@k = ít nhất một lần đạt; pass^k = mọi trial đều đạt. Với trial độc lập: 1 − (1 − p)^k so với p^k.",
            "Eval năng lực bắt đầu thấp rồi leo lên; eval hồi quy luôn gần 100%; task bão hòa thì tốt nghiệp.",
            "Cô lập trial, đọc transcript, và coi 0% là một báo cáo lỗi về chính eval.",
          ],
          followUpsTitle: "Câu hỏi tiếp theo thường gặp",
          followUps: [
            {
              question: "Làm sao để một LLM chấm điểm đáng tin cậy?",
              answer:
                "Cho nó rubric chính xác cho từng tiêu chí, chấm riêng từng tiêu chí, cho phép trả lời “Unknown”, và hiệu chỉnh với nhãn của con người trên một mẫu, kiểm tra lại mỗi khi đổi model hay rubric. Mọi thứ kiểm chứng được thì để cho grader tất định.",
            },
            {
              question: "Điểm của bạn tăng 20 điểm sau khi đổi prompt. Có nên release không?",
              answer:
                "Chưa vội. Kiểm tra đó không phải nhiễu (đủ trial mỗi task), đọc transcript xem có lách grader hay rò rỉ trạng thái không, xác nhận bộ hồi quy vẫn xanh, rồi kiểm chứng trên production bằng giám sát hoặc A/B test.",
            },
            {
              question: "pass@k hay pass^k cho một agent lập trình đề xuất bản sửa?",
              answer:
                "Nếu nhiều bản sửa ứng viên được sinh ra và được test kiểm tra trước khi con người thấy, pass@k là điều quan trọng. Nếu mỗi lần thử đến thẳng người dùng hoặc được merge trực tiếp, sự ổn định mới quan trọng, nên hãy theo dõi pass^k.",
            },
            {
              question: "Eval khớp với giám sát production như thế nào?",
              answer:
                "Chúng là các lớp bổ trợ nhau: eval tự động trước khi ra mắt và trong CI; giám sát để phát hiện trôi dạt sau khi ra mắt; A/B test để kiểm chứng thay đổi trên lưu lượng thật; phản hồi và đọc transcript cho những gì không ai lường trước.",
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
          text: "Bài học này là phần giải thích nguyên bản. Các trích dẫn được giữ nguyên văn tiếng Anh từ nguồn bên dưới, kèm bản dịch của chúng tôi. Các kịch bản, task agent hoàn tiền, pseudocode, ví dụ 90%/5 cuộc hội thoại và biểu đồ (tính từ công thức chính xác) là minh họa của chúng tôi.",
        },
        { type: "sources" },
      ],
    },
  ],
};
