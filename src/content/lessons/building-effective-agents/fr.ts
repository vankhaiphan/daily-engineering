import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const SRC = "building-effective-agents";
const code = codeFor("fr");

export const fr: LessonBody = {
  title: "Workflows ou agents : concevoir des systèmes LLM efficaces",
  subtitle:
    "Quand votre code doit-il décider de l'étape suivante, et quand faut-il laisser le modèle choisir ? Six patterns, leurs coûts, et comment défendre votre choix en entretien de conception.",
  hook: "Les systèmes d'agents les plus réussis sont étonnamment simples. Découvrez les six patterns et quand chacun justifie son coût.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "Un constat surprenant",
      blocks: [
        {
          type: "p",
          text: "Imaginez qu'en entretien on vous demande : « Concevez un système d'IA qui corrige les tests en échec dans une grande base de code. » La tentation est forte de dessiner, dès le premier trait au tableau, un framework multi-agents avec planificateurs, critiques et mémoires.",
        },
        {
          type: "p",
          text: "En décembre 2024, des ingénieurs d'Anthropic ont publié ce qu'ils avaient appris en travaillant avec des dizaines d'équipes qui construisaient des agents LLM dans de nombreux secteurs. Leur constat principal va à l'encontre de ce réflexe :",
        },
        {
          type: "quote",
          text: "the most successful implementations weren't using complex frameworks or specialized libraries",
          translation: "les implémentations les plus réussies n'utilisaient ni frameworks complexes ni bibliothèques spécialisées",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Ces équipes s'appuyaient plutôt sur un petit nombre de **patterns simples et composables**. Cette leçon vous les présente comme un ingénieur les utilise : ce que fait chacun, ce qu'il coûte, comment il échoue, et comment justifier votre choix.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "À la fin, vous saurez",
          text: "Expliquer en une phrase la différence entre un workflow et un agent ; choisir un pattern pour un problème et le justifier en termes de latence, de coût et de fiabilité ; esquisser en pseudocode la boucle d'un agent, conditions d'arrêt comprises.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Intuition : la recette et le chef",
      blocks: [
        {
          type: "p",
          text: "Imaginez deux cuisines. Dans la première, un cuisinier suit une fiche recette : émincer, puis faire sauter, puis assaisonner. L'ordre a été fixé à l'avance par l'auteur de la fiche. Dans la seconde, un chef reçoit un objectif, « préparer le dîner avec ce qu'il y a dans le frigo », et décide de chaque étape en observant, en goûtant et en ajustant.",
        },
        {
          type: "p",
          text: "C'est la distinction centrale de l'article. Les deux cuisines sont des **systèmes agentiques**, mais elles diffèrent sur un point : qui contrôle le déroulement ?",
        },
        {
          type: "list",
          items: [
            "**Workflow** : les LLM et les outils sont orchestrés par des chemins de code prédéfinis. C'est *votre code* qui décide de la suite.",
            "**Agent** : le LLM dirige dynamiquement son propre processus et son usage des outils. C'est *le modèle* qui décide de la suite.",
          ],
        },
        {
          type: "quote",
          text: "Workflows are systems where LLMs and tools are orchestrated through predefined code paths.",
          translation: "Les workflows sont des systèmes où les LLM et les outils sont orchestrés par des chemins de code prédéfinis.",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Le fait que le chef goûte est essentiel. Un bon agent ne se fie pas à ses propres suppositions : à chaque étape, il recueille une **vérité terrain issue de l'environnement**, comme le résultat d'un outil, une exécution de tests ou une erreur de compilation, et s'en sert pour choisir l'action suivante.",
        },
        {
          type: "callout",
          tone: "analogy",
          title: "Une question à garder en tête",
          text: "Qui décide de la suite : votre code ou le modèle ? Cette seule question permet de classer presque tous les systèmes LLM que vous concevrez.",
        },
      ],
    },
    {
      id: "simplest",
      kind: "concept",
      title: "Commencer par la solution la plus simple",
      blocks: [
        {
          type: "p",
          text: "La première règle de l'article est la retenue : trouver la solution la plus simple possible, et n'ajouter de la complexité que si nécessaire. Les systèmes agentiques échangent généralement de la **latence et du coût** contre de meilleures performances, donc chaque appel LLM supplémentaire doit se justifier.",
        },
        {
          type: "p",
          text: "Un bon modèle mental est celui d'une échelle. Ne montez d'un barreau que lorsque les mesures montrent que le barreau actuel ne suffit pas :",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**Un seul appel LLM**, optimisé avec de la recherche documentaire (retrieval) et des exemples dans le contexte. Pour beaucoup d'applications, cela suffit.",
            "**Un workflow** : plusieurs appels reliés par votre code. Les workflows offrent prévisibilité et cohérence pour des tâches bien définies.",
            "**Un agent** : le modèle choisit ses propres étapes. Préférable quand il faut de la flexibilité et des décisions pilotées par le modèle à grande échelle.",
          ],
        },
        {
          type: "p",
          text: "Chaque barreau est construit avec la même brique : le **LLM augmenté**, un modèle enrichi de recherche documentaire, d'outils et de mémoire. L'article insiste sur deux points : adapter ces capacités à votre cas d'usage, et offrir au modèle une interface simple et bien documentée pour y accéder. Le Model Context Protocol (MCP) est une façon de le connecter à des outils tiers.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Erreur fréquente en entretien",
          text: "Proposer un agent autonome pour une tâche dont la séquence d'étapes est fixe et connue, comme « extraire les champs d'une facture, les valider, les enregistrer ». Un workflow est moins cher, plus rapide, plus facile à tester, et échoue de façon prévisible.",
        },
      ],
    },
    {
      id: "workflows",
      kind: "deep-dive",
      title: "Cinq patterns de workflow",
      blocks: [
        {
          type: "p",
          text: "Dans chacun des workflows ci-dessous, le contrôle du flux reste dans votre code. Lisez les descriptions, puis utilisez l'explorateur interactif de la section suivante pour voir chacun s'exécuter pas à pas.",
        },
        { type: "h3", text: "1. Chaînage de prompts" },
        {
          type: "p",
          text: "On découpe la tâche en une séquence fixe d'étapes ; chaque appel LLM traite la sortie du précédent. Entre deux étapes, on peut ajouter une **porte** programmatique : du code simple qui vérifie le résultat intermédiaire et interrompt la chaîne en cas de problème.",
        },
        {
          type: "p",
          text: "**À utiliser quand** la tâche se décompose proprement en sous-tâches fixes. On échange de la latence contre de la précision, car chaque appel a une tâche plus facile. Exemple de l'article : rédiger un plan, le vérifier selon des critères, puis écrire le document.",
        },
        { type: "h3", text: "2. Routage" },
        {
          type: "p",
          text: "On classe l'entrée, puis on l'envoie vers un traitement spécialisé : un autre prompt, d'autres outils ou un autre modèle. On obtient une **séparation des responsabilités** : optimiser le prompt d'une catégorie ne dégrade pas les autres.",
        },
        {
          type: "p",
          text: "**À utiliser quand** il existe des catégories distinctes mieux traitées séparément, et que la classification peut être faite avec précision, par un LLM ou un classifieur classique. Exemples : des demandes au service client réparties entre questions générales, remboursements et support technique ; les questions simples envoyées à un modèle plus petit et moins cher, les difficiles à un modèle plus capable.",
        },
        { type: "h3", text: "3. Parallélisation" },
        {
          type: "p",
          text: "On lance plusieurs appels LLM en même temps et on agrège leurs sorties dans le code. Deux variantes : le **sectionnement** découpe la tâche en sous-tâches indépendantes (un modèle répond à l'utilisateur pendant qu'un autre filtre les contenus inappropriés) ; le **vote** exécute plusieurs fois la même tâche pour obtenir des réponses variées (plusieurs prompts relisent le code à la recherche de vulnérabilités, et un seuil tranche).",
        },
        {
          type: "p",
          text: "**À utiliser quand** les sous-tâches sont indépendantes et que l'on veut de la vitesse, ou quand plusieurs points de vue augmentent la confiance. Soyez précis sur le compromis : les appels parallèles augmentent le **coût** (plus d'appels) mais pas la **profondeur de latence** (toujours un seul tour).",
        },
        { type: "h3", text: "4. Orchestrateur-workers" },
        {
          type: "p",
          text: "Un LLM central découpe la tâche à l'exécution, délègue les morceaux à des LLM workers, puis synthétise leurs résultats. Cela ressemble à la parallélisation, mais la différence clé est la **flexibilité** : les sous-tâches ne sont pas prédéfinies, l'orchestrateur les détermine à partir de l'entrée.",
        },
        {
          type: "p",
          text: "**À utiliser quand** on ne peut pas prévoir les sous-tâches à l'avance. Exemple : une modification de code où le nombre de fichiers à changer, et lesquels, dépend de la demande.",
        },
        { type: "h3", text: "5. Évaluateur-optimiseur" },
        {
          type: "p",
          text: "Un LLM génère une réponse ; un autre l'évalue et formule un retour ; on recommence. L'article le compare à la manière dont un auteur retravaille son brouillon.",
        },
        {
          type: "p",
          text: "**À utiliser quand** on dispose de critères d'évaluation clairs et que l'itération apporte une valeur mesurable. Deux signes d'adéquation : un retour humain améliorerait nettement le résultat, et un LLM est capable de fournir ce type de retour. Exemples : la traduction littéraire avec des critiques nuancées ; une recherche complexe en plusieurs tours, où l'évaluateur décide s'il faut chercher davantage.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "Raccourci de reconnaissance",
          text: "Étapes fixes → chaînage. Types d'entrées différents → routage. Morceaux indépendants ou besoin de consensus → parallélisation. Morceaux inconnus avant de voir l'entrée → orchestrateur-workers. La critique améliore la qualité → évaluateur-optimiseur.",
        },
      ],
    },
    {
      id: "explorer",
      kind: "explore",
      title: "Voir les patterns en action",
      blocks: [
        {
          type: "p",
          text: "Choisissez un pattern et un scénario, puis appuyez sur Lecture ou avancez pas à pas. Observez deux compteurs : les **appels LLM** (indicateur de coût) et les **tours séquentiels** (indicateur de latence). Les scénarios sont des exemples illustratifs écrits pour cette leçon, pas des mesures.",
        },
        { type: "interactive", widget: "flow", ref: "patterns" },
      ],
    },
    {
      id: "agents",
      kind: "deep-dive",
      title: "Les agents : des outils dans une boucle",
      blocks: [
        {
          type: "p",
          text: "Un agent démarre à partir d'une instruction ou d'une discussion avec un humain. Une fois la tâche claire, il planifie et agit de façon autonome, et peut s'arrêter pour demander l'avis d'un humain à des points de contrôle ou face à un blocage.",
        },
        {
          type: "quote",
          text: "They are typically just LLMs using tools based on environmental feedback in a loop.",
          translation: "Ce ne sont généralement que des LLM qui utilisent des outils en fonction des retours de l'environnement, dans une boucle.",
          sourceId: SRC,
        },
        { type: "p", text: "Trois idées de cette phrase méritent d'être détaillées :" },
        {
          type: "list",
          items: [
            "**Les outils** : l'agent agit sur le monde par des outils, comme lire un fichier, lancer des tests ou appeler une API. Concevoir les outils est donc aussi important que concevoir les prompts.",
            "**Le retour de l'environnement** : après chaque action, l'agent observe des résultats réels. Pour un agent de code, la sortie des tests est une vérité terrain ; la confiance du modèle ne l'est pas.",
            "**Une boucle avec des sorties** : l'agent recommence jusqu'à atteindre l'objectif, avoir besoin d'un humain, ou atteindre une condition d'arrêt comme un nombre maximal d'itérations.",
          ],
        },
        {
          type: "p",
          text: "**À utiliser quand** le problème est ouvert, qu'il est difficile voire impossible de prévoir le nombre d'étapes, et que vous pouvez faire confiance aux décisions du modèle dans cet environnement. L'article est clair sur le prix à payer : l'autonomie implique des coûts plus élevés et un risque d'erreurs cumulées ; il recommande donc des tests approfondis dans des environnements isolés (sandbox), avec des garde-fous adaptés.",
        },
        { type: "h3", text: "Pourquoi les erreurs se cumulent" },
        {
          type: "p",
          text: "Un calcul rapide, à titre d'illustration (le nôtre, pas celui de l'article) : si chacune des 20 étapes d'une exécution réussit indépendamment dans 95 % des cas, l'exécution entière ne réussit qu'avec une probabilité de 0,95²⁰ ≈ 36 %. En réalité, les étapes ne sont pas indépendantes et un agent peut se rattraper, mais seulement s'il reçoit des retours. C'est précisément pour cela que la vérité terrain, les points de contrôle et les conditions d'arrêt comptent autant.",
        },
        {
          type: "callout",
          tone: "example",
          title: "Là où les agents brillent : le code",
          text: "Le développement s'y prête naturellement : les solutions se vérifient par des tests automatisés, l'agent peut itérer à partir des résultats des tests, et le problème est bien délimité. L'article cite des agents qui résolvent de vraies issues GitHub du benchmark SWE-bench Verified à partir de la seule description de la pull request, tout en soulignant que la relecture humaine reste cruciale.",
        },
      ],
    },
    {
      id: "pseudocode",
      kind: "example",
      title: "Pseudocode : du workflow à l'agent",
      blocks: [
        {
          type: "p",
          text: "Les extraits ci-dessous sont du pseudocode inspiré de TypeScript. `llm()` représente n'importe quel appel de modèle ; ce n'est pas une vraie fonction de SDK. Dans chacun, repérez **où se trouve le contrôle du flux**.",
        },
        {
          type: "code",
          language: "ts",
          code: code.chaining,
          caption: "Chaînage : chaque appel a une seule tâche, et la porte arrête tôt une sortie défaillante.",
        },
        {
          type: "code",
          language: "ts",
          code: code.routing,
          caption: "Routage : une classification, puis exactement un chemin spécialisé.",
        },
        {
          type: "code",
          language: "ts",
          code: code.agent,
          caption: "Boucle d'agent : le modèle choisit les actions ; votre code détient les limites.",
        },
        {
          type: "p",
          text: "Comparez les formes. Pour un workflow, on peut dessiner le graphe de contrôle avant toute exécution. Pour un agent, le graphe n'existe qu'après coup, sous forme de trace. C'est pourquoi les agents exigent de l'observabilité, en journalisant chaque étape, et pourquoi l'article recommande de rendre visibles les étapes de planification de l'agent.",
        },
      ],
    },
    {
      id: "tradeoffs",
      kind: "tradeoffs",
      title: "Des compromis à savoir défendre",
      blocks: [
        {
          type: "table",
          caption: "Comparaison synthétisée à partir de l'article ; la colonne coût est qualitative.",
          columns: ["Pattern", "Qui choisit le chemin", "Coût et latence", "Risque principal"],
          rows: [
            ["Appel unique", "Personne : un seul coup", "Le plus faible", "Insuffisant pour les tâches à étapes"],
            ["Chaînage", "Votre code", "+1 appel séquentiel par étape", "Les erreurs précoces se propagent (portes)"],
            ["Routage", "Classifieur, puis votre code", "+1 appel de classification", "Entrée mal classée, mauvais chemin"],
            ["Parallélisation", "Votre code", "Plus d'appels, même profondeur", "Coût multiplié ; logique d'agrégation"],
            ["Orchestrateur-workers", "LLM orchestrateur", "Variable, difficile à borner", "Mauvais plan ; workers incohérents"],
            ["Évaluateur-optimiseur", "Votre boucle, verdict LLM", "Augmente à chaque tour", "Jamais satisfait sans plafond de tours"],
            ["Agent autonome", "Le modèle", "Le plus élevé, imprévisible", "Erreurs cumulées"],
          ],
        },
        {
          type: "p",
          text: "Des chiffres concrets aident en entretien. Dans un article ultérieur d'Anthropic Engineering sur leur système de recherche multi-agents (juin 2025), les auteurs indiquent que les agents consomment généralement environ **4 fois plus de tokens** qu'une conversation, et les systèmes multi-agents environ **15 fois plus**. En contrepartie, leur système multi-agents a surpassé un agent unique Claude Opus 4 de **90,2 %** sur leur évaluation interne de recherche. À retenir : l'orchestration multi-agents peut valoir le coup, mais seulement si la valeur de la tâche justifie la facture de tokens.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "À propos des frameworks",
          text: "Les frameworks facilitent le démarrage, mais ajoutent des couches d'abstraction qui peuvent masquer les prompts et réponses sous-jacents, ce qui complique le débogage, et incitent à ajouter une complexité inutile. L'article conseille de commencer directement avec les API des LLM, car beaucoup de patterns tiennent en quelques lignes, et de bien comprendre le code sous-jacent si vous utilisez un framework.",
        },
      ],
    },
    {
      id: "aci",
      kind: "deep-dive",
      title: "L'interface agent-ordinateur (ACI)",
      blocks: [
        {
          type: "p",
          text: "Un détail révélateur de l'annexe : en construisant leur agent pour SWE-bench, l'équipe a passé plus de temps sur les outils que sur le prompt. Les outils sont les mains de l'agent, et chaque définition d'outil est un prompt que le modèle lit.",
        },
        {
          type: "quote",
          text: "we actually spent more time optimizing our tools than the overall prompt.",
          translation: "nous avons en fait passé plus de temps à optimiser nos outils que le prompt global.",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Leur exemple concret : le modèle se trompait avec des chemins de fichiers relatifs après avoir quitté le répertoire racine. La solution n'a pas été un prompt plus malin. Ils ont modifié l'outil pour exiger systématiquement des chemins absolus, et le modèle l'a ensuite utilisé sans faute. C'est le **poka-yoke**, un terme industriel qui désigne la conception de pièces impossibles à monter à l'envers.",
        },
        {
          type: "list",
          items: [
            "**Laissez au modèle assez de tokens pour réfléchir** avant qu'il ne s'enferme dans une impasse.",
            "**Gardez des formats proches du texte qu'on trouve naturellement sur Internet.**",
            "**Évitez la surcharge de formatage** : écrire un diff impose de connaître le nombre de lignes modifiées dans l'en-tête du bloc avant d'écrire le code ; du code dans du JSON exige d'échapper en plus les retours à la ligne et les guillemets.",
            "**Documentez les outils comme une excellente docstring pour un développeur junior** : exemples d'usage, cas limites, format d'entrée attendu, et frontières claires avec les autres outils.",
            "**Testez** la façon dont le modèle utilise réellement vos outils sur de nombreuses entrées, puis itérez.",
          ],
        },
        {
          type: "code",
          language: "jsonc",
          code: code.toolDefinition,
          caption: "Définitions d'outils illustratives (notre exemple, appliquant les conseils de l'article).",
        },
        {
          type: "p",
          text: "L'article se conclut par trois principes : **préserver la simplicité** de la conception de l'agent ; **privilégier la transparence** en montrant explicitement ses étapes de planification ; et **soigner l'interface agent-ordinateur** par une documentation d'outils rigoureuse et des tests.",
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
              id: "q-routing",
              prompt:
                "Un système de support classe chaque e-mail entrant en facturation, rapport de bug ou prospect commercial, puis répond avec un prompt et des outils spécialisés pour cette catégorie. De quel pattern s'agit-il ?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "Orchestrateur-workers",
                  feedback:
                    "Pas tout à fait. Un orchestrateur invente des sous-tâches à l'exécution. Ici, les catégories sont fixées à l'avance et chaque e-mail suit exactement un chemin prédéfini.",
                },
                {
                  id: "b",
                  text: "Routage",
                  feedback:
                    "Exact. On classe, puis on aiguille vers un chemin spécialisé. Grâce à la séparation des responsabilités, ajuster le prompt de facturation ne dégrade pas le traitement des bugs.",
                },
                {
                  id: "c",
                  text: "Parallélisation (vote)",
                  feedback:
                    "Le vote exécute plusieurs fois la même tâche puis agrège les réponses. Ici, chaque e-mail est traité une seule fois, par un seul chemin spécialisé.",
                },
              ],
            },
            {
              id: "q-parallel",
              prompt:
                "Votre assistant de revue de code lance trois relecteurs indépendants (sécurité, performance, style) en même temps plutôt que l'un après l'autre. Qu'est-ce qui change ?",
              correctOptionId: "a",
              options: [
                {
                  id: "a",
                  text: "Autant d'appels, mais une latence de bout en bout plus faible",
                  feedback:
                    "Exact. Le coût reste de trois appels, mais ils ont lieu en un seul tour au lieu de trois. C'est du sectionnement : des sous-tâches indépendantes exécutées simultanément.",
                },
                {
                  id: "b",
                  text: "Moins d'appels LLM, donc un coût plus faible",
                  feedback:
                    "Non. Il y a toujours trois appels. Les lancer en parallèle ne les rend pas moins chers.",
                },
                {
                  id: "c",
                  text: "Cela devient un agent autonome",
                  feedback:
                    "Non. Votre code décide toujours exactement quels trois appels sont lancés. Le modèle ne dirige pas le processus.",
                },
              ],
            },
            {
              id: "q-stopping",
              prompt:
                "Votre agent de code tourne parfois en boucle longtemps, modifiant des fichiers et relançant les tests. Quelle modification suit le mieux les conseils de l'article ?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "Retirer les tests de la boucle pour qu'il termine plus vite",
                  feedback:
                    "Cela supprime la vérité terrain de l'agent. Les résultats des tests sont précisément le retour de l'environnement qui lui permet de détecter et corriger ses erreurs.",
                },
                {
                  id: "b",
                  text: "Passer à un framework plus gros, avec plus d'abstraction",
                  feedback:
                    "L'article prévient que les couches d'abstraction peuvent masquer les prompts et réponses sous-jacents, ce qui rend justement ce genre de problème plus difficile à déboguer.",
                },
                {
                  id: "c",
                  text: "Fixer un nombre maximal d'itérations et transmettre la trace à un humain quand il est atteint",
                  feedback:
                    "Exact. L'article recommande des conditions d'arrêt, comme un nombre maximal d'itérations, pour garder le contrôle, et un agent peut s'arrêter pour demander l'avis d'un humain face à un blocage.",
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
            "Je commence par la solution la plus simple qui fonctionne : un seul appel LLM bien rédigé, avec de la recherche documentaire. Si la tâche a des étapes connues, j'utilise un workflow, comme le chaînage, le routage, la parallélisation, l'orchestrateur-workers ou l'évaluateur-optimiseur, car le contrôle du flux reste dans le code : c'est prévisible, testable et moins cher. Je n'utilise un agent autonome que lorsque le nombre d'étapes est imprévisible et que le succès est vérifiable, comme une modification de code validée par des tests. J'investis alors dans la conception des outils, les conditions d'arrêt, l'isolation et le traçage, car l'autonomie ajoute du coût et des erreurs cumulées.",
          keyPointsTitle: "Points clés",
          keyPoints: [
            "Workflow : votre code décide du chemin. Agent : le modèle décide du chemin.",
            "Ne gravir l'échelle de complexité que si les mesures le justifient.",
            "Le parallèle coûte plus mais réduit la profondeur de latence ; les boucles multiplient le coût.",
            "Un agent a besoin de vérité terrain, de points de contrôle et de conditions d'arrêt.",
            "Les outils sont des prompts : soignez l'interface agent-ordinateur (chemins absolus, doc claire, tests).",
            "Trois principes : simplicité, transparence, et des outils bien documentés et testés.",
          ],
          followUpsTitle: "Questions de relance probables",
          followUps: [
            {
              question: "Quand ne pas utiliser d'agent ?",
              answer:
                "Quand les étapes sont connues à l'avance, quand les budgets de latence ou de coût sont serrés, quand les erreurs sont coûteuses et difficiles à détecter, ou quand on ne peut pas vérifier le succès de façon fiable. Un workflow ou un appel unique est plus prévisible et plus facile à tester.",
            },
            {
              question: "Comment évaluer un agent avant de le mettre en production ?",
              answer:
                "Constituer un ensemble de tâches réalistes aux résultats vérifiables, par exemple des tests qui doivent passer. Exécuter l'agent dans une sandbox, conserver les traces complètes, et mesurer le taux de succès, le coût par tâche et les modes d'échec. Surveiller les boucles et les erreurs cumulées, et garder un point de contrôle humain pour les actions à fort impact.",
            },
            {
              question: "Orchestrateur-workers ou parallélisation ?",
              answer:
                "Les deux lancent plusieurs appels LLM. Avec la parallélisation, votre code prédéfinit les sous-tâches. Avec l'orchestrateur-workers, un LLM les détermine à l'exécution à partir de l'entrée : plus flexible, mais plus difficile à borner en coût et à tester.",
            },
            {
              question: "Comment rendre des outils plus faciles à utiliser pour un modèle ?",
              answer:
                "Traiter les définitions d'outils comme des prompts : noms clairs, descriptions façon docstring avec exemples et cas limites, formats proches du texte naturel, et contraintes qui rendent les erreurs impossibles, comme exiger des chemins absolus.",
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
          text: "Cette leçon est une explication originale. Les citations sont reproduites mot pour mot en anglais à partir des sources ci-dessous, accompagnées de notre traduction. Les analogies, diagrammes, scénarios, pseudocode, l'exemple de définition d'outil et le calcul des erreurs cumulées sont nos propres illustrations.",
        },
        { type: "sources" },
      ],
    },
  ],
};
