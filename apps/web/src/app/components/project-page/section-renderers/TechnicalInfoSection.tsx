import type { PublishedProjectPageData } from "../ProjectPage";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];
type Project = PublishedProjectPageData["project"];

type TechnicalInfoSectionProps = {
  project: Project;
  sectionRow: ProjectSectionRow;
};

export function TechnicalInfoSection({ project, sectionRow }: TechnicalInfoSectionProps) {
  const { section } = sectionRow;
  const metadataEntries = Object.entries(section.metadata ?? {}).filter(([, value]) => {
    return value !== null && value !== undefined && value !== "";
  });
  const facts =
    metadataEntries.length > 0
      ? metadataEntries.map(([label, value]) => [formatLabel(label), formatValue(value)] as const)
      : [
          ["Projeto", project.title],
          ["Categoria", project.category],
          ["Local", project.location],
          ["Ano", String(project.year)],
          ["Cliente / arquiteto", project.clientArchitectName ?? ""],
        ].filter(([, value]) => value);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className="bg-white px-5 py-20 text-[var(--ink)] sm:px-8 sm:py-28 lg:px-16"
      data-header-theme="dark"
    >
      <div className="mx-auto grid max-w-[1440px] gap-10 border-t border-[var(--line)] pt-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-[var(--text-label)] font-medium uppercase tracking-[0.16em] text-[var(--mid-gray)]">
            Dados tecnicos
          </p>
          <h2
            className="mt-5 font-[var(--font-display)] text-[var(--text-section-title)] font-normal leading-[1] tracking-[-0.045em]"
            id={`${section.id}-title`}
          >
            {section.title ?? "Informacoes do projeto"}
          </h2>
          {section.body ? (
            <p className="mt-6 whitespace-pre-line text-[var(--text-caption)] leading-6 text-[var(--graphite)]">
              {section.body}
            </p>
          ) : null}
        </div>

        <dl className="grid gap-0 lg:col-span-6 lg:col-start-7">
          {facts.map(([label, value]) => (
            <div
              className="grid gap-2 border-b border-[var(--line)] py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"
              key={label}
            >
              <dt className="text-[var(--text-label)] font-medium uppercase tracking-[0.16em] text-[var(--mid-gray)]">
                {label}
              </dt>
              <dd className="text-[var(--text-caption)] leading-6 text-[var(--graphite)]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
}
