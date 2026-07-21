import { ProjectScrollMedia } from "../ProjectScrollMedia";
import type { PublishedProjectPageData } from "./ProjectPage";

type ProjectHeroProps = {
  data: PublishedProjectPageData;
  sectionCount: number;
};

export function ProjectHero({ data, sectionCount }: ProjectHeroProps) {
  const { project, heroVideoAsset, fallbackImageAsset } = data;
  const mediaAlt =
    fallbackImageAsset?.altText ?? heroVideoAsset?.altText ?? `Imagem do projeto ${project.title}.`;

  return (
    <section
      aria-labelledby="project-title"
      className="hero-scroll-range project-scrub-flow relative bg-[var(--black)] text-white"
      data-header-theme="light"
    >
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 px-5 py-5 text-white sm:px-8 lg:px-16">
        <div className="pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between gap-6 text-[var(--text-label)] font-medium uppercase tracking-[0.18em]">
          <a className="outline-offset-4 transition-opacity hover:opacity-65" href="#project-title">
            Yann
          </a>
          <span className="text-white/50">Projeto</span>
        </div>
      </header>

      <div className="hero-scroll-stage sticky top-0 min-h-svh overflow-hidden">
        <ProjectScrollMedia
          alt={mediaAlt}
          posterSrc={fallbackImageAsset?.url ?? null}
          title={project.title}
          videoMimeType={heroVideoAsset?.mimeType ?? null}
          videoSrc={heroVideoAsset?.url ?? null}
        />

        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgb(0_0_0/0.66)_0%,rgb(0_0_0/0.28)_42%,transparent_74%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[linear-gradient(0deg,rgb(0_0_0/0.64)_0%,transparent_70%)]" />

        <div className="relative z-30 mx-auto grid min-h-svh max-w-[1440px] grid-cols-4 content-end gap-4 px-5 pb-10 pt-28 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-16 lg:pb-16">
          <div className="col-span-4 sm:col-span-5 lg:col-span-7">
            <p className="text-[var(--text-label)] font-medium uppercase tracking-[0.16em] text-white/68">
              {project.category} / {project.location} / {project.year}
            </p>
            <h1
              className="mt-5 font-[var(--font-display)] text-[var(--text-hero-title)] font-normal leading-[0.88] tracking-[-0.045em]"
              id="project-title"
            >
              {project.title}
            </h1>
            {project.subtitle ? (
              <p className="mt-6 max-w-2xl text-[var(--text-body-large)] leading-[1.55] text-white/78">
                {project.subtitle}
              </p>
            ) : null}
          </div>

          <dl className="col-span-4 mt-12 grid content-end gap-4 border-t border-white/24 pt-5 text-[var(--text-caption)] leading-6 text-white/72 sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0">
            <HeroFact label="Cliente / arquiteto" value={project.clientArchitectName} />
            <HeroFact label="Local" value={project.location} />
            <HeroFact label="Ano" value={String(project.year)} />
            <HeroFact label="Categoria" value={project.category} />
          </dl>

          <div className="col-span-4 mt-12 flex items-end justify-between text-[var(--text-label)] uppercase tracking-[0.16em] text-white/58 sm:col-span-6 lg:col-span-12">
            <span>Scroll para explorar</span>
            <span aria-hidden="true">00 / {String(sectionCount + 1).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroFact({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-white/12 pb-3 last:border-b-0">
      <dt className="text-[var(--text-label)] font-medium uppercase tracking-[0.16em] text-white/45">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
