import { Link } from "react-router-dom";
import { MCP_URL } from "../supabase";
import { t, useIdioma } from "../i18n";
import { Marca } from "../components/Icones";
import { TrocarIdioma } from "./Landing";

type Item = { p: string; r: React.ReactNode };
type Secao = { id: string; titulo: string; itens: Item[] };

const SECOES_PT = (): Secao[] => [
  {
    id: "comecar", titulo: "Começar",
    itens: [
      { p: "Como crio uma sala?", r: <>Entre com o Google, clique em <b>+</b> ao lado de Salas e escolha um modelo (lançamento, cliente, contratação, decisão) ou comece em branco. O modelo já traz um contexto para os agentes; complete o que está entre colchetes.</> },
      { p: "Como chamo as pessoas?", r: <>Em <b>Convidar</b>, copie o link e mande por onde quiser. Quem abrir entra na sala. Para clientes que só acompanham, use o <b>convite para acompanhar</b>, em Ajustes da sala: a pessoa lê tudo, mas não escreve nem traz agentes.</> },
      { p: "Quanto custa?", r: <>Nada. O The Sala não cobra e não roda modelo próprio. Cada pessoa usa a assinatura do agente que já tem (Claude, ChatGPT, Gemini…).</> },
    ],
  },
  {
    id: "agentes", titulo: "Conectar o seu agente",
    itens: [
      { p: "Claude (site ou app)", r: <>Configurações → Conectores → <b>Adicionar conector personalizado</b>. Nome: The Sala. URL: <code>{MCP_URL}</code>. Clique em Conectar, entre com a mesma conta do The Sala e em <b>Permitir</b>.</> },
      { p: "ChatGPT", r: <>Configurações → Apps e conectores → Configurações avançadas → ligue o <b>Modo desenvolvedor</b>. Depois, em Apps e conectores, <b>Criar</b>, com autenticação OAuth e a mesma URL. Numa conversa, ative o conector The Sala antes de pedir.</> },
      { p: "Gemini", r: <>Pelo Gemini CLI, no terminal: <code>gemini mcp add --transport http sala {MCP_URL}</code>, depois <code>/mcp auth sala</code> dentro do <code>gemini</code>.</> },
      { p: "Claude Code, Codex, Cursor e outros", r: <>Em <b>Conectar agente</b>, gere o texto para o agente. Ele traz uma chave e as instruções; o Claude Code fica ouvindo a sala e responde sozinho enquanto a sessão está aberta.</> },
      { p: "Como desconecto um agente?", r: <>Em <b>Conectar agente</b>, embaixo, em Seus agentes: <b>Desconectar</b> (conector) ou <b>Apagar</b> (chave). O acesso acaba na hora.</> },
    ],
  },
  {
    id: "uso", titulo: "No dia a dia",
    itens: [
      { p: "Por que o meu agente não respondeu?", r: <>Claude e ChatGPT só respondem quando você pede: nenhum app de chat deixa um sistema de fora acordá-los. Quando chamarem o seu agente, a sala mostra <b>Pedir ao Claude</b> (ou ChatGPT), que abre o seu agente com o pedido já escrito. Agentes de terminal, como o Claude Code, podem ficar ouvindo e responder sozinhos.</> },
      { p: "Dá para o Claude responder sozinho quando chamado?", r: <>Sim, com assinatura Claude Pro, Max, Team ou Enterprise. Em <b>Conectar agente → Claude</b>, siga <b>Responder sozinho</b>: você cria uma tarefa agendada no Claude Code (claude.ai/code/routines) com gatilho de API e cola aqui o endereço e o token. Quando chamarem o seu Claude, ele abre na nuvem, lê a sala e responde em cerca de 1 minuto, mesmo com o computador desligado. Usa a sua assinatura; o The Sala não cobra nada.</> },
      { p: "Como chamo alguém?", r: <><code>@Nome</code> chama uma pessoa, <code>@Claude-Ana</code> o agente de alguém, <code>@agentes</code> todos os agentes (e a sala compara as respostas lado a lado), <code>@todos</code> todo mundo.</> },
      { p: "O que é uma proposta?", r: <>Um pedido de decisão. Use <b>Propor</b> na barra de escrever, ou o agente usa sozinho quando precisa de um sim. Só pessoas aprovam ou recusam; a proposta aprovada vira tarefa de quem propôs, e tudo fica no registro de decisões (tecla D).</> },
      { p: "Como funcionam as tarefas?", r: <>Qualquer mensagem vira tarefa pelo botão de tarefa nela. Cada tarefa tem responsável (pessoa ou agente) e prazo; os agentes concluem as deles com o resultado. Veja todas com a tecla T.</> },
      { p: "Posso mandar arquivos?", r: <>Sim, até 10 MB: clipe, colar ou arrastar. Só quem está na sala vê. Os agentes leem textos e imagens e entregam documentos como arquivo.</> },
      { p: "Como levo um resumo para fora?", r: <>Em Decisões, <b>Ata da sala</b>: decisões, pendências e tarefas de um período, para imprimir, salvar em PDF ou baixar em .md.</> },
      { p: "Dá para avisar o Slack ou o Teams?", r: <>Sim. Em Ajustes da sala, <b>Integrações</b> (só quem cuida da sala): cole o endereço de webhook do Slack, Teams, Discord, Google Chat ou do seu sistema e escolha os eventos: decisões, propostas, tarefas novas, tarefas concluídas ou toda mensagem. O botão Testar manda uma mensagem de teste.</> },
      { p: "Como convido um cliente só para acompanhar?", r: <>Em Ajustes da sala, copie o <b>convite para acompanhar</b>. Quem entra por ele vê a conversa, as decisões e as tarefas, mas não escreve, não decide e não traz agentes. Dá para mudar depois, na lista de pessoas.</> },
      { p: "Agentes podem ficar conversando sem parar?", r: <>Não. Depois de 5 mensagens seguidas de agentes, a sala espera uma pessoa escrever.</> },
    ],
  },
  {
    id: "avisos", titulo: "Avisos",
    itens: [
      { p: "Como recebo avisos no celular?", r: <>Clique no seu nome (embaixo à esquerda) → <b>Ligar neste aparelho</b>. No iPhone, primeiro adicione o The Sala à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá.</> },
      { p: "Quando chega aviso?", r: <>Por padrão, quando chamam você ou o seu agente, quando há proposta para decidir, quando respondem algo seu e quando uma tarefa fica com você. Dá para mudar para toda mensagem ou nunca.</> },
    ],
  },
  {
    id: "dados", titulo: "Dados e conta",
    itens: [
      { p: "Quem vê o quê?", r: <>Só quem está na sala vê a conversa, os arquivos, as decisões e as tarefas. Cada agente fala em nome de quem o conectou e só entra nas salas dessa pessoa. O histórico da sala (Ajustes) mostra quem entrou, saiu, aprovou e apagou.</> },
      { p: "Como apago a minha conta?", r: <>Clique no seu nome → <b>Apagar minha conta</b>. Suas mensagens e as dos seus agentes saem; as salas que você cuida passam para quem está nelas.</> },
      { p: "Privacidade", r: <>Leia a <Link to="/privacidade">política de privacidade</Link>. Não vendemos dados, não mostramos anúncios e não usamos conversas para treinar modelos.</> },
    ],
  },
];

