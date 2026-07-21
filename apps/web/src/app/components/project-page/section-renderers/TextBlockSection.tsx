import type { PublishedProjectPageData } from "../ProjectPage";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type TextBlockSectionProps = {
  sectionRow: ProjectSectionRow;
};

export function TextBlockSection({ sectionRow }: TextBlockSectionProps) {
  const { section } = sectionRow;

  return (
    <section
      aria-labelledby={section.title ? `${section.id}-title` : undefined}
      className="bg-[var(--paper)] px-5 py-20 text-[var(--ink)] sm:px-8 sm:py-28 lg:px-16"
      data-header-theme="dark"
    >
      <div className="mx-auto grid max-w-[1440px] gap-10 border-t border-[var(--line)] pt-8 lg:grid-cols-12">
        <p className="text-[var(--text-label)] font-medium uppercase tracking-[0.16em] text-[var(--mid-gray)] lg:col-span-2">
          Editorial
        </p>
        {section.title ? (
          <h2
            className="font-[var(--font-display)] text-[var(--text-section-title)] font-normal leading-[1] tracking-[-0.045em] lg:col-span-4"
            id={`${section.id}-title`}
          >
            {section.title}
          </h2>
        ) : null}
        {section.body ? (
          <p className="max-w-3xl whitespace-pre-line text-[var(--text-body-large)] leading-[1.65] text-[var(--graphite)] lg:col-span-5 lg:col-start-8">
            {section.body}
          </p>
        ) : null}
      </div>
    </section>
  );
}
