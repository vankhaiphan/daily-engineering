import type { ChartFrame, ChartSpec, FlowEdge, FlowExplorerSpec, FlowNode, Localized, VisualSpec } from "@/content/schema";
import { formatPercent } from "@/lib/format";

const L = (en: string, vi: string, fr: string): Localized => ({ en, vi, fr });
const same = (text: string): Localized => ({ en: text, vi: text, fr: text });

/* ------------------------------------------------------------------ */
/* 1. Anatomy of one trial (flow)                                      */
/* ------------------------------------------------------------------ */

const NODES: FlowNode[] = [
  { id: "task", kind: "io", label: L("Task + success criteria", "Task + tiêu chí đạt", "Tâche + critères de réussite"), x: 170, y: 28, w: 230, h: 38 },
  { id: "env", kind: "tool", label: L("Fresh environment", "Môi trường sạch", "Environnement neuf"), x: 170, y: 96, w: 180, h: 38 },
  { id: "agent", kind: "llm", label: L("Agent runs a trial", "Agent chạy một trial", "L'agent fait un essai"), x: 170, y: 164, w: 180, h: 38 },
  { id: "transcript", kind: "io", label: L("Transcript", "Transcript", "Transcription"), x: 85, y: 238, w: 140, h: 38 },
  { id: "outcome", kind: "io", label: L("Outcome (final state)", "Outcome (trạng thái cuối)", "Résultat (état final)"), x: 255, y: 238, w: 150, h: 38 },
  { id: "code", kind: "code", label: L("Code grader", "Grader bằng code", "Grader en code"), x: 85, y: 314, w: 140, h: 38 },
  { id: "judge", kind: "llm", label: L("LLM judge", "LLM chấm điểm", "Juge LLM"), x: 255, y: 314, w: 140, h: 38 },
  { id: "score", kind: "stop", label: L("Trial score", "Điểm của trial", "Score de l'essai"), x: 170, y: 390, w: 180, h: 38 },
];

const EDGES: FlowEdge[] = [
  { id: "t1", from: "task", to: "env" },
  { id: "t2", from: "env", to: "agent" },
  { id: "t3", from: "agent", to: "transcript" },
  { id: "t4", from: "agent", to: "outcome" },
  { id: "t5", from: "outcome", to: "code" },
  { id: "t6", from: "transcript", to: "judge" },
  { id: "t7", from: "transcript", to: "code" },
  { id: "t8", from: "code", to: "score" },
  { id: "t9", from: "judge", to: "score" },
];

