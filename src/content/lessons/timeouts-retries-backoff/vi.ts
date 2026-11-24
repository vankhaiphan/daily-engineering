import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const T = "timeouts-retries-jitter";
const code = codeFor("vi");

export const vi: LessonBody = {
  title: "Timeout, Retry và Backoff có Jitter: Sống sót qua sự cố cục bộ",
  subtitle:
    "Chờ bao lâu, khi nào thử lại, và làm sao để một sự cố nhỏ không biến thành sự cố lớn. Bài học từ Builders' Library của Amazon, nay có tương tác trực quan.",
  hook: "Một lần retry có thể cứu một request hoặc đánh sập cả database. Học liều lượng đúng: timeout, backoff, jitter và idempotency.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "Sự cố 20 mili giây",
      blocks: [
        {
          type: "p",
          text: "Có lần một đội ở Amazon đặt timeout cho lời gọi tới một dependency rất thấp, khoảng 20 mili giây. Phần lớn thời gian, như vậy là dư dả. Nhưng ngay sau mỗi lần deploy, một số ít lời gọi bị timeout. Nguyên nhân hoàn toàn không phải dependency chậm: các process mới phải thiết lập kết nối trước, và riêng việc thiết lập kết nối đã mất hơn 20 ms. Cách sửa là mở sẵn các kết nối đó ngay khi process khởi động, trước khi nhận bất kỳ lưu lượng nào.",
        },
        {
          type: "p",
          text: "Câu chuyện đó mở đầu một bài viết kinh điển trong AWS Builders' Library, “Timeouts, retries, and backoff with jitter” (tháng 12/2019). Thông điệp chính: trong hệ thống phân tán, server, mạng và các lần deploy lúc nào cũng hỏng, một phần và trong chốc lát. Bốn công cụ nhỏ quyết định những sự cố đó có còn nhỏ hay không: **timeout**, **retry**, **backoff** và **jitter**. Dùng khéo, chúng che sự cố khỏi người dùng. Dùng ẩu, chúng khuếch đại sự cố.",
        },
        {
          type: "quote",
          text: "Retries are similar to a powerful medicine -- useful in the right dose, but can cause significant damage when used too much.",
          translation: "Retry giống như một liều thuốc mạnh: hữu ích khi đúng liều, nhưng có thể gây hại nghiêm trọng khi dùng quá nhiều.",
          sourceId: T,
        },
        {
          type: "callout",
          tone: "insight",
          title: "Sau bài học, bạn sẽ có thể",
          text: "Chọn timeout từ một phân vị độ trễ; quyết định lỗi nào nên retry; giải thích hiện tượng khuếch đại retry bằng con số; mô tả backoff lũy thừa, jitter và ngân sách retry; và làm một API được retry trở nên an toàn bằng idempotency key.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Trực giác: gọi điện cho một nhà hàng đông khách",
      blocks: [
        {
          type: "p",
          text: "Bạn gọi đến nhà hàng để đặt bàn. Chờ mãi không ai nhấc máy, bạn cúp máy: đó là **timeout**. Bạn gọi lại: đó là **retry**. Nếu vẫn bận, bạn chờ lâu hơn trước mỗi lần gọi tiếp: **backoff**. Giờ hãy tưởng tượng một nghìn người cùng cúp máy lúc 7:00 và cùng gọi lại đúng 7:01. Đường dây lại nghẽn. Nếu mỗi người chờ một khoảng thời gian ngẫu nhiên hơi khác nhau, các cuộc gọi sẽ dàn trải ra và nhà hàng có thể trả lời: đó là **jitter**.",
        },
        {
          type: "p",
          text: "Thêm một chi tiết: bạn vừa đặt bàn thì cuộc gọi bị rớt, và bạn không biết lượt đặt đã được ghi chưa. Nếu gọi lại và nói “một bàn bốn người lúc 8 giờ”, có thể bạn sẽ có hai lượt đặt. Nếu nói “đây là yêu cầu đặt bàn số #a1b2”, nhà hàng sẽ biết đó là cùng một yêu cầu. Đó là **idempotency**.",
        },
        {
          type: "callout",
          tone: "analogy",
          title: "Mâu thuẫn cốt lõi",
          text: "Retry mang tính ích kỷ: mỗi lần retry tiêu thêm thời gian của server để tăng cơ hội thành công cho riêng bạn. Khi server khỏe, đó là một cuộc trao đổi có lợi. Khi server quá tải, những lần retry ích kỷ của tất cả mọi người làm mọi thứ tệ hơn.",
        },
      ],
    },
    {
      id: "timeouts",
      kind: "deep-dive",
      title: "Timeout: chờ bao lâu là đủ",
      blocks: [
        {
          type: "p",
          text: "Mọi lời gọi từ xa đều cần timeout. Một request chờ mãi sẽ giữ tài nguyên suốt thời gian đó: bộ nhớ, thread, kết nối, port. Khi đủ nhiều request giữ tài nguyên quá lâu, server cạn kiệt, và một dependency chậm trở thành sự cố của chính bạn.",
        },
        {
          type: "p",
          text: "Theo bài viết, phần khó là chọn giá trị. Quá cao thì các request bị kẹt dồn đống. Quá thấp thì bạn cắt cả những request lẽ ra đã thành công, dẫn đến nhiều retry hơn, nhiều lưu lượng backend hơn và độ trễ cao hơn.",
        },
        {
          type: "quote",
          text: "Typically, the most difficult problem is choosing a timeout value to set.",
          translation: "Thông thường, bài toán khó nhất là chọn giá trị timeout.",
          sourceId: T,
        },
        {
          type: "p",
          text: "Cách làm của Amazon rất cụ thể: chọn một tỷ lệ timeout nhầm chấp nhận được, ví dụ 0,1%, rồi đặt timeout ở phân vị độ trễ tương ứng của service phía dưới, ở đây là **p99.9**. Nếu dependency trả lời trong vòng 180 ms ở 99,9% trường hợp, timeout khoảng 180 ms nghĩa là chỉ chừng một request khỏe mạnh trên một nghìn bị cắt nhầm. (Con số 180 ms là ví dụ của chúng tôi.)",
        },
        {
          type: "list",
          items: [
            "**Đo đúng thứ cần đo**: câu chuyện 20 ms cho thấy timeout có thể bao gồm cả thời gian thiết lập kết nối, điều mà số liệu độ trễ thông thường có thể không phản ánh.",
            "**Biết timeout bao phủ những gì**: tùy thư viện, nó có thể không bao gồm bước tra DNS hay bắt tay TLS.",
            "**Chừa khoảng dư cho lời gọi qua internet**: độ trễ qua internet dao động nhiều hơn hẳn so với bên trong data center, nên cần tính đến độ trễ mạng xấu nhất hợp lý.",
          ],
        },
      ],
    },
    {
      id: "retries",
      kind: "deep-dive",
      title: "Retry: khi nào thử lại có ích, khi nào có hại",
      blocks: [
        {
          type: "p",
          text: "Nhiều lỗi chỉ thoáng qua: một server khởi động lại, một gói tin bị mất, một node quá tải trong chốc lát. Retry biến chúng thành thành công mà người dùng không hề hay biết. Nhưng không phải lỗi nào cũng đáng retry, và không phải request nào cũng an toàn khi gửi hai lần. Hãy đi từng bước qua ba dòng thời gian bên dưới.",
        },
        { type: "interactive", widget: "sequence", ref: "sequence" },
        {
          type: "list",
          items: [
            "**Lỗi phía client** (request sai định dạng hoặc không có quyền) sẽ không thành công về sau. Đừng retry y nguyên request đó.",
            "**Lỗi phía server và timeout** có thể thành công ở lần thử sau. Đây là những ứng viên để retry.",
            "**Side effect** thay đổi mọi thứ: sau một lần timeout, bạn không biết lần thử đầu đã xảy ra hay chưa. Retry một API không idempotent có thể trừ tiền thẻ hai lần.",
          ],
        },
        {
          type: "quote",
          text: "In general, our view is that APIs with side effects aren't safe to retry unless they provide idempotency.",
          translation: "Nhìn chung, quan điểm của chúng tôi là API có side effect không an toàn để retry trừ khi chúng đảm bảo idempotency.",
          sourceId: T,
        },
        {
          type: "p",
          text: "Bài viết đi kèm, “Making retries safe with idempotent APIs”, định nghĩa thao tác idempotent là thao tác mà request có thể được retry mà không gây thêm side effect nào. Thiết kế AWS ưu tiên là một **client request identifier** duy nhất trong hợp đồng API, do bên gọi sinh ra và dùng lại cho mọi lần retry; nhiều API của AWS gọi nó là ClientToken, và SDK tự sinh một giá trị khi bên gọi không cung cấp. Lần retry với cùng identifier sẽ nhận phản hồi tương đương về ngữ nghĩa. Nếu cùng identifier đến kèm tham số khác, service trả về lỗi validation thay vì đoán ý định của bên gọi.",
        },
      ],
    },
    {
      id: "amplification",
      kind: "explore",
      title: "Khuếch đại retry: 3 lần thử thành 243",
      blocks: [
        {
          type: "p",
          text: "Retry nhân lên khi hệ thống có nhiều tầng. Ví dụ trong bài viết: một lời gọi của khách hàng kéo theo một chuỗi gọi service sâu năm tầng, và database ở đáy bắt đầu lỗi. Nếu tầng nào cũng retry độc lập, mỗi lần thất bại nhân tải lên tầng bên dưới. Với ba lần thử mỗi tầng, database nhận 3⁵ = 243 request cho mỗi lời gọi của khách, đúng lúc nó yếu nhất.",
        },
        { type: "interactive", widget: "chart", ref: "amplification" },
        {
          type: "p",
          text: "Cách sửa nằm ở cấu trúc: chỉ retry tại một điểm duy nhất trong stack. Các tầng dưới thất bại nhanh và báo lỗi lên trên; chỉ một tầng quyết định có thử lại hay không. Sự khuếch đại biến mất, và những lần retry còn lại trở nên dễ suy luận.",
        },
        {
          type: "quote",
          text: "our best practice is to retry at a single point in the stack.",
          translation: "thực hành tốt nhất của chúng tôi là retry tại một điểm duy nhất trong stack.",
          sourceId: T,
        },
      ],
    },
    {
      id: "backoff",
      kind: "deep-dive",
      title: "Backoff, giới hạn trần và ngân sách retry",
      blocks: [
        {
          type: "p",
          text: "Retry ngay lập tức là đánh tiếp vào một server đang chật vật khi nó vẫn đang chật vật. **Backoff lũy thừa** chờ lâu hơn sau mỗi lần thất bại: ví dụ 100 ms, rồi 200 ms, rồi 400 ms. Vì thời gian chờ tăng rất nhanh, bài viết khuyên đặt **trần**, gọi là capped exponential backoff. Nhưng chỉ có trần thì lại sinh tác dụng phụ: khi mọi client đều chạm mức chờ tối đa, tất cả cứ liên tục retry ở đúng tốc độ trần đó.",
        },
        {
          type: "p",
          text: "Vì vậy Amazon còn giới hạn retry **cục bộ bằng token bucket**: mỗi lần retry tiêu một token; còn token thì được retry; khi bucket cạn, retry chỉ tiếp tục ở một tốc độ cố định, chậm. AWS đưa hành vi này vào AWS SDK từ năm 2016. Rộng hơn, đội tránh hiện tượng khuếch đại bằng cách chỉ retry khi quan sát thấy dependency đang khỏe.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Còn circuit breaker thì sao?",
          text: "Circuit breaker ngừng hẳn việc gọi một dependency đang lỗi trong một khoảng thời gian. Nó rất phổ biến, nhưng bài viết cảnh báo rằng nó đưa vào hệ thống những chế độ hoạt động khác nhau, khó kiểm thử, và có thể kéo dài đáng kể thời gian phục hồi. Ngân sách retry (token bucket) cho một giới hạn nhẹ nhàng hơn và luôn hoạt động.",
        },
      ],
    },
    {
      id: "jitter",
      kind: "explore",
      title: "Jitter: phá vỡ cơn giẫm đạp đồng loạt",
      blocks: [
        {
          type: "p",
          text: "Chỉ backoff thôi là không đủ khi nhiều client cùng thất bại một lúc: chúng tính ra cùng một thời gian chờ và cùng quay lại đúng một thời điểm. Nếu mọi lời gọi thất bại đều lùi lại tới cùng một thời điểm, chúng lại gây tranh chấp hoặc quá tải khi retry. **Jitter** thêm yếu tố ngẫu nhiên vào mỗi lần chờ, để các lần retry dàn trải theo thời gian.",
        },
        {
          type: "p",
          text: "Biểu đồ dưới đây là mô phỏng của chúng tôi, không phải số đo thực tế: 100 client cùng thất bại và retry ba lần trong khi server vẫn chưa hồi phục. Hãy so sánh các lần retry rơi vào đâu với thời gian chờ cố định, với backoff lũy thừa, và với backoff cộng full jitter (chờ ngẫu nhiên từ 0 đến giá trị backoff).",
        },
        { type: "interactive", widget: "chart", ref: "jitter" },
        {
          type: "p",
          text: "Jitter không chỉ dành cho retry. Bài viết khuyên thêm jitter cho cả timer, job định kỳ và các tác vụ trì hoãn khác: client gọi định kỳ mỗi phút một lần, hay các job lên lịch lúc nửa đêm, nếu không sẽ dồn lại thành những đỉnh tải. Với tác vụ theo lịch, Amazon dùng jitter **nhất quán** cho mỗi host thay vì một giá trị ngẫu nhiên mới, để sự cố tái hiện theo một khuôn mẫu dễ nhận ra. Dàn trải tải như vậy giúp họ làm cùng khối lượng công việc với ít năng lực server hơn.",
        },
      ],
    },
    {
      id: "code",
      kind: "example",
      title: "Ghép tất cả lại thành code",
      blocks: [
        {
          type: "p",
          text: "Dưới đây là phác thảo một hàm retry phía client áp dụng mọi điều ở trên: timeout cho mọi lời gọi, chỉ retry những lỗi có thể thành công về sau, ngân sách retry cục bộ, backoff lũy thừa có trần kèm full jitter, và một idempotency key dùng chung cho mọi lần thử. Các tên như `send`, `retryBudget` và `P999_LATENCY_MS` chỉ là placeholder, không phải SDK thật.",
        },
        {
          type: "code",
          language: "ts",
          code: code.retry,
          caption: "Phác thảo của chúng tôi. Trong hệ thống nhiều tầng, chỉ một tầng nên chạy vòng lặp như thế này.",
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
          caption: "Tổng hợp từ bài viết; cột kinh nghiệm thực tế là của chúng tôi.",
          columns: ["Kỹ thuật", "Bảo vệ khỏi", "Rủi ro nếu dùng sai", "Kinh nghiệm thực tế"],
          rows: [
            ["Timeout", "Cạn tài nguyên vì lời gọi bị kẹt", "Quá thấp: timeout nhầm và bão retry", "Đặt theo p99.9 của dependency; kiểm tra nó bao phủ gì"],
            ["Retry", "Lỗi thoáng qua", "Side effect trùng lặp; khuếch đại", "Chỉ lỗi server/timeout; một tầng; API idempotent"],
            ["Backoff lũy thừa", "Dồn dập vào server đang yếu", "Client đồng bộ ở mức trần", "Luôn đặt trần, và thêm jitter"],
            ["Jitter", "Đỉnh tải đồng loạt", "Khó tái hiện lỗi liên quan thời gian", "Ngẫu nhiên cho retry; nhất quán theo host cho lịch"],
            ["Token bucket", "Bão retry khi sự cố lớn", "Ít retry hơn khi bạn muốn có", "Mỗi retry tiêu một token; nạp lại chậm"],
            ["Circuit breaker", "Gọi vào dependency đã chết", "Nhiều chế độ; phục hồi chậm hơn", "Ưu tiên ngân sách retry; nếu dùng, test cả hai chế độ"],
          ],
        },
        {
          type: "p",
          text: "Lời khuyên khép lại bài viết gắn kết các đánh đổi: lỗi thoáng qua và độ trễ là không thể tránh, nên hãy lên kế hoạch cho chúng, nhưng thận trọng với retry. Retry khi dependency có vẻ khỏe, và dừng lại khi retry không còn giúp cải thiện độ sẵn sàng.",
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
              id: "q-timeout",
              prompt:
                "Đội của bạn chấp nhận khoảng 1 trên 1.000 lời gọi khỏe mạnh có thể bị timeout cắt nhầm. Timeout nên dựa trên giá trị nào?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "Độ trễ trung bình của dependency",
                  feedback: "Trung bình che mất phần đuôi. Nhiều request khỏe mạnh chậm hơn mức trung bình, nên bạn sẽ cắt nhầm nhiều hơn hẳn 0,1%.",
                },
                {
                  id: "b",
                  text: "Một con số tròn như 30 giây cho chắc",
                  feedback: "Timeout quá lớn để các request bị kẹt giữ thread và kết nối rất lâu, có thể làm cạn kiệt server.",
                },
                {
                  id: "c",
                  text: "Độ trễ p99.9 của dependency",
                  feedback: "Đúng. Ngân sách timeout nhầm 0,1% tương ứng với phân vị 99,9 của độ trễ phía dưới: đúng phương pháp của Amazon.",
                },
              ],
            },
            {
              id: "q-amplification",
              prompt:
                "Một request đi qua 4 service trước khi đến database. Mỗi service thử tối đa 3 lần. Database đang sập. Mỗi request của người dùng có thể đổ bao nhiêu request vào database?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "12",
                  feedback: "Đó là cộng số lần thử (4 × 3). Retry nhân lên: mỗi lần thử ở một tầng kích hoạt tới 3 lần thử ở tầng kế tiếp.",
                },
                {
                  id: "b",
                  text: "81",
                  feedback: "Đúng: 3⁴ = 81. Đó là lý do bài viết khuyên chỉ retry tại một điểm duy nhất trong stack.",
                },
                {
                  id: "c",
                  text: "3",
                  feedback: "Đó là tải khi chỉ một tầng retry. Khi tầng nào cũng retry độc lập, tải sẽ nhân lên.",
                },
              ],
            },
            {
              id: "q-idempotency",
              prompt:
                "Một lời gọi thanh toán bị timeout. Bạn không biết tiền đã bị trừ hay chưa. Điều gì giúp retry an toàn?",
              correctOptionId: "a",
              options: [
                {
                  id: "a",
                  text: "Gửi cùng một request ID do client sinh ra ở mọi lần thử",
                  feedback: "Chính xác. Service nhận ra ID và trả về phản hồi tương đương thay vì trừ tiền lần nữa.",
                },
                {
                  id: "b",
                  text: "Chờ lâu hơn trước khi retry",
                  feedback: "Backoff giảm tải, nhưng request thứ hai vẫn sẽ tạo ra lần trừ tiền thứ hai.",
                },
                {
                  id: "c",
                  text: "Để server tự phát hiện trùng lặp dựa vào số tiền và thẻ",
                  feedback: "Hai lần trừ tiền giống hệt nhau có thể là chủ ý (hai ly cà phê). AWS ưu tiên một request identifier tường minh do bên gọi cung cấp.",
                },
              ],
            },
            {
              id: "q-jitter",
              prompt:
                "Hàng nghìn client di động mất kết nối trong một sự cố ngắn và cùng dùng một kiểu backoff lũy thừa. Vấn đề gì còn lại?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "Không còn gì: backoff lũy thừa đã dàn trải tải rồi",
                  feedback: "Nó giãn các lần thử của từng client, nhưng mọi client tính ra cùng thời gian chờ nên vẫn quay lại cùng lúc.",
                },
                {
                  id: "b",
                  text: "Chúng sẽ retry cả lỗi phía client",
                  feedback: "Phân loại lỗi là chuyện khác. Vấn đề ở đây là thời điểm.",
                },
                {
                  id: "c",
                  text: "Các lần retry đến thành từng đợt đồng loạt; cần thêm jitter",
                  feedback: "Chính xác. Ngẫu nhiên hóa mỗi lần chờ giúp dàn trải các lần retry, như mô phỏng cho thấy.",
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
            "Mọi lời gọi từ xa đều có timeout, đặt theo độ trễ p99.9 của dependency để chỉ khoảng 0,1% lời gọi khỏe mạnh bị cắt nhầm. Tôi chỉ retry những lỗi có thể thành công về sau, như lỗi server và timeout, không bao giờ retry y nguyên lỗi phía client, và chỉ ở một tầng trong stack, vì retry độc lập sẽ nhân lên: ba lần thử qua năm tầng là gấp 243 lần tải. Retry dùng backoff lũy thừa có trần kèm jitter để client không quay lại đồng loạt, cộng thêm ngân sách retry bằng token bucket. Mọi thứ có side effect phải idempotent, với một request ID do client sinh ra và dùng lại ở mọi lần thử.",
          keyPointsTitle: "Ý chính",
          keyPoints: [
            "Timeout bảo vệ tài nguyên của bạn; chọn từ một phân vị độ trễ, không phải đoán.",
            "Retry mang tính ích kỷ: tuyệt vời với lỗi thoáng qua, có hại khi quá tải.",
            "Retry lỗi server và timeout, không retry lỗi client; chỉ retry ở một tầng.",
            "Khuếch đại là phép nhân: số lần thử^số tầng (3⁵ = 243).",
            "Backoff + trần + jitter + token bucket giữ cho retry không đồng bộ thành bão.",
            "Side effect cần idempotency: một request ID, phản hồi tương đương khi retry.",
          ],
          followUpsTitle: "Câu hỏi tiếp theo thường gặp",
          followUps: [
            {
              question: "Sao không dùng luôn circuit breaker?",
              answer:
                "Nó có thể giúp, nhưng bài viết cảnh báo circuit breaker thêm nhiều chế độ hoạt động khó kiểm thử và có thể làm chậm phục hồi. Ngân sách retry cục bộ (token bucket) giới hạn retry liên tục mà không cần một chế độ riêng.",
            },
            {
              question: "Trong stack microservices, retry nên nằm ở đâu?",
              answer:
                "Tại một điểm duy nhất, thường là tầng cao nhất sở hữu request của người dùng. Các tầng dưới thất bại nhanh và đẩy lỗi lên, để retry không nhân lên qua các tầng.",
            },
            {
              question: "Làm sao biến một API thanh toán có sẵn thành idempotent?",
              answer:
                "Thêm request ID do client cung cấp vào hợp đồng, lưu nó nguyên tử cùng kết quả, trả lại phản hồi đã lưu (tương đương) cho các lần lặp trong một khoảng thời gian lưu giữ, và từ chối ID bị dùng lại với tham số khác.",
            },
            {
              question: "Bạn theo dõi gì để phát hiện bão retry?",
              answer:
                "Tỷ lệ retry so với lần gọi đầu, tỷ lệ timeout theo từng dependency, mức cạn ngân sách retry, và lưu lượng ở đáy stack so với lưu lượng người dùng. Khoảng chênh giữa hai thứ đó chính là khuếch đại.",
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
          text: "Bài học này là phần giải thích nguyên bản. Các trích dẫn được giữ nguyên văn tiếng Anh từ nguồn bên dưới, kèm bản dịch của chúng tôi. Phép so sánh với nhà hàng, các kịch bản tuần tự, phác thảo code, ví dụ 180 ms, biểu đồ khuếch đại (số học) và biểu đồ jitter (mô phỏng có seed) là minh họa của chúng tôi. Định nghĩa full jitter được xác nhận bởi tài liệu tham chiếu AWS SDK về hành vi retry.",
        },
        { type: "sources" },
      ],
    },
  ],
};
