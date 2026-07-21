export default function ProjectNotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-paper px-5 text-ink">
      <section className="w-full max-w-3xl border-t border-line pt-8">
        <p className="text-label font-medium uppercase tracking-[0.18em] text-mid-gray">
          Yann / Projeto
        </p>
        <h1 className="mt-8 font-display text-project-title font-normal leading-[0.95] tracking-[-0.045em]">
          Projeto nao encontrado.
        </h1>
        <p className="mt-6 max-w-xl text-body leading-7 text-graphite">
          O endereco solicitado nao corresponde a um projeto publicado.
        </p>
      </section>
    </main>
  );
}