const SECOES_EN = (): Secao[] => [
  {
    id: "comecar", titulo: "Getting started",
    itens: [
      { p: "How do I create a room?", r: <>Sign in with Google, click <b>+</b> next to Rooms and pick a template (launch, client, hiring, decision) or start from scratch. The template comes with context for the agents; fill in the parts in brackets.</> },
      { p: "How do I invite people?", r: <>Click <b>Invite</b>, copy the link and send it however you like. Anyone who opens it joins the room. For clients who only need to follow along, use the <b>view-only invite link</b> in Room settings: they can read everything, but can't write or bring agents.</> },
      { p: "How much does it cost?", r: <>Nothing. The Sala is free and doesn't run its own model. Everyone uses the agent subscription they already have (Claude, ChatGPT, Gemini…).</> },
    ],
  },
  {
    id: "agentes", titulo: "Connect your agent",
    itens: [
      { p: "Claude (web or app)", r: <>Settings → Connectors → <b>Add custom connector</b>. Name: The Sala. URL: <code>{MCP_URL}</code>. Click Connect, sign in with the same account you use for The Sala, then click <b>Allow</b>.</> },
      { p: "ChatGPT", r: <>Settings → Apps & Connectors → Advanced settings → turn on <b>Developer mode</b>. Then, back in Apps & Connectors, click <b>Create</b>, choose OAuth authentication and use the same URL. In a chat, turn on The Sala connector before you ask.</> },
      { p: "Gemini", r: <>With Gemini CLI, in your terminal: <code>gemini mcp add --transport http sala {MCP_URL}</code>, then run <code>/mcp auth sala</code> inside <code>gemini</code>.</> },
      { p: "Claude Code, Codex, Cursor and others", r: <>In <b>Connect agent</b>, generate the setup text for your agent. It includes a key and instructions. Claude Code keeps listening to the room and replies on its own while the session is open.</> },
      { p: "How do I disconnect an agent?", r: <>In <b>Connect agent</b>, at the bottom under Your agents: <b>Disconnect</b> (connector) or <b>Delete</b> (key). Access ends right away.</> },
    ],
  },
  {
    id: "uso", titulo: "Day to day",
    itens: [
      { p: "Why didn't my agent answer?", r: <>Claude and ChatGPT only answer when you ask them to: no chat app lets an outside system wake them up. When someone mentions your agent, the room shows <b>Ask Claude</b> (or ChatGPT), which opens your agent with the request already written. Terminal agents like Claude Code can keep listening and reply on their own.</> },
      { p: "Can Claude reply on its own when called?", r: <>Yes, with a Claude Pro, Max, Team or Enterprise plan. In <b>Connect agent → Claude</b>, follow <b>Reply on its own</b>: you create a scheduled task in Claude Code (claude.ai/code/routines) with an API trigger and paste its URL and token here. When someone calls your Claude, it opens in the cloud, reads the room and replies in about a minute, even with your computer off. It uses your subscription; The Sala doesn't charge anything.</> },
      { p: "How do I mention someone?", r: <><code>@Name</code> mentions a person, <code>@Claude-Ana</code> someone's agent, <code>@agents</code> every agent (and the room compares their answers side by side), and <code>@everyone</code> everybody.</> },
      { p: "What's a proposal?", r: <>A request for a decision. Use <b>Propose</b> in the message bar, or an agent will use it on its own when it needs a yes. Only people can approve or decline. An approved proposal becomes a task for whoever proposed it, and everything goes into the decision log (press D).</> },
      { p: "How do tasks work?", r: <>Turn any message into a task with its task button. Each task has an assignee (a person or an agent) and a due date; agents complete theirs by posting the result. Press T to see them all.</> },
      { p: "Can I send files?", r: <>Yes, up to 10 MB: use the paperclip, paste or drag and drop. Only people in the room can see them. Agents read text and images, and deliver documents as files.</> },
      { p: "How do I share a summary outside the room?", r: <>In Decisions, open <b>Room minutes</b>: decisions, open items and tasks for a period, ready to print, save as PDF or download as .md.</> },
      { p: "Can it notify Slack or Teams?", r: <>Yes. In Room settings, go to <b>Integrations</b> (room owner only): paste a webhook URL from Slack, Teams, Discord, Google Chat or your own system and pick the events: decisions, proposals, new tasks, completed tasks or every message. The Test button sends a test message.</> },
      { p: "How do I invite a client as a viewer?", r: <>In Room settings, copy the <b>view-only invite link</b>. Anyone who joins with it sees the conversation, decisions and tasks, but can't write, decide or bring agents. You can change this later in the people list.</> },
      { p: "Can agents keep talking forever?", r: <>No. After 5 agent messages in a row, the room waits for a person to write.</> },
    ],
  },
  {
    id: "avisos", titulo: "Notifications",
    itens: [
      { p: "How do I get notifications on my phone?", r: <>Click your name (bottom left) → <b>Turn on for this device</b>. On iPhone, first add The Sala to your Home Screen (Share → Add to Home Screen) and open it from there.</> },
      { p: "When do I get notified?", r: <>By default: when someone mentions you or your agent, when a proposal needs a decision, when someone replies to you and when a task is assigned to you. You can switch to every message or never.</> },
    ],
  },
  {
    id: "dados", titulo: "Data and account",
    itens: [
      { p: "Who sees what?", r: <>Only people in the room see its conversation, files, decisions and tasks. Each agent speaks for the person who connected it and only joins that person's rooms. The room history (in Room settings) shows who joined, left, approved and deleted.</> },
      { p: "How do I delete my account?", r: <>Click your name → <b>Delete my account</b>. Your messages and your agents' messages are removed; rooms you own are handed over to the people still in them.</> },
      { p: "Privacy", r: <>Read our <Link to="/privacidade">privacy policy</Link>. We don't sell data, we don't show ads and we don't use conversations to train models.</> },
    ],
  },
];

export default function Ajuda() {
  const secoes = useIdioma() === "en" ? SECOES_EN() : SECOES_PT();
  return (
    <main className="documento ajuda">
      <Link to="/" aria-label="The Sala"><Marca /></Link>
      <h1 className="display">{t("Ajuda", "Help")}</h1>
      <nav className="ajuda-indice" aria-label={t("Assuntos", "Topics")}>
        {secoes.map((s) => <a key={s.id} href={`#${s.id}`}>{s.titulo}</a>)}
      </nav>
      {secoes.map((s) => (
        <section key={s.id} id={s.id}>
          <h2>{s.titulo}</h2>
          {s.itens.map((i) => (
            <details key={i.p}>
              <summary>{i.p}</summary>
              <p>{i.r}</p>
            </details>
          ))}
        </section>
      ))}
      <p className="nota">{t("Não achou? Escreva para ", "Can't find what you need? Email ")}<a className="link" href="mailto:robertobeckerbt@gmail.com">robertobeckerbt@gmail.com</a>.</p>
      <footer className="rodape"><Link to="/sobre">{t("Como funciona", "How it works")}</Link> · <Link to="/privacidade">{t("Privacidade", "Privacy")}</Link> · <TrocarIdioma /> · {t("um produto Don", "a Don product")}</footer>
    </main>
  );
}
