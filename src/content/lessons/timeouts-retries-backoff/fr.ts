import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const T = "timeouts-retries-jitter";
const code = codeFor("fr");

export const fr: LessonBody = {
  title: "Timeouts, reprises et backoff avec jitter : survivre aux pannes partielles",
  subtitle:
    "Combien de temps attendre, quand réessayer, et comment éviter qu'une petite panne en devienne une grande. Les leçons de la Builders' Library d'Amazon, rendues interactives.",
  hook: "Une reprise peut sauver une requête ou faire tomber une base de données. Apprenez la bonne dose : timeouts, backoff, jitter et idempotence.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "La panne des 20 millisecondes",
      blocks: [
        {
          type: "p",
          text: "Une équipe d'Amazon avait un jour réglé très bas le timeout d'un appel à une dépendance, autour de 20 millisecondes. La plupart du temps, c'était largement suffisant. Mais juste après chaque déploiement, quelques appels expiraient. La cause n'était pas une dépendance lente : les nouveaux processus devaient d'abord établir leurs connexions, et cette seule étape prenait plus de 20 ms. La solution a été d'ouvrir ces connexions au démarrage du processus, avant de recevoir du trafic.",
        },
        {
          type: "p",
          text: "Cette histoire ouvre un article classique de l'AWS Builders' Library, « Timeouts, retries, and backoff with jitter » (décembre 2019). Son message : dans un système distribué, serveurs, réseaux et déploiements tombent en panne tout le temps, partiellement et brièvement. Quatre petits outils décident si ces pannes restent petites : les **timeouts**, les **reprises**, le **backoff** et le **jitter**. Bien utilisés, ils cachent les pannes aux utilisateurs. Mal utilisés, ils les amplifient.",
        },
        {
          type: "quote",
          text: "Retries are similar to a powerful medicine -- useful in the right dose, but can cause significant damage when used too much.",
          translation: "Les reprises ressemblent à un médicament puissant : utiles à la bonne dose, mais capables de causer des dégâts importants en cas d'excès.",
          sourceId: T,
        },
        {
          type: "callout",
          tone: "insight",
          title: "À la fin, vous saurez",
          text: "Choisir un timeout à partir d'un percentile de latence ; décider quelles erreurs réessayer ; expliquer l'amplification des reprises avec des chiffres ; décrire le backoff exponentiel, le jitter et les budgets de reprise ; et sécuriser une API réessayée avec une clé d'idempotence.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Intuition : appeler un restaurant bondé",
      blocks: [
        {
          type: "p",
          text: "Vous appelez un restaurant pour réserver. Personne ne décroche, alors vous raccrochez au bout d'un moment : c'est un **timeout**. Vous rappelez : une **reprise**. Si c'est toujours occupé, vous attendez plus longtemps avant chaque nouvel essai : le **backoff**. Imaginez maintenant mille personnes qui ont toutes raccroché à 19 h 00 et rappellent toutes à 19 h 01 pile. La ligne sature de nouveau. Si chacun attend une durée aléatoire légèrement différente, les appels s'étalent et le restaurant peut répondre : c'est le **jitter**.",
        },
        {
          type: "p",
          text: "Encore un détail : vous avez demandé une table, la ligne a coupé, et vous ne savez pas si la réservation est enregistrée. Si vous rappelez en disant « une table pour quatre à 20 h », vous risquez deux réservations. Si vous dites « c'est la demande de réservation n° a1b2 », le restaurant sait que c'est la même. C'est l'**idempotence**.",
        },
        {
          type: "callout",
          tone: "analogy",
          title: "La tension centrale",
          text: "Les reprises sont égoïstes : chacune consomme davantage de temps serveur pour augmenter vos propres chances de succès. Quand le serveur va bien, c'est un bon échange. Quand il est surchargé, les reprises égoïstes de tout le monde aggravent la situation.",
        },
      ],
    },
    {
      id: "timeouts",
      kind: "deep-dive",
      title: "Timeouts : combien de temps attendre",
      blocks: [
        {
          type: "p",
          text: "Chaque appel distant a besoin d'un timeout. Une requête qui attend indéfiniment retient des ressources tout ce temps : mémoire, threads, connexions, ports. Quand assez de requêtes retiennent des ressources longtemps, le serveur s'épuise, et une dépendance lente devient votre panne.",
        },
        {
          type: "p",
          text: "Le plus difficile, selon l'article, est de choisir la valeur. Trop haute, les requêtes bloquées s'accumulent. Trop basse, vous coupez des requêtes qui auraient réussi, ce qui provoque plus de reprises, plus de trafic en arrière-plan et plus de latence.",
        },
        {
          type: "quote",
          text: "Typically, the most difficult problem is choosing a timeout value to set.",
          translation: "En général, le problème le plus difficile est de choisir la valeur du timeout.",
          sourceId: T,
        },
        {
          type: "p",
          text: "La méthode d'Amazon est concrète : choisir un taux acceptable de faux timeouts, par exemple 0,1 %, puis régler le timeout sur le percentile de latence correspondant du service appelé, ici le **p99.9**. Si la dépendance répond en moins de 180 ms dans 99,9 % des cas, un timeout proche de 180 ms ne coupe à tort qu'environ une requête saine sur mille. (Les 180 ms sont notre exemple.)",
        },
        {
          type: "list",
          items: [
            "**Mesurer la bonne chose** : l'histoire des 20 ms montre qu'un timeout peut inclure l'établissement de la connexion, ce que les métriques de latence habituelles ne reflètent pas forcément.",
            "**Savoir ce que couvre le timeout** : selon la bibliothèque, il peut ne pas inclure la résolution DNS ou la poignée de main TLS.",
            "**Prévoir de la marge pour les appels via Internet** : la latence y varie bien plus que dans un centre de données ; il faut intégrer une latence réseau pire cas raisonnable.",
          ],
        },
      ],
    },
    {
      id: "retries",
      kind: "deep-dive",
      title: "Reprises : quand réessayer aide, et quand cela nuit",
      blocks: [
        {
          type: "p",
          text: "Beaucoup de pannes sont passagères : un serveur redémarre, un paquet se perd, un nœud est brièvement surchargé. Réessayer les transforme en succès que l'utilisateur ne voit jamais. Mais toutes les erreurs ne méritent pas une reprise, et toutes les requêtes ne peuvent pas être envoyées deux fois sans risque. Parcourez pas à pas les trois chronologies ci-dessous.",
        },
        { type: "interactive", widget: "sequence", ref: "sequence" },
        {
          type: "list",
          items: [
            "**Les erreurs client** (requête mal formée ou non autorisée) ne réussiront pas plus tard. Ne renvoyez pas la même requête.",
            "**Les erreurs serveur et les timeouts** peuvent réussir à une tentative suivante. Ce sont eux, les candidats aux reprises.",
            "**Les effets de bord** changent tout : après un timeout, vous ignorez si la première tentative a eu lieu. Réessayer une API non idempotente peut débiter une carte deux fois.",
          ],
        },
        {
          type: "quote",
          text: "In general, our view is that APIs with side effects aren't safe to retry unless they provide idempotency.",
          translation: "En règle générale, nous considérons que les API à effets de bord ne peuvent être réessayées sans risque que si elles garantissent l'idempotence.",
          sourceId: T,
        },
        {
          type: "p",
          text: "L'article compagnon, « Making retries safe with idempotent APIs », définit une opération idempotente comme une opération dont la requête peut être réessayée sans effet de bord supplémentaire. La conception préférée d'AWS est un **identifiant de requête client** unique dans le contrat d'API, généré par l'appelant et réutilisé à chaque reprise ; de nombreuses API AWS l'appellent ClientToken, et les SDK en génèrent un automatiquement si l'appelant n'en fournit pas. Une reprise avec le même identifiant obtient une réponse sémantiquement équivalente. Si le même identifiant arrive avec des paramètres différents, le service renvoie une erreur de validation plutôt que de deviner l'intention de l'appelant.",
        },
      ],
    },
    {
      id: "amplification",
      kind: "explore",
      title: "L'amplification des reprises : 3 tentatives deviennent 243",
      blocks: [
        {
          type: "p",
          text: "Les reprises se multiplient quand les systèmes sont en couches. L'exemple de l'article : l'appel d'un client déclenche une pile de cinq niveaux d'appels de services, et la base de données tout en bas commence à échouer. Si chaque couche réessaie indépendamment, chaque échec multiplie la charge sur la couche du dessous. Avec trois tentatives par couche, la base reçoit 3⁵ = 243 requêtes par appel client, au moment précis où elle est le moins capable de les absorber.",
        },
        { type: "interactive", widget: "chart", ref: "amplification" },
        {
          type: "p",
          text: "La solution est structurelle : réessayer en un seul point de la pile. Les couches inférieures échouent vite et remontent l'erreur ; une seule couche décide de réessayer. L'amplification disparaît, et les reprises restantes deviennent faciles à raisonner.",
        },
        {
          type: "quote",
          text: "our best practice is to retry at a single point in the stack.",
          translation: "notre bonne pratique est de réessayer en un seul point de la pile.",
          sourceId: T,
        },
      ],
    },
    {
      id: "backoff",
      kind: "deep-dive",
      title: "Backoff, plafonds et budgets de reprise",
      blocks: [
        {
          type: "p",
          text: "Réessayer immédiatement, c'est frapper un serveur en difficulté pendant qu'il est encore en difficulté. Le **backoff exponentiel** attend plus longtemps après chaque échec : par exemple 100 ms, puis 200 ms, puis 400 ms. Comme les attentes grandissent vite, l'article recommande un **plafond**, d'où le nom de capped exponential backoff. Mais un plafond seul a un effet secondaire : une fois que tous les clients atteignent l'attente maximale, ils réessaient tous en continu à ce rythme plafonné.",
        },
        {
          type: "p",
          text: "Amazon limite donc aussi les reprises **localement avec un token bucket** : chaque reprise consomme un jeton ; tant qu'il en reste, les appels peuvent réessayer ; une fois le seau vide, les reprises ne continuent qu'à un rythme fixe et lent. AWS a ajouté ce comportement au SDK AWS en 2016. Plus largement, l'équipe évite l'amplification en ne réessayant que lorsqu'elle observe que la dépendance est en bonne santé.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Et les circuit breakers ?",
          text: "Un circuit breaker cesse complètement d'appeler une dépendance défaillante pendant un temps. Il est populaire, mais l'article prévient qu'il introduit des modes de fonctionnement difficiles à tester et peut allonger nettement le temps de rétablissement. Les budgets de reprise (token buckets) offrent une limite plus douce et toujours active.",
        },
      ],
    },
    {
      id: "jitter",
      kind: "explore",
      title: "Le jitter : casser la ruée synchronisée",
      blocks: [
        {
          type: "p",
          text: "Le backoff seul ne suffit pas quand de nombreux clients échouent au même moment : ils calculent tous la même attente et reviennent tous au même instant. Si tous les appels en échec reculent jusqu'au même moment, ils provoquent de nouveau contention ou surcharge à la reprise. Le **jitter** ajoute de l'aléatoire à chaque attente pour étaler les reprises dans le temps.",
        },
        {
          type: "p",
          text: "Le graphique ci-dessous est notre simulation, pas une mesure : 100 clients échouent ensemble et réessaient trois fois pendant que le serveur est encore en panne. Comparez où tombent les reprises avec un délai fixe, avec un backoff exponentiel, et avec un backoff plus full jitter (une attente aléatoire entre zéro et la valeur du backoff).",
        },
        { type: "interactive", widget: "chart", ref: "jitter" },
        {
          type: "p",
          text: "Le jitter ne sert pas qu'aux reprises. L'article recommande d'en ajouter aussi aux minuteurs, tâches périodiques et autres travaux différés : des clients qui interrogent un service une fois par minute, ou des tâches planifiées à minuit, s'alignent sinon en pics. Pour le travail planifié, Amazon utilise un jitter **constant** par hôte plutôt qu'une nouvelle valeur aléatoire, afin que les problèmes se reproduisent selon un motif reconnaissable. Étaler cette charge leur a permis d'accomplir le même travail avec moins de capacité serveur.",
        },
      ],
    },
    {
      id: "code",
      kind: "example",
      title: "Tout assembler en code",
      blocks: [
        {
          type: "p",
          text: "Voici l'esquisse d'un utilitaire de reprise côté client qui applique tout ce qui précède : un timeout sur chaque appel, des reprises seulement pour les erreurs susceptibles de réussir plus tard, un budget de reprise local, un backoff exponentiel plafonné avec full jitter, et une seule clé d'idempotence partagée par toutes les tentatives. Les noms comme `send`, `retryBudget` et `P999_LATENCY_MS` sont des exemples, pas un vrai SDK.",
        },
        {
          type: "code",
          language: "ts",
          code: code.retry,
          caption: "Notre esquisse. Dans un système en couches, une seule couche devrait exécuter une boucle comme celle-ci.",
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
          caption: "Synthèse de l'article ; la colonne « règle pratique » est la nôtre.",
          columns: ["Technique", "Protège contre", "Risque si mal utilisée", "Règle pratique"],
          rows: [
            ["Timeout", "Épuisement des ressources par des appels bloqués", "Trop bas : faux timeouts et tempêtes de reprises", "Régler sur le p99.9 de la dépendance ; vérifier ce qu'il couvre"],
            ["Reprise", "Erreurs passagères", "Effets de bord dupliqués ; amplification", "Erreurs serveur/timeouts seulement ; une couche ; API idempotentes"],
            ["Backoff exponentiel", "Marteler un serveur en difficulté", "Clients synchronisés au plafond", "Toujours le plafonner, et ajouter du jitter"],
            ["Jitter", "Pics synchronisés", "Bugs temporels plus durs à reproduire", "Aléatoire pour les reprises ; constant par hôte pour les plannings"],
            ["Token bucket", "Tempêtes de reprises lors de grosses pannes", "Moins de reprises quand on en voudrait", "Un jeton par reprise ; recharge lente"],
            ["Circuit breaker", "Appeler une dépendance morte", "Comportement modal ; rétablissement plus lent", "Préférer les budgets ; si utilisé, tester les deux modes"],
          ],
        },
        {
          type: "p",
          text: "Le conseil final de l'article relie ces compromis : les pannes passagères et la latence sont inévitables, alors préparez-vous-y, mais soyez prudent avec les reprises. Réessayez quand la dépendance semble saine, et arrêtez quand les reprises n'améliorent plus la disponibilité.",
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
              id: "q-timeout",
              prompt:
                "Votre équipe accepte qu'environ 1 appel sain sur 1 000 soit coupé par un timeout. Sur quelle valeur baser le timeout ?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "La latence moyenne de la dépendance",
                  feedback: "La moyenne masque la queue de distribution. Beaucoup de requêtes saines sont plus lentes que la moyenne : vous en couperiez bien plus de 0,1 %.",
                },
                {
                  id: "b",
                  text: "Un chiffre rond comme 30 secondes, par sécurité",
                  feedback: "Un timeout énorme laisse les requêtes bloquées retenir threads et connexions très longtemps, ce qui peut épuiser le serveur.",
                },
                {
                  id: "c",
                  text: "La latence p99.9 de la dépendance",
                  feedback: "Exact. Un budget de 0,1 % de faux timeouts correspond au 99,9e percentile de la latence en aval : la méthode d'Amazon.",
                },
              ],
            },
            {
              id: "q-amplification",
              prompt:
                "Une requête traverse 4 services avant d'atteindre une base de données. Chaque service fait jusqu'à 3 tentatives. La base est en panne. Combien de requêtes peuvent l'atteindre par requête utilisateur ?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "12",
                  feedback: "C'est l'addition des tentatives (4 × 3). Les reprises se multiplient : chaque tentative d'une couche déclenche jusqu'à 3 tentatives dans la suivante.",
                },
                {
                  id: "b",
                  text: "81",
                  feedback: "Oui : 3⁴ = 81. C'est pourquoi l'article recommande de réessayer en un seul point de la pile.",
                },
                {
                  id: "c",
                  text: "3",
                  feedback: "C'est la charge quand une seule couche réessaie. Avec des reprises indépendantes à chaque couche, elle se multiplie.",
                },
              ],
            },
            {
              id: "q-idempotency",
              prompt:
                "Un appel de paiement expire. Vous ne savez pas si le débit a eu lieu. Qu'est-ce qui rend la reprise sûre ?",
              correctOptionId: "a",
              options: [
                {
                  id: "a",
                  text: "Envoyer le même identifiant de requête, généré par le client, à chaque tentative",
                  feedback: "Exact. Le service reconnaît l'identifiant et renvoie une réponse équivalente au lieu de débiter à nouveau.",
                },
                {
                  id: "b",
                  text: "Attendre plus longtemps avant de réessayer",
                  feedback: "Le backoff réduit la charge, mais la seconde requête créerait quand même un second débit.",
                },
                {
                  id: "c",
                  text: "Laisser le serveur détecter les doublons d'après le montant et la carte",
                  feedback: "Deux débits identiques peuvent être voulus (deux cafés). AWS préfère un identifiant de requête explicite fourni par l'appelant.",
                },
              ],
            },
            {
              id: "q-jitter",
              prompt:
                "Des milliers de clients mobiles perdent la connexion pendant une courte panne et utilisent tous le même backoff exponentiel. Quel problème subsiste ?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "Aucun : le backoff exponentiel étale déjà la charge",
                  feedback: "Il espace les tentatives de chaque client, mais tous les clients calculent les mêmes attentes et reviennent donc ensemble.",
                },
                {
                  id: "b",
                  text: "Ils vont réessayer des erreurs client",
                  feedback: "La classification des erreurs est un autre sujet. Le problème ici, c'est le moment.",
                },
                {
                  id: "c",
                  text: "Leurs reprises arrivent par vagues synchronisées ; il faut du jitter",
                  feedback: "Exactement. Rendre chaque attente aléatoire étale les reprises, comme le montre la simulation.",
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
            "Chaque appel distant a un timeout, réglé sur la latence p99.9 de la dépendance pour que seulement 0,1 % environ des appels sains soient coupés. Je ne réessaie que les échecs qui peuvent réussir plus tard, comme les erreurs serveur et les timeouts, jamais la même erreur client, et à une seule couche de la pile, car des reprises indépendantes se multiplient : trois tentatives sur cinq couches, c'est 243 fois la charge. Les reprises utilisent un backoff exponentiel plafonné avec jitter pour que les clients ne reviennent pas en même temps, plus un budget de reprise par token bucket. Tout ce qui a des effets de bord doit être idempotent, avec un identifiant de requête généré par le client et réutilisé à chaque tentative.",
          keyPointsTitle: "Points clés",
          keyPoints: [
            "Les timeouts protègent vos ressources ; choisissez-les à partir d'un percentile de latence, pas au hasard.",
            "Les reprises sont égoïstes : idéales pour les erreurs passagères, nuisibles en cas de surcharge.",
            "Réessayer les erreurs serveur et les timeouts, pas les erreurs client ; une seule couche.",
            "L'amplification est multiplicative : tentatives^couches (3⁵ = 243).",
            "Backoff + plafond + jitter + token bucket empêchent les reprises de se synchroniser en tempête.",
            "Les effets de bord exigent l'idempotence : un identifiant de requête, une réponse équivalente à la reprise.",
          ],
          followUpsTitle: "Questions de relance probables",
          followUps: [
            {
              question: "Pourquoi ne pas simplement utiliser un circuit breaker ?",
              answer:
                "Il peut aider, mais l'article prévient qu'il ajoute un comportement modal difficile à tester et peut ralentir le rétablissement. Un budget de reprise local (token bucket) limite les reprises en continu, sans mode séparé.",
            },
            {
              question: "Où placer les reprises dans une pile de microservices ?",
              answer:
                "En un seul point, en général la couche la plus haute qui porte la requête utilisateur. Les couches inférieures échouent vite et propagent l'erreur, pour que les reprises ne se multiplient pas dans la pile.",
            },
            {
              question: "Comment rendre idempotente une API de paiement existante ?",
              answer:
                "Ajouter au contrat un identifiant de requête fourni par le client, le stocker de façon atomique avec le résultat, renvoyer la réponse stockée (équivalente) aux répétitions pendant une fenêtre de rétention, et rejeter un identifiant réutilisé avec d'autres paramètres.",
            },
            {
              question: "Que surveillez-vous pour détecter une tempête de reprises ?",
              answer:
                "Le ratio reprises / premières tentatives, le taux de timeouts par dépendance, l'épuisement du budget de reprise, et le débit en bas de la pile comparé au trafic utilisateur. L'écart entre les deux, c'est l'amplification.",
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
          text: "Cette leçon est une explication originale. Les citations sont reproduites mot pour mot en anglais à partir des sources ci-dessous, avec notre traduction. L'analogie du restaurant, les scénarios de séquence, l'esquisse de code, l'exemple des 180 ms, le graphique d'amplification (arithmétique) et le graphique du jitter (simulation à graine fixe) sont nos propres illustrations. La définition du full jitter est confirmée par la référence des SDK AWS sur le comportement des reprises.",
        },
        { type: "sources" },
      ],
    },
  ],
};
