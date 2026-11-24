import type { FlowExplorerSpec, Localized } from "@/content/schema";

/** Compact constructor for short trilingual labels. */
const L = (en: string, vi: string, fr: string): Localized => ({ en, vi, fr });

/**
 * Interactive "agentic patterns" explorer.
 * Traces are illustrative scenarios written for this lesson (not measurements);
 * the LLM-call and round counts are exact properties of each scenario.
 */
export const agenticPatternsExplorer: FlowExplorerSpec = {
  id: "agentic-patterns",
  viewBox: { width: 340, height: 400 },
  scenarios: [
    /* ---------------------------------------------------------------- */
    {
      id: "chaining",
      label: L("Prompt chaining", "Prompt chaining", "Chaînage de prompts"),
      controlFlow: L(
        "Your code fixes the order of steps.",
        "Code của bạn cố định thứ tự các bước.",
        "Votre code fixe l'ordre des étapes.",
      ),
      nodes: [
        { id: "in", kind: "io", label: L("Topic", "Chủ đề", "Sujet"), x: 125, y: 30, w: 150, h: 40 },
        { id: "outline", kind: "llm", label: L("LLM: outline", "LLM: dàn ý", "LLM : plan"), x: 125, y: 110, w: 150, h: 40 },
        { id: "gate", kind: "code", label: L("Gate: criteria?", "Cổng: đạt tiêu chí?", "Porte : critères ?"), x: 125, y: 190, w: 150, h: 40 },
        { id: "write", kind: "llm", label: L("LLM: write", "LLM: viết", "LLM : rédiger"), x: 125, y: 270, w: 150, h: 40 },
        { id: "out", kind: "io", label: L("Document", "Tài liệu", "Document"), x: 125, y: 350, w: 150, h: 40 },
        { id: "stop", kind: "stop", label: L("Stop early", "Dừng sớm", "Arrêt"), x: 275, y: 190, w: 110, h: 40 },
      ],
      edges: [
        { id: "e1", from: "in", to: "outline" },
        { id: "e2", from: "outline", to: "gate" },
        { id: "e3", from: "gate", to: "write" },
        { id: "e4", from: "write", to: "out" },
        { id: "e5", from: "gate", to: "stop" },
      ],
      variants: [
        {
          id: "pass",
          label: L("Outline passes", "Dàn ý đạt", "Plan validé"),
          hiddenNodes: ["stop"],
          steps: [
            {
              nodes: ["in", "outline"],
              edges: ["e1"],
              calls: 1,
              caption: L(
                "LLM call 1 turns the topic into an outline. One narrow job.",
                "Lần gọi LLM thứ 1 biến chủ đề thành dàn ý. Một nhiệm vụ hẹp duy nhất.",
                "L'appel LLM n° 1 transforme le sujet en plan. Une seule tâche, bien délimitée.",
              ),
            },
            {
              nodes: ["gate"],
              edges: ["e2"],
              calls: 0,
              caption: L(
                "A gate (plain code, no LLM) checks the outline against criteria, e.g. 3–6 sections, each with a goal.",
                "Một cổng kiểm tra (code thuần, không dùng LLM) đối chiếu dàn ý với tiêu chí, ví dụ 3–6 phần, mỗi phần có mục tiêu.",
                "Une porte (du code simple, sans LLM) vérifie le plan selon des critères, par ex. 3 à 6 sections ayant chacune un objectif.",
              ),
            },
            {
              nodes: ["write"],
              edges: ["e3"],
              calls: 1,
              caption: L(
                "Gate passed. LLM call 2 writes the document from the validated outline.",
                "Qua cổng. Lần gọi LLM thứ 2 viết tài liệu dựa trên dàn ý đã được kiểm tra.",
                "Porte franchie. L'appel LLM n° 2 rédige le document à partir du plan validé.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["e4"],
              calls: 0,
              outcome: "success",
              caption: L(
                "Done: 2 LLM calls in 2 sequential rounds. Slower than one call, but each step was easier to get right.",
                "Xong: 2 lần gọi LLM trong 2 vòng tuần tự. Chậm hơn một lần gọi, nhưng mỗi bước dễ làm đúng hơn.",
                "Terminé : 2 appels LLM en 2 tours séquentiels. Plus lent qu'un seul appel, mais chaque étape était plus facile à réussir.",
              ),
            },
          ],
        },
        {
          id: "fail",
          label: L("Outline fails", "Dàn ý không đạt", "Plan rejeté"),
          hiddenNodes: ["write", "out"],
          steps: [
            {
              nodes: ["in", "outline"],
              edges: ["e1"],
              calls: 1,
              caption: L(
                "LLM call 1 turns the topic into an outline.",
                "Lần gọi LLM thứ 1 biến chủ đề thành dàn ý.",
                "L'appel LLM n° 1 transforme le sujet en plan.",
              ),
            },
            {
              nodes: ["gate"],
              edges: ["e2"],
              calls: 0,
              caption: L(
                "The gate checks the outline. Two required sections are missing.",
                "Cổng kiểm tra dàn ý. Thiếu hai phần bắt buộc.",
                "La porte vérifie le plan. Deux sections obligatoires manquent.",
              ),
            },
            {
              nodes: ["stop"],
              edges: ["e5"],
              calls: 0,
              outcome: "rejected",
              caption: L(
                "Gate failed: stop (or retry step 1) before paying for the long writing call. Errors don't propagate down the chain.",
                "Không qua cổng: dừng lại (hoặc thử lại bước 1) trước khi tốn tiền cho lần gọi viết dài. Lỗi không lan xuống cuối chuỗi.",
                "Échec à la porte : on s'arrête (ou on relance l'étape 1) avant de payer le long appel de rédaction. L'erreur ne se propage pas dans la chaîne.",
              ),
            },
          ],
        },
      ],
    },
    /* ---------------------------------------------------------------- */
    {
      id: "routing",
      label: L("Routing", "Routing", "Routage"),
      controlFlow: L(
        "A classifier picks one predefined path.",
        "Bộ phân loại chọn một nhánh định sẵn.",
        "Un classifieur choisit un chemin prédéfini.",
      ),
      nodes: [
        { id: "in", kind: "io", label: L("Support ticket", "Ticket hỗ trợ", "Ticket support"), x: 170, y: 30, w: 180, h: 40 },
        { id: "router", kind: "llm", label: L("LLM: classify", "LLM: phân loại", "LLM : classer"), x: 170, y: 115, w: 160, h: 40 },
        { id: "refund", kind: "llm", label: L("Refunds", "Hoàn tiền", "Rembourser"), x: 60, y: 215, w: 100, h: 40 },
        { id: "tech", kind: "llm", label: L("Tech support", "Kỹ thuật", "Technique"), x: 170, y: 215, w: 100, h: 40 },
        { id: "general", kind: "llm", label: L("General", "Chung", "Général"), x: 280, y: 215, w: 100, h: 40 },
        { id: "out", kind: "io", label: L("Reply", "Phản hồi", "Réponse"), x: 170, y: 320, w: 140, h: 40 },
      ],
      edges: [
        { id: "r1", from: "in", to: "router" },
        { id: "r2", from: "router", to: "refund" },
        { id: "r3", from: "router", to: "tech" },
        { id: "r4", from: "router", to: "general" },
        { id: "r5", from: "refund", to: "out" },
        { id: "r6", from: "tech", to: "out" },
        { id: "r7", from: "general", to: "out" },
      ],
      variants: [
        {
          id: "refund",
          label: L("“I was charged twice”", "“Tôi bị trừ tiền hai lần”", "« J'ai été débité deux fois »"),
          steps: [
            {
              nodes: ["in", "router"],
              edges: ["r1"],
              calls: 1,
              caption: L(
                "The router LLM reads the ticket and classifies it: refund.",
                "LLM định tuyến đọc ticket và phân loại: hoàn tiền.",
                "Le LLM routeur lit le ticket et le classe : remboursement.",
              ),
            },
            {
              nodes: ["refund"],
              edges: ["r2"],
              calls: 1,
              caption: L(
                "A refund-specialized prompt with refund tools handles it. The other branches never run.",
                "Một prompt chuyên về hoàn tiền, kèm tool hoàn tiền, xử lý ticket. Các nhánh khác không chạy.",
                "Un prompt spécialisé, avec les outils de remboursement, le traite. Les autres branches ne s'exécutent jamais.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["r5"],
              calls: 0,
              outcome: "success",
              caption: L(
                "2 LLM calls. Each route has its own prompt, so improving refunds can't break tech support.",
                "2 lần gọi LLM. Mỗi nhánh có prompt riêng, nên cải thiện nhánh hoàn tiền không làm hỏng nhánh kỹ thuật.",
                "2 appels LLM. Chaque route a son propre prompt : améliorer les remboursements ne peut pas casser le support technique.",
              ),
            },
          ],
        },
        {
          id: "tech",
          label: L("“The app crashes on login”", "“App bị crash khi đăng nhập”", "« L'appli plante à la connexion »"),
          steps: [
            {
              nodes: ["in", "router"],
              edges: ["r1"],
              calls: 1,
              caption: L(
                "The router LLM classifies the ticket: technical problem.",
                "LLM định tuyến phân loại ticket: sự cố kỹ thuật.",
                "Le LLM routeur classe le ticket : problème technique.",
              ),
            },
            {
              nodes: ["tech"],
              edges: ["r3"],
              calls: 1,
              caption: L(
                "The tech-support path can search docs and logs: tools the refund path never needs.",
                "Nhánh kỹ thuật có thể tra tài liệu và log: những tool mà nhánh hoàn tiền không bao giờ cần.",
                "Le chemin technique peut chercher dans la doc et les logs : des outils dont la route remboursement n'a jamais besoin.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["r6"],
              calls: 0,
              outcome: "success",
              caption: L(
                "Separation of concerns: each specialized path is tuned and tested on its own.",
                "Tách biệt trách nhiệm: mỗi nhánh chuyên biệt được tinh chỉnh và kiểm thử riêng.",
                "Séparation des responsabilités : chaque chemin spécialisé est réglé et testé séparément.",
              ),
            },
          ],
        },
        {
          id: "general",
          label: L("“What are your opening hours?”", "“Mấy giờ bên bạn mở cửa?”", "« Quels sont vos horaires ? »"),
          nodeLabels: { general: L("General · small", "Chung · nhỏ", "Général · petit") },
          steps: [
            {
              nodes: ["in", "router"],
              edges: ["r1"],
              calls: 1,
              caption: L(
                "The router LLM classifies the ticket: easy, common question.",
                "LLM định tuyến phân loại: câu hỏi phổ biến, dễ.",
                "Le LLM routeur classe le ticket : question simple et fréquente.",
              ),
            },
            {
              nodes: ["general"],
              edges: ["r4"],
              calls: 1,
              caption: L(
                "Easy questions can go to a smaller, cheaper model; hard ones to a more capable one.",
                "Câu hỏi dễ có thể chuyển cho model nhỏ, rẻ hơn; câu khó cho model mạnh hơn.",
                "Les questions simples peuvent aller vers un modèle plus petit et moins cher ; les difficiles vers un modèle plus capable.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["r7"],
              calls: 0,
              outcome: "success",
              caption: L(
                "Routing optimizes cost as well as quality: pay for capability only where the input needs it.",
                "Routing tối ưu cả chi phí lẫn chất lượng: chỉ trả tiền cho năng lực khi đầu vào thực sự cần.",
                "Le routage optimise le coût autant que la qualité : on ne paie la capacité que là où l'entrée l'exige.",
              ),
            },
          ],
        },
      ],
    },
    /* ---------------------------------------------------------------- */
    {
      id: "parallel",
      label: L("Parallelization", "Song song hóa", "Parallélisation"),
      controlFlow: L(
        "Your code fans out fixed calls and aggregates.",
        "Code của bạn tỏa ra các lần gọi cố định rồi tổng hợp.",
        "Votre code lance des appels fixes en parallèle puis agrège.",
      ),
      nodes: [
        { id: "in", kind: "io", label: L("Request", "Yêu cầu", "Requête"), x: 170, y: 30, w: 160, h: 40 },
        { id: "w1", kind: "llm", label: L("LLM 1", "LLM 1", "LLM 1"), x: 60, y: 140, w: 100, h: 40 },
        { id: "w2", kind: "llm", label: L("LLM 2", "LLM 2", "LLM 2"), x: 170, y: 140, w: 100, h: 40 },
        { id: "w3", kind: "llm", label: L("LLM 3", "LLM 3", "LLM 3"), x: 280, y: 140, w: 100, h: 40 },
        { id: "agg", kind: "code", label: L("Code: aggregate", "Code: tổng hợp", "Code : agréger"), x: 170, y: 250, w: 170, h: 40 },
        { id: "out", kind: "io", label: L("Result", "Kết quả", "Résultat"), x: 170, y: 345, w: 160, h: 40 },
      ],
      edges: [
        { id: "p1", from: "in", to: "w1" },
        { id: "p2", from: "in", to: "w2" },
        { id: "p3", from: "in", to: "w3" },
        { id: "p4", from: "w1", to: "agg" },
        { id: "p5", from: "w2", to: "agg" },
        { id: "p6", from: "w3", to: "agg" },
        { id: "p7", from: "agg", to: "out" },
      ],
      variants: [
        {
          id: "sectioning",
          label: L("Sectioning: answer + guardrail", "Chia phần: trả lời + kiểm duyệt", "Sectionnement : réponse + garde-fou"),
          hiddenNodes: ["w3"],
          nodeLabels: {
            in: L("User question", "Câu hỏi người dùng", "Question utilisateur"),
            w1: L("Answer", "Trả lời", "Répondre"),
            w2: L("Screen", "Kiểm duyệt", "Filtrer"),
            agg: L("Code: combine", "Code: kết hợp", "Code : combiner"),
            out: L("Safe answer", "Câu trả lời an toàn", "Réponse sûre"),
          },
          steps: [
            {
              nodes: ["in", "w1", "w2"],
              edges: ["p1", "p2"],
              calls: 2,
              caption: L(
                "Two independent LLM calls start at the same time: one answers, one screens the request for inappropriate content.",
                "Hai lần gọi LLM độc lập chạy cùng lúc: một lần trả lời, một lần sàng lọc nội dung không phù hợp.",
                "Deux appels LLM indépendants démarrent en même temps : l'un répond, l'autre filtre les contenus inappropriés.",
              ),
            },
            {
              nodes: ["agg"],
              edges: ["p4", "p5"],
              calls: 0,
              caption: L(
                "Code combines the results: if the screen flags the request, the answer is withheld.",
                "Code kết hợp kết quả: nếu bộ lọc gắn cờ yêu cầu, câu trả lời sẽ bị giữ lại.",
                "Le code combine les résultats : si le filtre signale la requête, la réponse est retenue.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["p7"],
              calls: 0,
              outcome: "success",
              caption: L(
                "2 LLM calls but only 1 round of latency. Each call focuses on one consideration instead of juggling both.",
                "2 lần gọi LLM nhưng chỉ 1 vòng độ trễ. Mỗi lần gọi tập trung vào một khía cạnh thay vì ôm cả hai.",
                "2 appels LLM mais 1 seul tour de latence. Chaque appel se concentre sur un seul aspect au lieu de jongler avec les deux.",
              ),
            },
          ],
        },
        {
          id: "voting",
          label: L("Voting: 3 reviewers", "Bỏ phiếu: 3 reviewer", "Vote : 3 relecteurs"),
          nodeLabels: {
            in: L("Code change", "Thay đổi code", "Modification"),
            w1: L("Reviewer A", "Reviewer A", "Relecteur A"),
            w2: L("Reviewer B", "Reviewer B", "Relecteur B"),
            w3: L("Reviewer C", "Reviewer C", "Relecteur C"),
            agg: L("Code: 2-of-3 vote", "Code: 2/3 phiếu", "Code : vote 2 sur 3"),
            out: L("Flag for review", "Gắn cờ để review", "Signaler"),
          },
          steps: [
            {
              nodes: ["in", "w1", "w2", "w3"],
              edges: ["p1", "p2", "p3"],
              calls: 3,
              caption: L(
                "The same question, “is this change vulnerable?”, goes to three differently-prompted reviewers in parallel.",
                "Cùng một câu hỏi, “thay đổi này có lỗ hổng không?”, được gửi song song tới ba reviewer với prompt khác nhau.",
                "La même question, « cette modification est-elle vulnérable ? », part en parallèle vers trois relecteurs aux prompts différents.",
              ),
            },
            {
              nodes: ["agg"],
              edges: ["p4", "p5", "p6"],
              calls: 0,
              caption: L(
                "Two of three reviewers flag a possible SQL injection. Code applies the threshold: 2 of 3.",
                "Hai trên ba reviewer phát hiện nguy cơ SQL injection. Code áp dụng ngưỡng: 2 trên 3.",
                "Deux relecteurs sur trois signalent une possible injection SQL. Le code applique le seuil : 2 sur 3.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["p7"],
              calls: 0,
              outcome: "success",
              caption: L(
                "Flagged. 3 calls in 1 round. Moving the threshold trades false positives against false negatives.",
                "Đã gắn cờ. 3 lần gọi trong 1 vòng. Dịch ngưỡng là đánh đổi giữa dương tính giả và âm tính giả.",
                "Signalé. 3 appels en 1 tour. Déplacer le seuil arbitre entre faux positifs et faux négatifs.",
              ),
            },
          ],
        },
      ],
    },
    /* ---------------------------------------------------------------- */
    {
      id: "orchestrator",
      label: L("Orchestrator-workers", "Orchestrator-workers", "Orchestrateur-workers"),
      controlFlow: L(
        "An LLM decides the subtasks at runtime.",
        "Một LLM quyết định các tác vụ con lúc chạy.",
        "Un LLM décide des sous-tâches à l'exécution.",
      ),
      nodes: [
        { id: "in", kind: "io", label: L("Task", "Nhiệm vụ", "Tâche"), x: 170, y: 30, w: 200, h: 40 },
        { id: "orch", kind: "llm", label: L("Orchestrator: plan", "Orchestrator: lập kế hoạch", "Orchestrateur : plan"), x: 170, y: 110, w: 200, h: 40 },
        { id: "w1", kind: "llm", label: L("Worker 1", "Worker 1", "Worker 1"), x: 60, y: 200, w: 100, h: 40 },
        { id: "w2", kind: "llm", label: L("Worker 2", "Worker 2", "Worker 2"), x: 170, y: 200, w: 100, h: 40 },
        { id: "w3", kind: "llm", label: L("Worker 3", "Worker 3", "Worker 3"), x: 280, y: 200, w: 100, h: 40 },
        { id: "synth", kind: "llm", label: L("Orchestrator: synthesize", "Orchestrator: tổng hợp", "Orchestrateur : synthèse"), x: 170, y: 290, w: 210, h: 40 },
        { id: "out", kind: "io", label: L("Change set", "Bộ thay đổi", "Modifications"), x: 170, y: 365, w: 160, h: 40 },
      ],
      edges: [
        { id: "o1", from: "in", to: "orch" },
        { id: "o2", from: "orch", to: "w1" },
        { id: "o3", from: "orch", to: "w2" },
        { id: "o4", from: "orch", to: "w3" },
        { id: "o5", from: "w1", to: "synth" },
        { id: "o6", from: "w2", to: "synth" },
        { id: "o7", from: "w3", to: "synth" },
        { id: "o8", from: "synth", to: "out" },
      ],
      variants: [
        {
          id: "small",
          label: L("Rename a function", "Đổi tên một hàm", "Renommer une fonction"),
          hiddenNodes: ["w3"],
          nodeLabels: {
            in: L("Rename a function", "Đổi tên một hàm", "Renommer une fonction"),
            w1: L("api.ts", "api.ts", "api.ts"),
            w2: L("client.ts", "client.ts", "client.ts"),
          },
          steps: [
            {
              nodes: ["in", "orch"],
              edges: ["o1"],
              calls: 1,
              caption: L(
                "The orchestrator reads the request and the repo, then decides at runtime: 2 files need changes.",
                "Orchestrator đọc yêu cầu và repo, rồi quyết định lúc chạy: cần sửa 2 file.",
                "L'orchestrateur lit la demande et le dépôt, puis décide à l'exécution : 2 fichiers à modifier.",
              ),
            },
            {
              nodes: ["w1", "w2"],
              edges: ["o2", "o3"],
              calls: 2,
              caption: L(
                "Two workers edit their files in parallel, each with a small, focused context.",
                "Hai worker sửa file của mình song song, mỗi worker có ngữ cảnh nhỏ và tập trung.",
                "Deux workers modifient leurs fichiers en parallèle, chacun avec un contexte réduit et ciblé.",
              ),
            },
            {
              nodes: ["synth"],
              edges: ["o5", "o6"],
              calls: 1,
              caption: L(
                "The orchestrator collects the edits and checks that they are consistent with each other.",
                "Orchestrator thu thập các chỉnh sửa và kiểm tra chúng có nhất quán với nhau không.",
                "L'orchestrateur rassemble les modifications et vérifie leur cohérence.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["o8"],
              calls: 0,
              outcome: "success",
              caption: L(
                "4 LLM calls, 3 rounds. Your code never listed these subtasks: the model chose them.",
                "4 lần gọi LLM, 3 vòng. Code của bạn không hề liệt kê các tác vụ con này: model đã tự chọn.",
                "4 appels LLM, 3 tours. Votre code n'a jamais listé ces sous-tâches : c'est le modèle qui les a choisies.",
              ),
            },
          ],
        },
        {
          id: "large",
          label: L("Add a field to an API", "Thêm trường vào API", "Ajouter un champ à l'API"),
          nodeLabels: {
            in: L("Add a field to an API", "Thêm trường vào API", "Ajouter un champ à l'API"),
            w1: L("schema.ts", "schema.ts", "schema.ts"),
            w2: L("handler.ts", "handler.ts", "handler.ts"),
            w3: L("docs", "docs", "docs"),
          },
          steps: [
            {
              nodes: ["in", "orch"],
              edges: ["o1"],
              calls: 1,
              caption: L(
                "Same pattern, different input. The orchestrator decides this change touches 3 places: schema, handler and docs.",
                "Cùng pattern, đầu vào khác. Orchestrator xác định thay đổi này chạm tới 3 chỗ: schema, handler và docs.",
                "Même pattern, autre entrée. L'orchestrateur décide que ce changement touche 3 endroits : schéma, handler et doc.",
              ),
            },
            {
              nodes: ["w1", "w2", "w3"],
              edges: ["o2", "o3", "o4"],
              calls: 3,
              caption: L(
                "Three workers run in parallel. The input, not your code, determined how many.",
                "Ba worker chạy song song. Chính đầu vào, chứ không phải code của bạn, quyết định số lượng.",
                "Trois workers tournent en parallèle. C'est l'entrée, pas votre code, qui en a fixé le nombre.",
              ),
            },
            {
              nodes: ["synth"],
              edges: ["o5", "o6", "o7"],
              calls: 1,
              caption: L(
                "The orchestrator synthesizes the results into one consistent change.",
                "Orchestrator tổng hợp kết quả thành một thay đổi nhất quán.",
                "L'orchestrateur synthétise les résultats en une modification cohérente.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["o8"],
              calls: 0,
              outcome: "success",
              caption: L(
                "5 LLM calls, 3 rounds. Flexible, but harder to bound: cost depends on the plan the model makes.",
                "5 lần gọi LLM, 3 vòng. Linh hoạt nhưng khó giới hạn: chi phí phụ thuộc vào kế hoạch model đưa ra.",
                "5 appels LLM, 3 tours. Flexible, mais plus difficile à borner : le coût dépend du plan établi par le modèle.",
              ),
            },
          ],
        },
      ],
    },
    /* ---------------------------------------------------------------- */
    {
      id: "evaluator",
      label: L("Evaluator-optimizer", "Evaluator-optimizer", "Évaluateur-optimiseur"),
      controlFlow: L(
        "Your code runs the loop; an LLM judges quality.",
        "Code của bạn chạy vòng lặp; một LLM chấm chất lượng.",
        "Votre code gère la boucle ; un LLM juge la qualité.",
      ),
      nodes: [
        { id: "in", kind: "io", label: L("Source text", "Văn bản gốc", "Texte source"), x: 170, y: 30, w: 180, h: 40 },
        { id: "gen", kind: "llm", label: L("Generator: translate", "Generator: dịch", "Générateur : traduire"), x: 170, y: 125, w: 200, h: 40 },
        { id: "eval", kind: "llm", label: L("Evaluator: critique", "Evaluator: nhận xét", "Évaluateur : critique"), x: 170, y: 240, w: 200, h: 40 },
        { id: "out", kind: "io", label: L("Final translation", "Bản dịch cuối", "Traduction finale"), x: 170, y: 345, w: 180, h: 40 },
      ],
      edges: [
        { id: "v1", from: "in", to: "gen" },
        { id: "v2", from: "gen", to: "eval", bend: 45 },
        { id: "v3", from: "eval", to: "gen", bend: 45 },
        { id: "v4", from: "eval", to: "out" },
      ],
      variants: [
        {
          id: "good",
          label: L("Strong first draft", "Bản nháp đầu tốt", "Bon premier jet"),
          steps: [
            {
              nodes: ["in", "gen"],
              edges: ["v1"],
              calls: 1,
              caption: L(
                "The generator translates the text.",
                "Generator dịch văn bản.",
                "Le générateur traduit le texte.",
              ),
            },
            {
              nodes: ["eval"],
              edges: ["v2"],
              calls: 1,
              caption: L(
                "The evaluator checks clear criteria: meaning, tone, idioms. Verdict: acceptable.",
                "Evaluator kiểm tra theo tiêu chí rõ ràng: nghĩa, giọng văn, thành ngữ. Kết luận: đạt.",
                "L'évaluateur vérifie des critères clairs : sens, ton, expressions idiomatiques. Verdict : acceptable.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["v4"],
              calls: 0,
              outcome: "success",
              caption: L(
                "Accepted after 1 round: 2 LLM calls. The loop only costs more when quality needs it.",
                "Được chấp nhận sau 1 vòng: 2 lần gọi LLM. Vòng lặp chỉ tốn thêm khi chất lượng cần.",
                "Accepté après 1 tour : 2 appels LLM. La boucle ne coûte plus que si la qualité l'exige.",
              ),
            },
          ],
        },
        {
          id: "revise",
          label: L("Draft needs revision", "Bản nháp cần sửa", "Brouillon à réviser"),
          steps: [
            {
              nodes: ["in", "gen"],
              edges: ["v1"],
              calls: 1,
              caption: L(
                "The generator translates the text.",
                "Generator dịch văn bản.",
                "Le générateur traduit le texte.",
              ),
            },
            {
              nodes: ["eval"],
              edges: ["v2"],
              calls: 1,
              caption: L(
                "Critique: an idiom was translated word for word and lost its meaning. Specific feedback goes back.",
                "Nhận xét: một thành ngữ bị dịch từng chữ nên mất nghĩa. Phản hồi cụ thể được gửi lại.",
                "Critique : une expression a été traduite mot à mot et a perdu son sens. Un retour précis repart.",
              ),
            },
            {
              nodes: ["gen"],
              edges: ["v3"],
              calls: 1,
              caption: L(
                "The generator revises using the feedback, like a writer working from an editor's notes.",
                "Generator sửa lại dựa trên phản hồi, như người viết làm việc với ghi chú của biên tập viên.",
                "Le générateur révise à partir du retour, comme un auteur avec les notes de son éditeur.",
              ),
            },
            {
              nodes: ["eval"],
              edges: ["v2"],
              calls: 1,
              caption: L(
                "Second review: all criteria met.",
                "Đánh giá lần hai: đạt mọi tiêu chí.",
                "Seconde relecture : tous les critères sont remplis.",
              ),
            },
            {
              nodes: ["out"],
              edges: ["v4"],
              calls: 0,
              outcome: "success",
              caption: L(
                "4 LLM calls in 4 sequential rounds. In production, cap the rounds: an evaluator may never be fully satisfied.",
                "4 lần gọi LLM trong 4 vòng tuần tự. Khi chạy thật, hãy giới hạn số vòng: evaluator có thể không bao giờ hài lòng hoàn toàn.",
                "4 appels LLM en 4 tours séquentiels. En production, plafonnez le nombre de tours : un évaluateur peut ne jamais être pleinement satisfait.",
              ),
            },
          ],
        },
      ],
    },
    /* ---------------------------------------------------------------- */
    {
      id: "agent",
      label: L("Autonomous agent", "Agent tự chủ", "Agent autonome"),
      controlFlow: L(
        "The model decides each next step; code enforces limits.",
        "Model quyết định từng bước tiếp theo; code áp đặt giới hạn.",
        "Le modèle décide chaque étape ; le code impose les limites.",
      ),
      nodes: [
        { id: "human", kind: "human", label: L("You: fix the failing test", "Bạn: sửa test đang lỗi", "Vous : corrige le test"), x: 170, y: 30, w: 230, h: 40 },
        { id: "agent", kind: "llm", label: L("Agent: next action?", "Agent: bước tiếp?", "Agent : action ?"), x: 105, y: 130, w: 170, h: 40 },
        { id: "exit", kind: "stop", label: L("Exit", "Thoát", "Sortie"), x: 275, y: 130, w: 100, h: 40 },
        { id: "tools", kind: "tool", label: L("Tools: read · edit · test", "Tool: đọc · sửa · test", "Outils : lire · éditer · tester"), x: 235, y: 235, w: 190, h: 40 },
        { id: "env", kind: "code", label: L("Environment: repo", "Môi trường: repo", "Environnement : dépôt"), x: 105, y: 340, w: 170, h: 40 },
      ],
      edges: [
        { id: "a0", from: "human", to: "agent" },
        { id: "a1", from: "agent", to: "tools" },
        { id: "a2", from: "tools", to: "env" },
        { id: "a3", from: "env", to: "agent", bend: -30 },
        { id: "a4", from: "agent", to: "exit" },
      ],
      variants: [
        {
          id: "limit5",
          label: L("Limit: 5 iterations", "Giới hạn: 5 vòng", "Limite : 5 itérations"),
          nodeLabels: { exit: L("Done ✓", "Xong ✓", "Fini ✓") },
          steps: [
            {
              nodes: ["human", "agent"],
              edges: ["a0"],
              calls: 1,
              caption: L(
                "Iteration 1: the agent reads the goal and chooses its first action: open the failing test and the code under test.",
                "Vòng 1: agent đọc mục tiêu và chọn hành động đầu tiên: mở test đang lỗi và đoạn code được test.",
                "Itération 1 : l'agent lit l'objectif et choisit sa première action : ouvrir le test en échec et le code testé.",
              ),
            },
            {
              nodes: ["tools", "env"],
              edges: ["a1", "a2"],
              calls: 0,
              caption: L(
                "The tool runs. The result, the real file contents, is ground truth from the environment, not a guess.",
                "Tool chạy. Kết quả, tức nội dung file thật, là sự thật từ môi trường, không phải phỏng đoán.",
                "L'outil s'exécute. Le résultat, le vrai contenu des fichiers, est une vérité terrain issue de l'environnement, pas une supposition.",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["a3"],
              calls: 1,
              caption: L(
                "Iteration 2: with the code in view, the agent edits the function and runs the tests.",
                "Vòng 2: khi đã thấy code, agent sửa hàm và chạy test.",
                "Itération 2 : le code sous les yeux, l'agent modifie la fonction et lance les tests.",
              ),
            },
            {
              nodes: ["tools", "env"],
              edges: ["a1", "a2"],
              calls: 0,
              caption: L(
                "Test output: one test still fails (an off-by-one at a boundary). That's feedback, not failure.",
                "Kết quả test: vẫn còn một test lỗi (sai lệch một đơn vị ở biên). Đó là phản hồi, không phải thất bại.",
                "Sortie des tests : un test échoue encore (une erreur de un à une borne). C'est un retour, pas un échec.",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["a3"],
              calls: 1,
              caption: L(
                "Iteration 3: the agent reads the error, fixes the boundary and reruns the tests.",
                "Vòng 3: agent đọc lỗi, sửa điều kiện biên và chạy lại test.",
                "Itération 3 : l'agent lit l'erreur, corrige la borne et relance les tests.",
              ),
            },
            {
              nodes: ["tools", "env"],
              edges: ["a1", "a2"],
              calls: 0,
              caption: L("All tests pass.", "Tất cả test đều pass.", "Tous les tests passent."),
            },
            {
              nodes: ["agent", "exit"],
              edges: ["a3", "a4"],
              calls: 1,
              outcome: "success",
              caption: L(
                "The agent sees green tests and stops: the goal was verified by the environment. 4 LLM calls, and the model chose how many steps to take.",
                "Agent thấy test xanh và dừng: mục tiêu được môi trường xác nhận. 4 lần gọi LLM, và chính model chọn số bước.",
                "L'agent voit les tests au vert et s'arrête : l'objectif est vérifié par l'environnement. 4 appels LLM, et c'est le modèle qui a choisi le nombre d'étapes.",
              ),
            },
          ],
        },
        {
          id: "limit2",
          label: L("Limit: 2 iterations", "Giới hạn: 2 vòng", "Limite : 2 itérations"),
          nodeLabels: { exit: L("Stop → human", "Dừng → người", "Stop → humain") },
          steps: [
            {
              nodes: ["human", "agent"],
              edges: ["a0"],
              calls: 1,
              caption: L(
                "Iteration 1: the agent chooses its first action: open the failing test and the code under test.",
                "Vòng 1: agent chọn hành động đầu tiên: mở test đang lỗi và đoạn code được test.",
                "Itération 1 : l'agent choisit sa première action : ouvrir le test en échec et le code testé.",
              ),
            },
            {
              nodes: ["tools", "env"],
              edges: ["a1", "a2"],
              calls: 0,
              caption: L(
                "The tool returns the real file contents: ground truth from the environment.",
                "Tool trả về nội dung file thật: sự thật từ môi trường.",
                "L'outil renvoie le vrai contenu des fichiers : une vérité terrain.",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["a3"],
              calls: 1,
              caption: L(
                "Iteration 2: the agent edits the function and runs the tests.",
                "Vòng 2: agent sửa hàm và chạy test.",
                "Itération 2 : l'agent modifie la fonction et lance les tests.",
              ),
            },
            {
              nodes: ["tools", "env"],
              edges: ["a1", "a2"],
              calls: 0,
              caption: L(
                "One test still fails.",
                "Vẫn còn một test lỗi.",
                "Un test échoue encore.",
              ),
            },
            {
              nodes: ["exit"],
              edges: ["a3", "a4"],
              calls: 0,
              outcome: "stopped",
              caption: L(
                "Stopping condition: 2 iterations used. Code enforces the limit, so no LLM call is needed. The agent hands a human its trace: what it tried and what still fails.",
                "Điều kiện dừng: đã dùng 2 vòng. Code áp đặt giới hạn nên không cần gọi LLM. Agent chuyển cho con người toàn bộ trace: đã thử gì và cái gì còn lỗi.",
                "Condition d'arrêt : 2 itérations utilisées. Le code impose la limite, sans appel LLM. L'agent transmet sa trace à un humain : ce qu'il a tenté et ce qui échoue encore.",
              ),
            },
          ],
        },
      ],
    },
  ],
};
