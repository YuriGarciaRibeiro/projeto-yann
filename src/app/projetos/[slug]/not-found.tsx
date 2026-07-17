export default function ProjectNotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-[var(--paper)] px-5 text-[var(--ink)]">
      <section className="w-full max-w-3xl border-t border-[var(--line)] pt-8">
        <p className="text-[var(--text-label)] font-medium uppercase tracking-[0.18em] text-[var(--mid-gray)]">
          Yann / Projeto
        </p>
        <h1 className="mt-8 font-[var(--font-display)] text-[var(--text-h1)] font-normal leading-[0.95] tracking-[-0.045em]">
          Projeto nao encontrado.
        </h1>
        <p className="mt-6 max-w-xl text-[var(--text-body)] leading-7 text-[var(--graphite)]">
          O endereco solicitado nao corresponde a um projeto publicado.
        </p>
      </section>
    </main>
  );
}
