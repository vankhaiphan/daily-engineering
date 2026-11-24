import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const SRC = "demystifying-evals";
const code = codeFor("fr");

export const fr: LessonBody = {
  title: "Évaluer des agents IA : savoir si votre agent fonctionne vraiment",
  subtitle:
    "Tâches, essais, graders, et deux chiffres qui racontent des histoires différentes : pass@k et pass^k. Comment les équipes mesurent leurs agents avant que les utilisateurs ne le fassent.",
  hook: "Votre agent a réussi la démo. Réussira-t-il les cent prochaines exécutions ? Découvrez comment les évals transforment des impressions en chiffres.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "Réussir la démo ne suffit pas",
      blocks: [
        {
          type: "p",
          text: "Vous mettez en production un agent qui gère les remboursements clients. Chaque démo est parfaite. Une semaine plus tard, les tickets arrivent : parfois il rembourse deux fois, parfois il tourne en boucle jusqu'à l'expiration de la conversation. Vous corrigez un bug, un autre apparaît ailleurs. Chaque changement est un pari, car rien ne vous dit si l'agent s'est globalement amélioré ou dégradé.",
        },
        {
          type: "p",
          text: "L'équipe d'ingénierie d'Anthropic appelle cela rester coincé dans des boucles réactives, et son article de janvier 2026, « Demystifying evals for AI agents », montre comment en sortir. Sa première phrase résume l'objectif :",
        },
        {
          type: "quote",
          text: "Good evaluations help teams ship AI agents more confidently.",
          translation: "De bonnes évaluations aident les équipes à livrer des agents IA avec plus d'assurance.",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Une **éval** donne une entrée à un système d'IA et note sa sortie. Pour un chatbot, c'est une question et une réponse. Pour un agent, c'est plus difficile : de nombreuses étapes, des outils, un environnement qui change, et un comportement différent à chaque exécution. Cette leçon montre comment les équipes évaluent des agents en pratique, et pourquoi un seul score ne suffit jamais.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "À la fin, vous saurez",
          text: "Définir tâche, essai, grader, transcription et résultat ; choisir un grader en code, par modèle ou humain selon la vérification ; expliquer pass@k et pass^k avec de vrais chiffres ; et esquisser une première suite d'évals pour l'agent que vous construisez.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Intuition : un examen de conduite, pas un QCM",
      blocks: [
        {
          type: "p",
          text: "Un QCM vérifie une réponse à la fois. L'examen de conduite vous regarde conduire : des dizaines de décisions d'affilée, dans un environnement réel, où une erreur précoce change tout ce qui suit. Évaluer une seule réponse de modèle, c'est le QCM. Évaluer un agent, c'est l'examen de conduite : au fil des tours, les erreurs peuvent se propager et s'accumuler.",
        },
        {
          type: "p",
          text: "Les agents peuvent aussi être créatifs. L'article raconte que Claude Opus 4.5 a « échoué » à une tâche de réservation de vol de τ2-bench parce qu'il a trouvé une faille dans la politique de la compagnie, faille qui offrait en réalité un meilleur résultat à l'utilisateur. Un grader qui n'accepte que la séquence d'étapes attendue aurait sanctionné un bon résultat.",
        },
        { type: "p", text: "Le vocabulaire de l'article, utilisé tout au long de la leçon :" },
        {
          type: "list",
          items: [
            "**Tâche** (task) : un test avec des entrées et des critères de réussite définis.",
            "**Essai** (trial) : une tentative de réaliser la tâche. Les agents ne sont pas déterministes, on lance donc plusieurs essais par tâche.",
            "**Grader** : la logique qui note un aspect de la performance de l'agent. Une tâche peut avoir plusieurs graders.",
            "**Transcription** (transcript, aussi appelée trace ou trajectoire) : l'enregistrement complet d'un essai : messages, appels d'outils, résultats.",
            "**Résultat** (outcome) : l'état final de l'environnement à la fin de l'essai, par exemple si le remboursement existe vraiment dans la base.",
            "**Harnais** : le *harnais d'évaluation* exécute les tâches et enregistre les résultats ; le *harnais d'agent* (ou scaffold) permet à un modèle d'agir comme un agent. L'article cite Claude Code comme exemple de harnais d'agent.",
          ],
        },
        {
          type: "quote",
          text: "A task (a.k.a problem or test case) is a single test with defined inputs and success criteria.",
          translation: "Une tâche (aussi appelée problème ou cas de test) est un test unique avec des entrées et des critères de réussite définis.",
          sourceId: SRC,
        },
        {
          type: "callout",
          tone: "analogy",
          title: "Une distinction à retenir",
          text: "La transcription, c'est ce que l'agent dit avoir fait. Le résultat, c'est ce qui est vraiment vrai ensuite. En cas de désaccord, fiez-vous au résultat.",
        },
      ],
    },
    {
      id: "anatomy",
      kind: "deep-dive",
      title: "Anatomie d'une éval d'agent",
      blocks: [
        {
          type: "p",
          text: "Une exécution d'éval est un petit pipeline. Pour chaque tâche, le harnais démarre un environnement propre, laisse l'agent tenter la tâche, enregistre la transcription et le résultat final, puis les transmet à un ou plusieurs graders. Il recommence pour l'essai suivant, puis agrège. Parcourez pas à pas trois situations ci-dessous : une tâche de code, une conversation de support, et une tâche qui échoue à chaque fois.",
        },
        { type: "interactive", widget: "flow", ref: "pipeline" },
        {
          type: "p",
          text: "Deux détails comptent plus qu'il n'y paraît. **L'isolation** : chaque essai doit partir d'un environnement propre. L'article rapporte que Claude a obtenu un avantage injuste sur certaines tâches en lisant l'historique git laissé par les essais précédents ; l'état partagé peut aussi rendre les échecs corrélés. **Les tâches cassées** : un taux de réussite de 0 % sur de nombreux essais signale le plus souvent une tâche cassée, pas un agent incapable. Lisez les transcriptions avant d'accuser le modèle.",
        },
        {
          type: "p",
          text: "Remarquez aussi le compteur du diagramme : un juge LLM coûte un appel de modèle supplémentaire à chaque essai, alors qu'un grader en code ne coûte rien. Sur des milliers d'essais dans une CI, l'écart s'accumule vite.",
        },
      ],
    },
    {
      id: "graders",
      kind: "deep-dive",
      title: "Trois familles de graders",
      blocks: [
        {
          type: "p",
          text: "Le grader décide de ce qui est « bon » : le choisir est la décision de conception centrale d'une éval. L'article les regroupe en trois familles :",
        },
        {
          type: "table",
          caption: "Forces et faiblesses telles que résumées par l'article ; exemples condensés.",
          columns: ["Grader", "Exemples", "Forces", "Faiblesses"],
          rows: [
            ["En code", "Tests qui passent, vérification d'état, d'appels d'outils, analyse statique", "Rapide, peu coûteux, objectif, reproductible, facile à déboguer", "Fragile face à des réponses valides sous une forme inattendue"],
            ["Par modèle (juge LLM)", "Notation par grille, assertions en langage naturel, comparaison par paires", "Flexible, passe à l'échelle, saisit les nuances et les sorties ouvertes", "Non déterministe, plus coûteux, à calibrer avec des humains"],
            ["Humain", "Revue d'experts, contrôles ponctuels, tests A/B", "Référence absolue ; sert à calibrer les graders par modèle", "Cher, lent, difficile à passer à l'échelle"],
          ],
        },
        {
          type: "p",
          text: "La règle pratique : des graders déterministes quand c'est possible, des graders LLM quand c'est nécessaire ou pour plus de souplesse, et des humains avec parcimonie, surtout pour calibrer les autres. Quelques habitudes rendent les graders bien plus fiables :",
        },
        {
          type: "list",
          items: [
            "**Noter le résultat, pas le chemin.** Ne sanctionnez pas un agent qui atteint un résultat correct par une autre route.",
            "**Noter chaque dimension séparément** (bon remboursement, ton poli, limite de tours respectée) pour savoir ce qui a cassé.",
            "**Accorder des points partiels** pour les tâches à plusieurs composantes.",
            "**Laisser une porte de sortie au juge LLM :** qu'il puisse répondre « Unknown » plutôt que deviner quand la transcription manque d'informations.",
            "**Résister aux raccourcis :** si un agent peut réussir en modifiant le test au lieu du code, l'éval mesure la triche, pas la compétence.",
          ],
        },
        {
          type: "quote",
          text: "it’s often better to grade what the agent produced, not the path it took.",
          translation: "il vaut souvent mieux noter ce que l'agent a produit, pas le chemin qu'il a suivi.",
          sourceId: SRC,
        },
      ],
    },
    {
      id: "pass-k",
      kind: "explore",
      title: "Un seul chiffre ne suffit pas : pass@k contre pass^k",
      blocks: [
        {
          type: "p",
          text: "Lancez plusieurs fois la même tâche : l'agent réussit parfois, échoue parfois. Deux métriques résument ces essais, et elles répondent à des questions opposées :",
        },
        {
          type: "list",
          items: [
            "**pass@k** : la probabilité d'au moins une réussite en k tentatives. À utiliser quand une seule bonne réponse suffit, par exemple quand des correctifs candidats sont vérifiés par des tests avant que quiconque ne les voie.",
            "**pass^k** : la probabilité que les k essais réussissent tous. À utiliser quand les utilisateurs attendent que l'agent fonctionne à chaque fois, comme un agent de support que les clients sollicitent encore et encore.",
          ],
        },
        {
          type: "p",
          text: "Si les essais sont indépendants et que chacun réussit avec une probabilité p, alors pass@k = 1 − (1 − p)^k et pass^k = p^k. L'exemple de l'article : à 75 % par essai, la probabilité de réussir trois essais d'affilée est de 0,75³ ≈ 42 %. Choisissez un taux de réussite et déplacez le curseur : quand k augmente, pass@k monte vers 100 % tandis que pass^k baisse.",
        },
        { type: "interactive", widget: "chart", ref: "passk" },
        {
          type: "callout",
          tone: "warning",
          title: "Lire le bon chiffre",
          text: "Un agent à 90 % semble excellent. Mais un client qui le contacte cinq fois n'a que 59 % de chances (0,9⁵) que toutes les conversations se passent bien. Décidez quelle question votre produit doit trancher avant de célébrer un score.",
        },
      ],
    },
    {
      id: "suites",
      kind: "deep-dive",
      title: "Évals de capacité et évals de régression",
      blocks: [
        {
          type: "p",
          text: "L'article distingue deux types de suites aux objectifs différents. Une **éval de capacité** demande ce que l'agent sait bien faire. Elle doit démarrer avec un faible taux de réussite, sur des tâches où l'agent peine, pour donner à l'équipe une pente à gravir. Une **éval de régression** demande si l'agent gère encore toutes les tâches qu'il savait faire. Elle doit rester proche de 100 % ; toute baisse signale une casse.",
        },
        {
          type: "p",
          text: "Les deux sont liées : les tâches de capacité à fort taux de réussite peuvent « passer » dans la suite de régression. Et toute suite finit par saturer. Une éval à 100 % détecte encore les régressions mais ne donne plus aucun signal d'amélioration. L'article note que sur SWE-bench Verified, un benchmark de code réputé, les LLM sont passés de 40 % à plus de 80 % en une seule année.",
        },
        {
          type: "callout",
          tone: "example",
          title: "Dans une CI",
          text: "Lancez la suite de régression à chaque changement, comme des tests unitaires : elle doit rester verte. Lancez la suite de capacité moins souvent (chaque nuit, ou quand vous changez de modèle ou de prompt) et suivez la tendance. Quand une tâche de capacité reste verte des semaines durant, déplacez-la en régression et écrivez-en une plus difficile.",
        },
      ],
    },
    {
      id: "example",
      kind: "example",
      title: "Exemple concret : évaluer un agent de remboursement",
      blocks: [
        {
          type: "p",
          text: "Voici une tâche pour un agent de support, écrite en YAML. C'est notre propre illustration, inspirée de la structure décrite par l'article, et non le format d'un framework précis. Elle combine une vérification d'état sur le résultat, une vérification des appels d'outils, une grille LLM pour le ton, une limite de tours et plusieurs essais.",
        },
        {
          type: "code",
          language: "yaml",
          code: code.taskSpec,
          caption: "Des vérifications déterministes pour ce qui est vérifiable ; une grille LLM seulement pour le reste.",
        },
        {
          type: "p",
          text: "Une fois que chaque tâche a plusieurs essais, en tirer les deux métriques ne prend que quelques lignes. Cette version regarde simplement les k premiers essais de chaque tâche :",
        },
        {
          type: "code",
          language: "ts",
          code: code.summarize,
          caption: "pass@k et pass^k mesurés directement sur les résultats, sans hypothèse d'indépendance.",
        },
      ],
    },
    {
      id: "pitfalls",
      kind: "tradeoffs",
      title: "Modes d'échec et comment les éviter",
      blocks: [
        {
          type: "table",
          caption: "Synthèse de la feuille de route de l'article ; symptômes et correctifs formulés par nous.",
          columns: ["Mode d'échec", "Symptôme", "Correctif"],
          rows: [
            ["Tâche ambiguë", "Les experts divergent sur le verdict", "Deux experts doivent aboutir au même verdict ; ajouter une solution de référence"],
            ["Grader rigide", "Des réponses correctes notées fausses", "Noter le résultat, normaliser les formats, accorder des points partiels"],
            ["État partagé", "Scores trop hauts ou échecs groupés", "Démarrer chaque essai dans un environnement propre"],
            ["Jeu de tâches déséquilibré", "L'agent agit toujours (ou jamais)", "Tester quand le comportement doit et ne doit pas se produire"],
            ["Grader contournable", "Le score monte, les utilisateurs râlent", "Graders résistants aux raccourcis ; lire les transcriptions"],
            ["Suite saturée", "100 % depuis des mois, aucun signal", "Ajouter des tâches de capacité plus dures ; garder les anciennes en régression"],
          ],
        },
        {
          type: "p",
          text: "Un exemple frappant de l'article : Claude Opus 4.5 a d'abord obtenu 42 % sur CORE-Bench. Après correction de bugs de notation et avec un scaffold moins contraint, le score a bondi à 95 %. L'essentiel de l'écart venait de l'éval, pas du modèle. Avant de fêter ou de paniquer devant un score, vérifiez l'éval elle-même.",
        },
        {
          type: "p",
          text: "Enfin, les évals automatisées sont une couche de défense, pas tout le système. L'article les compare au modèle du fromage suisse de l'ingénierie de la sécurité : surveillance en production, tests A/B, retours utilisateurs, lecture des transcriptions et études humaines attrapent chacun ce que les autres laissent passer.",
        },
        {
          type: "quote",
          text: "Like the Swiss Cheese Model from safety engineering, no single evaluation layer catches every issue.",
          translation: "Comme dans le modèle du fromage suisse de l'ingénierie de la sécurité, aucune couche d'évaluation n'attrape à elle seule tous les problèmes.",
          sourceId: SRC,
        },
      ],
    },
    {
      id: "roadmap",
      kind: "concept",
      title: "De zéro à une première suite",
      blocks: [
        {
          type: "p",
          text: "Pas besoin de centaines de tâches ni d'une équipe dédiée pour commencer. Les conseils de l'article tiennent dans une courte feuille de route :",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**Commencer tôt et petit** : 20 à 50 tâches simples tirées d'échecs réels, c'est un excellent début.",
            "**Transformer les vérifications manuelles en tâches** : ce que vous testez à la main avant une mise en production, et les bugs signalés par les utilisateurs.",
            "**Écrire des tâches sans ambiguïté**, avec une solution de référence, pour que deux experts s'accordent sur le verdict.",
            "**Équilibrer le jeu** : des cas où le comportement doit se produire et d'autres où il ne doit pas.",
            "**Isoler les essais** et enregistrer les transcriptions complètes.",
            "**Choisir les graders délibérément** : le code d'abord, des juges LLM si nécessaire, des humains pour calibrer.",
            "**Lire régulièrement les transcriptions**, surtout les échecs.",
            "**Entretenir la suite** : basculer les tâches saturées en régression, en ajouter de plus dures, laisser les experts métier contribuer.",
          ],
        },
        {
          type: "quote",
          text: "20-50 simple tasks drawn from real failures is a great start.",
          translation: "20 à 50 tâches simples tirées d'échecs réels, c'est un excellent début.",
          sourceId: SRC,
        },
      ],
    },
    {
      id: "quiz",
      kind: "quiz",
      title: "Vérifiez votre compréhension",
      blocks: [
        {
          type: "quiz",
          questions: [
            {
              id: "q-pass-hat-k",
              prompt:
                "Un agent de support réussit 90 % des essais. Les clients s'attendent à ce qu'il fonctionne à chaque contact. Quelle métrique correspond à cette attente, et que vaut-elle sur 5 conversations (essais indépendants) ?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "pass@5, environ 100 %",
                  feedback: "pass@5 répond à « au moins une des cinq marchera-t-elle ? ». Ce n'est pas la bonne question quand chaque conversation doit bien se passer.",
                },
                {
                  id: "b",
                  text: "pass^5, environ 59 %",
                  feedback: "Exact. 0,9⁵ ≈ 0,59 : quatre clients sur dix qui contactent le support cinq fois rencontreront au moins un échec. C'est ce que pass^k rend visible.",
                },
                {
                  id: "c",
                  text: "pass@1, 90 % : un seul chiffre suffit",
                  feedback: "pass@1 décrit un seul essai. Il masque la régularité sur des usages répétés, c'est-à-dire ce que vivent les clients.",
                },
              ],
            },
            {
              id: "q-zero",
              prompt: "Une nouvelle tâche échoue sur les 50 essais. Que faites-vous en premier ?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "Passer à un modèle plus grand",
                  feedback: "Peut-être plus tard. Mais 0 % sur de nombreux essais signale le plus souvent une tâche cassée, et un plus gros modèle ne réparera pas un grader cassé.",
                },
                {
                  id: "b",
                  text: "Supprimer la tâche : elle n'apporte rien",
                  feedback: "Vous perdriez de la couverture, et le même défaut (grader rigide, spécification floue) se cache peut-être dans d'autres tâches.",
                },
                {
                  id: "c",
                  text: "Lire les transcriptions et vérifier la tâche et le grader",
                  feedback: "Exact. Cherchez des critères ambigus, une comparaison exacte de réponses valides ou une configuration impossible, comme dans le scénario du grader rigide.",
                },
              ],
            },
            {
              id: "q-grader",
              prompt:
                "Vous devez vérifier que le correctif d'un agent de code fait passer le test en échec sans casser les autres. Quel grader convient le mieux ?",
              correctOptionId: "a",
              options: [
                {
                  id: "a",
                  text: "En code : lancer la suite de tests d'origine dans un environnement propre",
                  feedback: "Oui. C'est vérifiable : utilisez un contrôle rapide, objectif et reproductible, et lancez les tests d'origine pour que l'agent ne puisse pas réussir en les modifiant.",
                },
                {
                  id: "b",
                  text: "Un juge LLM qui lit le diff",
                  feedback: "Utile pour ce que le code ne peut pas vérifier, comme la lisibilité, mais non déterministe et plus coûteux. Pas pour ce que des tests vérifient.",
                },
                {
                  id: "c",
                  text: "Un relecteur humain à chaque essai",
                  feedback: "Les humains sont la référence mais lents et chers. Servez-vous-en pour calibrer les graders automatiques, pas pour chaque essai.",
                },
              ],
            },
            {
              id: "q-path",
              prompt:
                "Un agent réserve un vol valide et moins cher avec une séquence d'appels d'outils différente de votre solution de référence, et l'objectif de l'utilisateur est atteint. Votre grader le fait échouer. Quel est le problème ?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "L'agent doit suivre les étapes de référence",
                  feedback: "Imposer un chemin précis sanctionne la créativité. L'objectif de l'utilisateur est atteint.",
                },
                {
                  id: "b",
                  text: "Le grader note le chemin au lieu du résultat",
                  feedback: "Exactement. Notez ce que l'agent a produit (une réservation valide qui atteint l'objectif), pas la route suivie.",
                },
                {
                  id: "c",
                  text: "Il faut plus d'essais",
                  feedback: "Plus d'essais avec un grader rigide ne font que répéter le même verdict erroné. Corrigez d'abord le grader.",
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
      title: "Synthèse pour l'entretien",
      blocks: [
        {
          type: "interview",
          pitchTitle: "Votre réponse en 30 secondes",
          pitch:
            "J'évalue un agent avec une suite de tâches aux critères de réussite clairs. Je lance plusieurs essais isolés par tâche et je note le résultat, pas le chemin : des graders en code d'abord, car rapides et objectifs, des juges LLM avec une grille pour ce que le code ne peut pas vérifier, et des humains pour les calibrer. Je publie pass@k quand une réussite suffit et pass^k quand les utilisateurs ont besoin de régularité. Je garde des évals de capacité qui démarrent difficiles et des évals de régression proches de 100 %, je commence avec 20 à 50 tâches tirées d'échecs réels, et je lis les transcriptions, car une tâche à 0 % est en général une tâche cassée, pas un agent faible.",
          keyPointsTitle: "Points clés",
          keyPoints: [
            "Tâche, essai, grader, transcription, résultat : la transcription est ce que l'agent dit, le résultat ce qui est vrai.",
            "Choix du grader : le code quand c'est vérifiable, un juge LLM si nécessaire, des humains pour calibrer.",
            "Noter le résultat, séparer les dimensions, accorder des points partiels et autoriser « Unknown ».",
            "pass@k = au moins une réussite ; pass^k = tous les essais réussissent. Avec des essais indépendants : 1 − (1 − p)^k contre p^k.",
            "Les évals de capacité partent bas et progressent ; celles de régression restent proches de 100 % ; les tâches saturées changent de suite.",
            "Isoler les essais, lire les transcriptions, et traiter un 0 % comme un rapport de bug sur l'éval.",
          ],
          followUpsTitle: "Questions de relance probables",
          followUps: [
            {
              question: "Comment rendre un juge LLM fiable ?",
              answer:
                "Lui donner une grille précise par dimension, noter les dimensions séparément, l'autoriser à répondre « Unknown », et le calibrer sur un échantillon d'étiquettes humaines, en revérifiant à chaque changement de modèle ou de grille. Tout ce qui est vérifiable reste aux graders déterministes.",
            },
            {
              question: "Votre score a gagné 20 points après un changement de prompt. Vous livrez ?",
              answer:
                "Pas encore. Vérifier que ce n'est pas du bruit (assez d'essais par tâche), lire les transcriptions pour repérer une triche du grader ou un état qui fuit, confirmer que la suite de régression reste verte, puis valider en production par la surveillance ou un test A/B.",
            },
            {
              question: "pass@k ou pass^k pour un agent de code qui propose des correctifs ?",
              answer:
                "Si plusieurs correctifs candidats sont générés et vérifiés par des tests avant qu'un humain n'en voie un, c'est pass@k qui compte. Si chaque tentative arrive directement chez un utilisateur ou est fusionnée, la régularité compte : suivez pass^k.",
            },
            {
              question: "Comment les évals s'articulent-elles avec la surveillance en production ?",
              answer:
                "Ce sont des couches complémentaires : évals automatisées avant le lancement et en CI ; surveillance pour détecter la dérive après ; tests A/B pour valider un changement sur du trafic réel ; retours et lecture des transcriptions pour ce que personne n'avait prévu.",
            },
          ],
        },
      ],
    },
    {
      id: "sources",
      kind: "sources",
      title: "Sources",
      blocks: [
        {
          type: "p",
          text: "Cette leçon est une explication originale. Les citations sont reproduites mot pour mot en anglais à partir de la source ci-dessous, avec notre traduction. Les scénarios, la tâche de l'agent de remboursement, le pseudocode, l'exemple 90 % / 5 conversations et le graphique (calculé par des formules exactes) sont nos propres illustrations.",
        },
        { type: "sources" },
      ],
    },
  ],
};
