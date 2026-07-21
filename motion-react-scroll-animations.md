# Animações de Scroll no React com Motion

> Guia em português baseado na documentação oficial:  
> <https://motion.dev/docs/react-scroll-animations>

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Tipos de animação de scroll](#2-tipos-de-animação-de-scroll)
3. [Desempenho](#3-desempenho)
4. [Animações disparadas pelo scroll](#4-animações-disparadas-pelo-scroll)
5. [Animações vinculadas ao scroll](#5-animações-vinculadas-ao-scroll)
6. [Barra de progresso da página](#6-barra-de-progresso-da-página)
7. [Detectando a direção do scroll](#7-detectando-a-direção-do-scroll)
8. [Suavizando valores com `useSpring`](#8-suavizando-valores-com-usespring)
9. [Transformando o progresso em valores CSS](#9-transformando-o-progresso-em-valores-css)
10. [Acompanhando um elemento específico](#10-acompanhando-um-elemento-específico)
11. [Efeito parallax](#11-efeito-parallax)
12. [Revelação de imagem](#12-revelação-de-imagem)
13. [Seção com scroll horizontal](#13-seção-com-scroll-horizontal)
14. [Texto horizontal controlado pelo scroll](#14-texto-horizontal-controlado-pelo-scroll)
15. [Exemplos adicionais citados](#15-exemplos-adicionais-citados)
16. [Perguntas frequentes](#16-perguntas-frequentes)
17. [Resumo das APIs](#17-resumo-das-apis)
18. [Boas práticas](#18-boas-práticas)

---

## 1. Visão geral

A página apresenta como criar animações baseadas em scroll em aplicações React usando a biblioteca **Motion**, anteriormente muito conhecida pelo nome **Framer Motion**.

Ela cobre efeitos como:

- elementos aparecendo quando entram na tela;
- animações executadas apenas uma vez;
- barras de progresso de leitura;
- detecção da direção do scroll;
- parallax;
- revelação progressiva de imagens;
- seções horizontais controladas pelo scroll vertical;
- textos ou tickers movidos conforme o usuário rola a página.

Os principais recursos utilizados são:

```tsx
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"
```

---

## 2. Tipos de animação de scroll

A documentação separa as animações de scroll em dois tipos fundamentais.

### 2.1 Scroll-triggered

Uma animação **scroll-triggered** é disparada quando determinado evento relacionado ao viewport acontece.

Exemplos:

- o elemento entrou na área visível;
- o elemento saiu da área visível;
- o elemento alcançou determinada região da tela.

É indicada para:

- `fade-in`;
- entrada de cards;
- revelação de seções;
- carregamento sob demanda;
- mudança de estado quando um componente fica visível.

As principais APIs são:

- `whileInView`;
- `viewport`;
- `useInView`.

### 2.2 Scroll-linked

Uma animação **scroll-linked** permanece diretamente ligada à posição do scroll.

Em vez de apenas iniciar uma animação, o scroll fornece continuamente um valor que pode controlar propriedades visuais.

É indicada para:

- barras de progresso;
- parallax;
- movimento horizontal;
- mudança gradual de opacidade;
- escalas e rotações;
- experiências narrativas interativas;
- revelação progressiva de conteúdo.

As principais APIs são:

- `useScroll`;
- `useTransform`;
- `useSpring`;
- `useMotionValueEvent`.

---

## 3. Desempenho

Segundo a documentação, o Motion tenta utilizar recursos nativos do navegador sempre que possível.

Para animações vinculadas ao scroll, ele pode utilizar a API nativa `ScrollTimeline`, permitindo que certas animações sejam processadas de forma mais eficiente e com aceleração por hardware.

Quando isso não é possível, a biblioteca utiliza uma implementação baseada em JavaScript.

Para animações disparadas pela entrada ou saída do viewport, o Motion utiliza um `IntersectionObserver` compartilhado, reduzindo o custo de manter vários observadores independentes.

### O que isso significa na prática

- Evita executar manualmente callbacks pesados a cada evento `scroll`.
- Reduz a necessidade de calcular posições com `getBoundingClientRect()` repetidamente.
- Facilita a criação de efeitos suaves.
- Ainda é necessário evitar animar propriedades muito caras para o navegador.

Propriedades normalmente mais eficientes:

- `transform`;
- `opacity`;
- `scale`;
- `x` e `y`, que o Motion converte em transformações.

Propriedades que podem ser mais custosas:

- `width` e `height`;
- `top` e `left`;
- sombras muito grandes;
- filtros complexos;
- propriedades que forçam recalculação frequente do layout.

---

## 4. Animações disparadas pelo scroll

## 4.1 `whileInView`

A propriedade `whileInView` define o estado visual que o elemento deve assumir enquanto estiver visível no viewport.

```tsx
import { motion } from "motion/react"

export function FadeInSection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
    >
      Conteúdo da seção
    </motion.div>
  )
}
```

### Funcionamento

1. O elemento começa com `opacity: 0`.
2. Quando entra na região visível, passa para `opacity: 1`.
3. Por padrão, ao sair e entrar novamente, a animação pode ser executada novamente.

Também é possível combinar propriedades:

```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Conteúdo animado
</motion.div>
```

Nesse caso, o elemento aparece e, ao mesmo tempo, sobe até sua posição final.

---

## 4.2 Executando a animação somente uma vez

Por padrão, uma animação com `whileInView` pode reagir sempre que o elemento entra ou sai da tela.

Para executá-la somente na primeira entrada, utilize:

```tsx
viewport={{ once: true }}
```

Exemplo:

```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={{
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  }}
>
  Esta entrada acontece apenas uma vez.
</motion.div>
```

Isso é útil para:

- landing pages;
- listas de benefícios;
- cards de portfólio;
- seções institucionais;
- conteúdos que não precisam desaparecer novamente.

---

## 4.3 Alterando o contêiner de scroll

Por padrão, o Motion considera o viewport da janela do navegador.

Entretanto, a animação pode estar dentro de um elemento com scroll próprio, como:

- modal;
- sidebar;
- carrossel;
- painel;
- área com `overflow: auto` ou `overflow: scroll`.

Nesse caso, deve-se criar uma referência para o contêiner e informá-la em `viewport.root`.

```tsx
import { useRef } from "react"
import { motion } from "motion/react"

export function ScrollContainer() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      style={{
        height: 300,
        overflowY: "auto",
      }}
    >
      <div style={{ height: 500 }} />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ root: scrollRef }}
      >
        Aparece com base no contêiner, não na janela.
      </motion.div>
    </div>
  )
}
```

Sem o `root`, a biblioteca observaria o elemento em relação ao viewport global.

---

## 4.4 Atualizando estado com `useInView`

O hook `useInView` permite saber se um elemento está visível sem exigir que ele seja um componente `motion`.

```tsx
import { useRef } from "react"
import { useInView } from "motion/react"

export function VisibilityMessage() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref)

  return (
    <div ref={ref}>
      {isInView ? "O elemento está visível" : "O elemento não está visível"}
    </div>
  )
}
```

Esse valor booleano pode controlar:

- textos;
- classes CSS;
- chamadas de analytics;
- carregamento de dados;
- início e pausa de vídeos;
- ativação de componentes;
- atualização de menus de navegação.

### Diferença entre `whileInView` e `useInView`

| Recurso | Uso principal |
|---|---|
| `whileInView` | Animar diretamente um componente `motion` |
| `useInView` | Obter um booleano e controlar qualquer lógica React |

---

## 5. Animações vinculadas ao scroll

O hook central desse tipo de animação é o `useScroll`.

```tsx
import { useScroll } from "motion/react"

const {
  scrollX,
  scrollY,
  scrollXProgress,
  scrollYProgress,
} = useScroll()
```

Ele retorna quatro `MotionValue`s.

### `scrollX`

Posição horizontal atual do scroll, normalmente medida em pixels.

### `scrollY`

Posição vertical atual do scroll, normalmente medida em pixels.

### `scrollXProgress`

Progresso horizontal normalizado entre `0` e `1`.

- `0`: início do percurso;
- `0.5`: aproximadamente metade;
- `1`: final do percurso.

### `scrollYProgress`

Progresso vertical normalizado entre `0` e `1`.

É o valor mais utilizado para barras de leitura e efeitos que acompanham toda a página.

### O que é um `MotionValue`

Um `MotionValue` é um valor reativo gerenciado pelo Motion.

Ele pode atualizar estilos animados sem necessariamente provocar uma nova renderização completa do componente React a cada mudança de frame.

Por isso, normalmente ele é passado diretamente para o `style` de um componente `motion`:

```tsx
<motion.div style={{ scaleX: scrollYProgress }} />
```

---

## 6. Barra de progresso da página

Uma das utilizações mais simples de `scrollYProgress` é uma barra que mostra quanto da página já foi percorrido.

```tsx
import { motion, useScroll } from "motion/react"

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      style={{
        scaleX: scrollYProgress,
        transformOrigin: "0% 50%",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: "currentColor",
      }}
    />
  )
}
```

### Como funciona

- `scaleX: 0`: a barra está sem largura visual.
- `scaleX: 0.5`: a barra ocupa visualmente metade do espaço.
- `scaleX: 1`: a barra chega ao tamanho completo.
- `transformOrigin` ou `originX: 0` garante que ela cresça da esquerda para a direita.

Uma alternativa específica do Motion é:

```tsx
style={{ scaleX: scrollYProgress, originX: 0 }}
```

---

## 7. Detectando a direção do scroll

O `useScroll` fornece a posição atual, mas também é possível compará-la com a posição anterior.

Para acompanhar mudanças de um `MotionValue`, utiliza-se `useMotionValueEvent`.

```tsx
import { useState } from "react"
import { useMotionValueEvent, useScroll } from "motion/react"

export function ScrollDirection() {
  const { scrollY } = useScroll()
  const [direction, setDirection] = useState<"up" | "down">("down")

  useMotionValueEvent(scrollY, "change", current => {
    const previous = scrollY.getPrevious() ?? 0
    const difference = current - previous

    setDirection(difference > 0 ? "down" : "up")
  })

  return <div>Direção: {direction}</div>
}
```

### Lógica

```text
valor atual - valor anterior
```

- resultado positivo: o usuário está descendo;
- resultado negativo: o usuário está subindo.

### Possíveis aplicações

- esconder o cabeçalho ao descer;
- mostrar o cabeçalho ao subir;
- alterar a navegação;
- mudar a direção de uma animação;
- ativar indicadores visuais.

### Observação

É recomendável ignorar diferenças muito pequenas para evitar oscilações causadas por movimentos mínimos.

```tsx
if (Math.abs(difference) < 2) return
```

---

## 8. Suavizando valores com `useSpring`

Uma animação diretamente ligada ao scroll acompanha cada pequena alteração imediatamente.

Isso pode deixar uma barra ou elemento visual com movimento muito rígido.

O hook `useSpring` recebe um `MotionValue` e cria uma versão suavizada por uma simulação de mola.

```tsx
import { motion, useScroll, useSpring } from "motion/react"

export function SmoothProgress() {
  const { scrollYProgress } = useScroll()

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      style={{
        scaleX: smoothProgress,
        originX: 0,
      }}
    />
  )
}
```

### Parâmetros

#### `stiffness`

Controla a rigidez da mola.

- valor maior: resposta mais rápida e firme;
- valor menor: resposta mais lenta e solta.

#### `damping`

Controla o amortecimento.

- valor maior: menos oscilação;
- valor menor: mais efeito elástico.

#### `restDelta`

Define quão próxima do destino a mola precisa estar para ser considerada parada.

---

## 9. Transformando o progresso em valores CSS

O `useTransform` converte um intervalo de entrada em outro intervalo de saída.

Exemplo conceitual:

```text
progresso de 0 até 1
       ↓
blur de 0px até 10px
```

```tsx
import { motion, useScroll, useTransform } from "motion/react"

export function ScrollBlur() {
  const { scrollYProgress } = useScroll()

  const filter = useTransform(
    scrollYProgress,
    [0, 1],
    ["blur(0px)", "blur(10px)"]
  )

  return <motion.div style={{ filter }}>Conteúdo</motion.div>
}
```

### Estrutura

```tsx
useTransform(valorDeEntrada, intervaloDeEntrada, intervaloDeSaida)
```

### Outros exemplos

#### Opacidade

```tsx
const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1])
```

#### Movimento vertical

```tsx
const y = useTransform(scrollYProgress, [0, 1], [0, -200])
```

#### Rotação

```tsx
const rotate = useTransform(scrollYProgress, [0, 1], [0, 360])
```

#### Cor

```tsx
const backgroundColor = useTransform(
  scrollYProgress,
  [0, 1],
  ["#ffffff", "#000000"]
)
```

#### Escala com vários pontos

```tsx
const scale = useTransform(
  scrollYProgress,
  [0, 0.5, 1],
  [0.8, 1.2, 1]
)
```

---

## 10. Acompanhando um elemento específico

Por padrão, `useScroll()` acompanha o scroll geral da página ou de um contêiner.

Com a opção `target`, é possível acompanhar o percurso de um elemento específico através da área visível.

```tsx
import { useRef } from "react"
import { motion, useScroll } from "motion/react"

export function TrackedSection() {
  const ref = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  return (
    <section ref={ref}>
      <motion.div style={{ scaleX: scrollYProgress }} />
    </section>
  )
}
```

### Entendendo `target`

```tsx
target: ref
```

Indica qual elemento será acompanhado.

### Entendendo `offset`

```tsx
offset: ["start end", "end start"]
```

O `offset` define o início e o fim do intervalo medido.

Cada string descreve uma interseção entre:

1. um ponto do elemento alvo;
2. um ponto do contêiner ou viewport.

No exemplo:

```text
"start end"
```

O progresso começa quando o início do alvo encontra o final do viewport.

```text
"end start"
```

O progresso termina quando o final do alvo encontra o início do viewport.

Em uma página vertical, isso equivale aproximadamente a:

1. o elemento começa a entrar pela parte inferior;
2. atravessa a tela;
3. termina de sair pela parte superior.

### Palavras utilizadas nos offsets

- `start`;
- `center`;
- `end`.

Também é possível trabalhar com outros formatos documentados pela API, mas a página utiliza principalmente combinações semânticas como as anteriores.

---

## 11. Efeito parallax

Parallax cria uma sensação de profundidade movendo camadas em velocidades diferentes.

Regra visual comum:

- plano de fundo: movimento mais lento;
- plano intermediário: velocidade média;
- primeiro plano: movimento mais rápido.

Uma implementação prática pode usar dois `useTransform` separados:

```tsx
import { motion, useScroll, useTransform } from "motion/react"

export function ParallaxScene() {
  const { scrollY } = useScroll()

  const foregroundY = useTransform(
    scrollY,
    value => value * 2
  )

  const backgroundY = useTransform(
    scrollY,
    value => value * 0.5
  )

  return (
    <div className="scene">
      <motion.div style={{ y: backgroundY }} className="background" />
      <motion.div style={{ y: foregroundY }} className="foreground" />
    </div>
  )
}
```

Outra forma é mapear intervalos:

```tsx
const backgroundY = useTransform(scrollY, [0, 1000], [0, 500], {
  clamp: false,
})

const foregroundY = useTransform(scrollY, [0, 1000], [0, 2000], {
  clamp: false,
})
```

### `clamp: false`

Por padrão, um valor transformado costuma ser limitado ao intervalo de saída.

Com `clamp: false`, a proporção continua sendo calculada mesmo depois que a entrada ultrapassa os limites informados.

Isso é útil em efeitos contínuos relacionados ao scroll.

### Cuidados com parallax

- Evite movimentos excessivos.
- Teste em telas pequenas.
- Considere usuários com preferência por movimento reduzido.
- Não comprometa a legibilidade do texto.
- Use imagens maiores que a área visível para não revelar espaços vazios.

---

## 12. Revelação de imagem

A página mostra um efeito em que uma imagem é revelada gradualmente conforme entra na tela.

O efeito utiliza:

- `useScroll` para medir o progresso do elemento;
- `useTransform` para converter o progresso em `clip-path`;
- `motion.div` para aplicar o estilo animado.

```tsx
import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"

export function ImageReveal() {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  })

  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    [
      "inset(0% 50% 0% 50%)",
      "inset(0% 0% 0% 0%)",
    ]
  )

  return (
    <motion.div ref={ref} style={{ clipPath }}>
      <img src="/photo.jpg" alt="Descrição da imagem" />
    </motion.div>
  )
}
```

### Entendendo o `clip-path`

Estado inicial:

```css
clip-path: inset(0% 50% 0% 50%);
```

- corta 50% do lado direito;
- corta 50% do lado esquerdo;
- a imagem fica visualmente fechada no centro.

Estado final:

```css
clip-path: inset(0% 0% 0% 0%);
```

- nenhum lado é cortado;
- a imagem fica totalmente visível.

### Intervalo usado

```tsx
offset: ["start end", "center center"]
```

A animação começa quando o topo do elemento encontra a parte inferior do viewport e termina quando o centro do elemento encontra o centro da tela.

---

## 13. Seção com scroll horizontal

A documentação mostra como transformar o scroll vertical em deslocamento horizontal.

A estrutura exige três camadas principais:

1. um contêiner externo alto;
2. um contêiner interno com `position: sticky`;
3. uma faixa horizontal larga que será movida.

```tsx
import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"

interface Item {
  id: string
  content: React.ReactNode
}

export function HorizontalSection({ items }: { items: Item[] }) {
  const containerRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "-75%"]
  )

  return (
    <section
      ref={containerRef}
      style={{ height: "300vh" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            x,
            display: "flex",
            gap: 20,
          }}
        >
          {items.map(item => (
            <article
              key={item.id}
              style={{
                width: 400,
                flexShrink: 0,
              }}
            >
              {item.content}
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

### Papel do contêiner externo

```css
height: 300vh;
```

Ele cria o espaço de scroll vertical necessário para controlar o deslocamento horizontal.

Quanto maior a altura:

- maior será a distância vertical percorrida;
- mais lentamente a faixa horizontal parecerá se mover.

### Papel do contêiner sticky

```css
position: sticky;
top: 0;
height: 100vh;
overflow: hidden;
```

Ele permanece preso à tela durante o percurso do contêiner externo.

### Papel da faixa horizontal

```tsx
const x = useTransform(
  scrollYProgress,
  [0, 1],
  ["0%", "-75%"]
)
```

Conforme o progresso vai de `0` a `1`, a faixa se move de `0%` para `-75%` no eixo X.

### `flexShrink: 0`

Impede que os cards sejam comprimidos para caber na largura disponível.

### Observação importante

O valor `-75%` depende do tamanho real do conteúdo.

Em uma implementação dinâmica, pode ser necessário medir:

```text
largura total do conteúdo - largura do viewport
```

para calcular exatamente quanto a faixa deve se deslocar.

---

## 14. Texto horizontal controlado pelo scroll

A página também demonstra um efeito em que linhas de texto se movem horizontalmente enquanto o usuário rola verticalmente.

Esse exemplo combina:

- `useScroll`;
- `useTransform`;
- o componente `Ticker` do Motion+.

```tsx
import { useScroll, useTransform } from "motion/react"

export function ScrollText() {
  const { scrollY } = useScroll()

  const invertedScroll = useTransform(
    () => scrollY.get() * -1
  )

  const lines = [
    { text: "Creative", reverse: false },
    { text: "Design", reverse: true },
    { text: "Motion", reverse: false },
    { text: "Studio", reverse: true },
  ]

  return (
    <>
      {lines.map(line => (
        <Ticker
          key={line.text}
          items={[
            <span className="text-solid" key="solid">
              {line.text}
            </span>,
            <span className="text-outline" key="outline">
              {line.text}
            </span>,
          ]}
          offset={line.reverse ? invertedScroll : scrollY}
        />
      ))}
    </>
  )
}
```

> `Ticker` pertence ao Motion+, o conjunto premium de componentes e exemplos da plataforma. Ele não é apresentado como parte do núcleo gratuito utilizado nos demais exemplos da página.

### Invertendo a direção

```tsx
const invertedScroll = useTransform(
  () => scrollY.get() * -1
)
```

Ao multiplicar a posição do scroll por `-1`, o valor resultante se move na direção oposta.

Dessa forma:

- uma linha pode acompanhar o sentido normal;
- a linha seguinte pode andar no sentido contrário;
- o layout ganha movimento alternado.

---

## 15. Exemplos adicionais citados

A página aponta outros exemplos relacionados, sem detalhar integralmente sua implementação no texto principal.

### Track element scroll offset

Acompanha o deslocamento de um elemento e transforma sua posição em valores animados.

### Track element within viewport

Mede o progresso de um elemento específico enquanto ele atravessa o viewport.

### 3D

Utiliza o progresso do scroll para controlar transformações tridimensionais, como:

- `rotateX`;
- `rotateY`;
- `translateZ`;
- perspectiva.

### Scroll velocity and direction

Além da posição, é possível utilizar a velocidade e a direção do scroll para produzir animações mais responsivas.

A página recomenda consultar a documentação completa do `useScroll` para explorar esses casos.

---

## 16. Perguntas frequentes

## 16.1 As animações de scroll do Motion são aceleradas por hardware?

Quando possível, sim.

O Motion tenta usar APIs nativas como `ScrollTimeline` para animações vinculadas ao scroll. Quando necessário, utiliza JavaScript como fallback.

Para animações disparadas pela visibilidade, utiliza um `IntersectionObserver` compartilhado.

A aceleração real também depende das propriedades CSS animadas. Transformações e opacidade normalmente oferecem resultados melhores do que propriedades que alteram layout.

---

## 16.2 Qual é a diferença entre scroll-triggered e scroll-linked?

### Scroll-triggered

A animação é ativada por um evento de visibilidade.

```text
O elemento entrou na tela → executar animação
```

Use principalmente:

- `whileInView`;
- `useInView`.

### Scroll-linked

O valor animado acompanha continuamente o scroll.

```text
Scroll em 30% → animação em 30%
```

Use principalmente:

- `useScroll`;
- `useTransform`;
- `useSpring`.

---

## 16.3 Como criar parallax no React?

A ideia principal é:

1. obter a posição ou o progresso com `useScroll`;
2. transformar esse valor com `useTransform`;
3. definir intervalos menores para o fundo;
4. definir intervalos maiores para o primeiro plano.

Exemplo:

```tsx
const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 100])
const foregroundY = useTransform(scrollYProgress, [0, 1], [0, 300])
```

---

## 16.4 Como criar uma seção horizontal?

A solução apresentada combina:

1. um contêiner alto, como `300vh`;
2. uma região de `100vh` com `position: sticky`;
3. uma faixa interna com `display: flex`;
4. `useScroll` para medir o progresso;
5. `useTransform` para converter o progresso vertical em deslocamento no eixo X.

Quanto maior o contêiner externo, mais lento será o deslocamento horizontal aparente.

---

## 17. Resumo das APIs

| API | Responsabilidade |
|---|---|
| `motion` | Cria elementos capazes de receber propriedades e estilos animados |
| `whileInView` | Define o estado de animação enquanto o elemento está visível |
| `viewport` | Configura como a visibilidade deve ser observada |
| `viewport.once` | Faz a animação de entrada ocorrer somente uma vez |
| `viewport.root` | Define um contêiner de scroll personalizado |
| `useInView` | Retorna se um elemento está ou não visível |
| `useScroll` | Fornece posição e progresso do scroll |
| `scrollX` | Posição horizontal em pixels |
| `scrollY` | Posição vertical em pixels |
| `scrollXProgress` | Progresso horizontal normalizado de `0` a `1` |
| `scrollYProgress` | Progresso vertical normalizado de `0` a `1` |
| `target` | Define o elemento cujo percurso será acompanhado |
| `offset` | Define as interseções que representam o início e o fim do progresso |
| `useMotionValueEvent` | Escuta mudanças de um `MotionValue` |
| `getPrevious()` | Obtém o valor anterior de um `MotionValue` |
| `useSpring` | Suaviza um valor por meio de uma animação de mola |
| `useTransform` | Converte um intervalo ou função de entrada em outro valor |
| `clamp: false` | Permite que a transformação continue além do intervalo configurado |
| `Ticker` | Componente premium do Motion+ para conteúdo contínuo ou marquee |

---

## 18. Boas práticas

### 18.1 Prefira `MotionValue` para estilos animados

Passe valores do Motion diretamente para componentes `motion` quando possível.

```tsx
<motion.div style={{ y, opacity }} />
```

Evite transformar cada atualização de scroll em estado React sem necessidade, pois isso pode provocar renderizações frequentes.

---

### 18.2 Use `useMotionValueEvent` quando precisar executar lógica

Utilize estado React somente quando a mudança realmente precisar alterar a árvore de componentes ou alguma lógica da interface.

```tsx
useMotionValueEvent(scrollY, "change", current => {
  // lógica necessária
})
```

---

### 18.3 Respeite movimento reduzido

Alguns usuários configuram o sistema para reduzir animações.

O Motion possui o hook `useReducedMotion`, que pode ser usado para desativar ou simplificar efeitos intensos.

```tsx
import { useReducedMotion } from "motion/react"

const shouldReduceMotion = useReducedMotion()

const y = shouldReduceMotion ? 0 : animatedY
```

---

### 18.4 Evite animações excessivas

Scroll animations devem ajudar a comunicar hierarquia, profundidade ou progresso.

Elas não devem:

- prejudicar a leitura;
- atrasar o acesso ao conteúdo;
- causar enjoo;
- esconder informações importantes;
- competir com todas as outras partes da interface.

---

### 18.5 Teste diferentes dispositivos

Verifique:

- desktop;
- notebook com trackpad;
- celular;
- tablet;
- dispositivos com desempenho mais baixo;
- diferentes tamanhos de viewport.

Uma seção horizontal ou parallax que funciona no desktop pode precisar ser simplificada no celular.

---

### 18.6 Cuidado com `position: sticky`

O comportamento de `sticky` pode falhar ou mudar quando algum ancestral possui propriedades como:

```css
overflow: hidden;
overflow: auto;
transform: translateZ(0);
```

Ao criar a seção horizontal, verifique toda a hierarquia dos contêineres.

---

## Conclusão

A página apresenta duas estratégias complementares para animações de scroll no React:

- **scroll-triggered**, para executar ações quando elementos entram ou saem da tela;
- **scroll-linked**, para vincular propriedades visuais diretamente ao progresso do scroll.

Para entradas simples, `whileInView` costuma ser suficiente. Quando é necessário controlar lógica React, `useInView` é mais apropriado.

Para efeitos contínuos, `useScroll` fornece os valores fundamentais. Esses valores podem ser:

- suavizados com `useSpring`;
- convertidos com `useTransform`;
- observados com `useMotionValueEvent`;
- vinculados diretamente aos estilos de componentes `motion`.

Com essas APIs, é possível construir desde uma barra de progresso básica até experiências com parallax, revelação de imagens, movimentos alternados e seções horizontais controladas pelo scroll vertical.