export const evalPipeline: FlowExplorerSpec = {
  kind: "flow",
  id: "eval-pipeline",
  viewBox: { width: 340, height: 420 },
  scenarioLabel: L("Task type", "Loại task", "Type de tâche"),
  metrics: "calls",
  scenarios: [
    {
      id: "coding",
      label: L("Coding task", "Task lập trình", "Tâche de code"),
      controlFlow: L(
        "Code graders check the repository the agent leaves behind.",
        "Grader bằng code kiểm tra repo mà agent để lại.",
        "Des graders en code vérifient le dépôt laissé par l'agent.",
      ),
      nodes: NODES,
      edges: EDGES,
      variants: [
        {
          id: "honest-fix",
          label: L("Agent fixes the bug", "Agent sửa đúng lỗi", "L'agent corrige le bug"),
          hiddenNodes: ["judge"],
          steps: [
            {
              nodes: ["task", "env"],
              edges: ["t1"],
              calls: 0,
              caption: L(
                "The harness loads the task (fix a failing login check) and starts a fresh copy of the repository: nothing left over from earlier trials.",
                "Harness nạp task (sửa lỗi kiểm tra đăng nhập) và khởi tạo một bản repo mới: không còn gì sót lại từ các trial trước.",
                "Le harness charge la tâche (corriger une vérification de connexion) et démarre une copie neuve du dépôt : rien ne reste des essais précédents.",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["t2"],
              calls: 6,
              caption: L(
                "The agent works: reads files, edits code, runs tests. In this trial that takes 6 LLM calls.",
                "Agent làm việc: đọc file, sửa code, chạy test. Trial này tốn 6 lần gọi LLM.",
                "L'agent travaille : lit des fichiers, modifie le code, lance les tests. Cet essai coûte 6 appels LLM.",
              ),
            },
            {
              nodes: ["transcript", "outcome"],
              edges: ["t3", "t4"],
              calls: 0,
              caption: L(
                "Two records come out: the transcript (every message and tool call) and the outcome (the repository as it really is now).",
                "Có hai bản ghi: transcript (mọi tin nhắn và lần gọi tool) và outcome (repo thực sự trông thế nào lúc này).",
                "Deux traces en sortent : la transcription (chaque message et appel d'outil) et le résultat (le dépôt tel qu'il est vraiment).",
              ),
            },
            {
              nodes: ["code"],
              edges: ["t5", "t7"],
              calls: 0,
              caption: L(
                "Code grader: run the original test suite on the final repository, and check from the transcript that no test file was edited. Everything passes.",
                "Grader bằng code: chạy bộ test gốc trên repo cuối, và kiểm tra trong transcript rằng không file test nào bị sửa. Tất cả đều pass.",
                "Grader en code : lancer la suite de tests d'origine sur le dépôt final et vérifier dans la transcription qu'aucun fichier de test n'a été modifié. Tout passe.",
              ),
            },
            {
              nodes: ["score"],
              edges: ["t8"],
              calls: 0,
              outcome: "success",
              caption: L(
                "This trial passes. One pass is not a pass rate: run several trials to see how consistent the agent is.",
                "Trial này pass. Một lần pass chưa phải tỷ lệ pass: hãy chạy nhiều trial để xem agent ổn định đến đâu.",
                "Cet essai réussit. Une réussite n'est pas un taux de réussite : lancez plusieurs essais pour mesurer la régularité.",
              ),
            },
          ],
        },
        {
          id: "edits-test",
          label: L("Agent edits the test instead", "Agent sửa test thay vì sửa lỗi", "L'agent modifie le test"),
          hiddenNodes: ["judge"],
          steps: [
            {
              nodes: ["task", "env"],
              edges: ["t1"],
              calls: 0,
              caption: L(
                "Same task, fresh repository.",
                "Cùng task, repo mới.",
                "Même tâche, dépôt neuf.",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["t2"],
              calls: 6,
              caption: L(
                "The agent can't find the bug, so it changes the test's expected value until the test passes.",
                "Agent không tìm ra lỗi nên sửa giá trị mong đợi trong test cho đến khi test pass.",
                "L'agent ne trouve pas le bug : il change la valeur attendue du test jusqu'à ce qu'il passe.",
              ),
            },
            {
              nodes: ["transcript", "outcome"],
              edges: ["t3", "t4"],
              calls: 0,
              caption: L(
                "The transcript shows an edit to a test file. The repository's own tests are now green.",
                "Transcript cho thấy một chỉnh sửa trong file test. Các test trong repo giờ đều xanh.",
                "La transcription montre une modification d'un fichier de test. Les tests du dépôt sont maintenant au vert.",
              ),
            },
            {
              nodes: ["code"],
              edges: ["t5", "t7"],
              calls: 0,
              caption: L(
                "The grader runs the original tests, not the edited ones, and flags the test-file change. A grader that trusted the repository's tests would have been fooled.",
                "Grader chạy bộ test gốc, không phải bản đã sửa, và gắn cờ việc sửa file test. Một grader tin vào test trong repo sẽ bị lừa.",
                "Le grader lance les tests d'origine, pas ceux modifiés, et signale la modification du fichier de test. Un grader qui ferait confiance aux tests du dépôt aurait été dupé.",
              ),
            },
            {
              nodes: ["score"],
              edges: ["t8"],
              calls: 0,
              outcome: "failed",
              caption: L(
                "The trial fails, for the right reason. Graders must resist shortcuts, or the score measures gaming instead of skill.",
                "Trial thất bại, và đúng lý do. Grader phải chống được đường tắt, nếu không điểm số sẽ đo khả năng lách luật thay vì năng lực.",
                "L'essai échoue, pour la bonne raison. Les graders doivent résister aux raccourcis, sinon le score mesure la triche plutôt que la compétence.",
              ),
            },
          ],
        },
      ],
    },
    {
      id: "support",
      label: L("Support conversation", "Hội thoại hỗ trợ", "Conversation support"),
      controlFlow: L(
        "Code checks the database; an LLM judge scores tone with a rubric.",
        "Code kiểm tra database; LLM chấm giọng văn theo rubric.",
        "Le code vérifie la base ; un juge LLM note le ton avec une grille.",
      ),
      nodes: NODES,
      edges: EDGES,
      variants: [
        {
          id: "good-refund",
          label: L("Correct refund", "Hoàn tiền đúng", "Remboursement correct"),
          steps: [
            {
              nodes: ["task", "env"],
              edges: ["t1"],
              calls: 0,
              caption: L(
                "Task: a customer was charged twice. The environment is a test orders database containing the duplicate charge.",
                "Task: khách bị trừ tiền hai lần. Môi trường là một database đơn hàng thử nghiệm có sẵn khoản trừ trùng.",
                "Tâche : un client a été débité deux fois. L'environnement est une base de commandes de test contenant le double débit.",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["t2"],
              calls: 8,
              caption: L(
                "The agent talks with a simulated user and calls tools: 8 LLM calls, within the 10-turn limit.",
                "Agent trò chuyện với một người dùng giả lập và gọi tool: 8 lần gọi LLM, trong giới hạn 10 lượt.",
                "L'agent discute avec un utilisateur simulé et appelle des outils : 8 appels LLM, sous la limite de 10 tours.",
              ),
            },
            {
              nodes: ["transcript", "outcome"],
              edges: ["t3", "t4"],
              calls: 0,
              caption: L(
                "Transcript: the whole conversation. Outcome: the orders database after the conversation.",
                "Transcript: toàn bộ cuộc hội thoại. Outcome: database đơn hàng sau cuộc hội thoại.",
                "Transcription : toute la conversation. Résultat : la base de commandes après la conversation.",
              ),
            },
            {
              nodes: ["code", "judge"],
              edges: ["t5", "t6", "t7"],
              calls: 1,
              caption: L(
                "Code grader: exactly one refund, for the right amount. LLM judge: scores politeness and clarity with a rubric (one extra LLM call).",
                "Grader bằng code: đúng một lần hoàn tiền, đúng số tiền. LLM chấm điểm: đánh giá lịch sự và rõ ràng theo rubric (thêm một lần gọi LLM).",
                "Grader en code : exactement un remboursement, du bon montant. Juge LLM : note la politesse et la clarté avec une grille (un appel LLM de plus).",
              ),
            },
            {
              nodes: ["score"],
              edges: ["t8", "t9"],
              calls: 0,
              outcome: "success",
              caption: L(
                "Pass on both dimensions. Grading each dimension separately tells you which one broke when a trial fails.",
                "Đạt cả hai tiêu chí. Chấm riêng từng tiêu chí giúp biết chính xác cái nào hỏng khi một trial thất bại.",
                "Réussi sur les deux dimensions. Noter chaque dimension séparément indique laquelle a cassé quand un essai échoue.",
              ),
            },
          ],
        },
        {
          id: "double-refund",
          label: L("Polite but wrong", "Lịch sự nhưng sai", "Poli mais faux"),
          steps: [
            {
              nodes: ["task", "env"],
              edges: ["t1"],
              calls: 0,
              caption: L(
                "Same task, same starting database.",
                "Cùng task, cùng database ban đầu.",
                "Même tâche, même base de départ.",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["t2"],
              calls: 9,
              caption: L(
                "The agent apologizes, calls the refund tool, gets a slow response, and calls it again.",
                "Agent xin lỗi, gọi tool hoàn tiền, nhận phản hồi chậm, rồi gọi lại lần nữa.",
                "L'agent s'excuse, appelle l'outil de remboursement, reçoit une réponse lente et le rappelle.",
              ),
            },
            {
              nodes: ["transcript", "outcome"],
              edges: ["t3", "t4"],
              calls: 0,
              caption: L(
                "The transcript reads well. The database now holds two refunds.",
                "Transcript đọc rất ổn. Nhưng database giờ có hai lần hoàn tiền.",
                "La transcription est impeccable. La base contient maintenant deux remboursements.",
              ),
            },
            {
              nodes: ["code", "judge"],
              edges: ["t5", "t6", "t7"],
              calls: 1,
              caption: L(
                "The LLM judge rates the conversation polite and clear. The code grader finds the second refund.",
                "LLM chấm cuộc hội thoại là lịch sự và rõ ràng. Grader bằng code phát hiện lần hoàn tiền thứ hai.",
                "Le juge LLM trouve la conversation polie et claire. Le grader en code trouve le second remboursement.",
              ),
            },
            {
              nodes: ["score"],
              edges: ["t8", "t9"],
              calls: 0,
              outcome: "failed",
              caption: L(
                "Fail. The transcript sounded right; the outcome was wrong. When they disagree, trust the outcome.",
                "Thất bại. Transcript nghe thì đúng; outcome thì sai. Khi hai thứ mâu thuẫn, hãy tin outcome.",
                "Échec. La transcription semblait juste ; le résultat était faux. En cas de désaccord, fiez-vous au résultat.",
              ),
            },
          ],
        },
      ],
    },
    {
      id: "always-fails",
      label: L("Task fails every time", "Task luôn thất bại", "Tâche toujours ratée"),
      controlFlow: L(
        "A 0% task usually means the task or grader is broken.",
        "Task 0% thường có nghĩa là task hoặc grader bị hỏng.",
        "Une tâche à 0 % signifie souvent que la tâche ou le grader est cassé.",
      ),
      nodes: NODES,
      edges: EDGES,
      variants: [
        {
          id: "rigid-grader",
          label: L("Rigid grader", "Grader quá cứng", "Grader trop rigide"),
          hiddenNodes: ["judge"],
          steps: [
            {
              nodes: ["task", "env"],
              edges: ["t1"],
              calls: 0,
              caption: L(
                "Task: compute a ratio from a dataset. The expected answer is stored as the text \"0.33\".",
                "Task: tính một tỷ lệ từ bộ dữ liệu. Đáp án mong đợi được lưu dưới dạng chuỗi \"0.33\".",
                "Tâche : calculer un ratio à partir d'un jeu de données. La réponse attendue est stockée sous forme de texte « 0.33 ».",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["t2"],
              calls: 5,
              caption: L(
                "The agent computes the ratio correctly and reports 0.3333.",
                "Agent tính đúng tỷ lệ và trả về 0.3333.",
                "L'agent calcule correctement le ratio et répond 0.3333.",
              ),
            },
            {
              nodes: ["transcript", "outcome"],
              edges: ["t3", "t4"],
              calls: 0,
              caption: L(
                "The outcome contains the right number, with more decimals.",
                "Outcome chứa đúng con số, chỉ là nhiều chữ số thập phân hơn.",
                "Le résultat contient le bon nombre, avec plus de décimales.",
              ),
            },
            {
              nodes: ["code"],
              edges: ["t5"],
              calls: 0,
              caption: L(
                "The grader compares strings exactly: \"0.3333\" ≠ \"0.33\". Fail, on every trial.",
                "Grader so sánh chuỗi tuyệt đối: \"0.3333\" ≠ \"0.33\". Thất bại ở mọi trial.",
                "Le grader compare les textes à l'identique : « 0.3333 » ≠ « 0.33 ». Échec à chaque essai.",
              ),
            },
            {
              nodes: ["score"],
              edges: ["t8"],
              calls: 0,
              outcome: "failed",
              caption: L(
                "0% across 50 trials. Read the transcripts before blaming the agent: here the grader is wrong. Fix it by comparing numbers with a tolerance.",
                "0% qua 50 trial. Hãy đọc transcript trước khi đổ lỗi cho agent: ở đây grader mới sai. Sửa bằng cách so sánh số với một sai số cho phép.",
                "0 % sur 50 essais. Lisez les transcriptions avant d'accuser l'agent : ici c'est le grader qui se trompe. Corrigez-le en comparant des nombres avec une tolérance.",
              ),
            },
          ],
        },
        {
          id: "vague-task",
          label: L("Vague success criteria", "Tiêu chí mơ hồ", "Critères flous"),
          hiddenNodes: ["code"],
          steps: [
            {
              nodes: ["task", "env"],
              edges: ["t1"],
              calls: 0,
              caption: L(
                "Task: \"Summarize the incident report briefly.\" The rubric secretly requires 50 words or fewer.",
                "Task: \"Tóm tắt ngắn gọn báo cáo sự cố.\" Rubric lại ngầm yêu cầu tối đa 50 từ.",
                "Tâche : « Résume brièvement le rapport d'incident. » La grille exige en secret 50 mots maximum.",
              ),
            },
            {
              nodes: ["agent"],
              edges: ["t2"],
              calls: 3,
              caption: L(
                "The agent writes a good 80-word summary.",
                "Agent viết một bản tóm tắt tốt dài 80 từ.",
                "L'agent rédige un bon résumé de 80 mots.",
              ),
            },
            {
              nodes: ["transcript", "outcome"],
              edges: ["t3", "t4"],
              calls: 0,
              caption: L(
                "The summary is accurate and readable.",
                "Bản tóm tắt chính xác và dễ đọc.",
                "Le résumé est exact et lisible.",
              ),
            },
            {
              nodes: ["judge"],
              edges: ["t6"],
              calls: 1,
              caption: L(
                "The judge applies the hidden 50-word rule and fails it. Two experts reading only the task would not agree on that verdict.",
                "LLM chấm áp dụng luật 50 từ bị ẩn và đánh trượt. Hai chuyên gia chỉ đọc task sẽ không cùng đưa ra kết luận đó.",
                "Le juge applique la règle cachée des 50 mots et le fait échouer. Deux experts lisant seulement la tâche ne seraient pas d'accord avec ce verdict.",
              ),
            },
            {
              nodes: ["score"],
              edges: ["t9"],
              calls: 0,
              outcome: "failed",
              caption: L(
                "The task is ambiguous, not the agent weak. Put every success criterion in the task, and add a reference answer.",
                "Task mơ hồ chứ không phải agent kém. Hãy đưa mọi tiêu chí đạt vào task và thêm một đáp án tham chiếu.",
                "C'est la tâche qui est ambiguë, pas l'agent qui est faible. Mettez chaque critère dans la tâche et ajoutez une réponse de référence.",
              ),
            },
          ],
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 2. pass@k vs pass^k (chart) — exact formulas, independent trials    */
/* ------------------------------------------------------------------ */

export const passAtK = (p: number, k: number) => 1 - (1 - p) ** k;
export const passHatK = (p: number, k: number) => p ** k;
const pct = formatPercent;

function frame(p: number, k: number): ChartFrame {
  const at = passAtK(p, k);
  const hat = passHatK(p, k);
  return {
    label: same(`k = ${k}`),
    caption: L(
      `With ${pct(p)} per trial, over ${k} trial${k > 1 ? "s" : ""}: at least one success ${pct(at)}, all succeed ${pct(hat)}.`,
      `Với ${pct(p)} mỗi trial, qua ${k} trial: ít nhất một lần đạt ${pct(at)}, tất cả đều đạt ${pct(hat)}.`,
      `Avec ${pct(p)} par essai, sur ${k} essai${k > 1 ? "s" : ""} : au moins une réussite ${pct(at)}, toutes réussies ${pct(hat)}.`,
    ),
    bars: [
      { label: same("pass@k"), value: at, tone: "ok" },
      { label: same("pass^k"), value: hat, tone: "accent" },
    ],
  };
}

const K_VALUES = Array.from({ length: 10 }, (_, i) => i + 1);

export const passKChart: ChartSpec = {
  kind: "chart",
  id: "pass-k",
  valueLabel: L("Probability", "Xác suất", "Probabilité"),
  valueFormat: "percent",
  yMax: 1,
  xLabels: "all",
  method: L(
    "exact formulas for independent trials with per-trial success p: pass@k = 1 − (1 − p)^k, pass^k = p^k.",
    "công thức chính xác cho các trial độc lập với xác suất đạt mỗi trial là p: pass@k = 1 − (1 − p)^k, pass^k = p^k.",
    "formules exactes pour des essais indépendants de probabilité de réussite p : pass@k = 1 − (1 − p)^k, pass^k = p^k.",
  ),
  scenarios: [0.5, 0.75, 0.9].map((p) => ({
    id: `p${Math.round(p * 100)}`,
    label: L(`${p * 100}% per trial`, `${p * 100}% mỗi trial`, `${p * 100} % par essai`),
    frames: K_VALUES.map((k) => frame(p, k)),
  })),
};

export const visuals: Record<string, VisualSpec> = {
  pipeline: evalPipeline,
  passk: passKChart,
};
