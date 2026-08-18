"use client";

export type ContactCreditProject = {
  clientArchitectEmail: string | null;
  clientArchitectInstagram: string | null;
  clientArchitectName: string | null;
  clientArchitectPhone: string | null;
  clientArchitectWebsite: string | null;
  title: string;
};

export type ContactCreditMediaAsset = {
  altText: string | null;
  height: number | null;
  url: string;
  width: number | null;
} | null;

type ProjectContactCreditFooterProps = {
  body?: string | null;
  mediaAsset?: ContactCreditMediaAsset;
  project: ContactCreditProject;
  title?: string | null;
  titleId: string;
};

export function ProjectContactCreditFooter({
  body,
  project,
  title,
  titleId,
}: ProjectContactCreditFooterProps) {
  const productionCreditHref = "https://www.instagram.com/yann_archviz/";
  const contacts = [
    { href: emailHref(project.clientArchitectEmail), label: "Email", value: project.clientArchitectEmail },
    { href: phoneHref(project.clientArchitectPhone), label: "Telefone", value: project.clientArchitectPhone },
    { href: project.clientArchitectWebsite, label: "Website", value: project.clientArchitectWebsite },
    { href: instagramHref(project.clientArchitectInstagram), label: "Instagram", value: project.clientArchitectInstagram },
  ].filter((contact) => contact.value);

  return (
    <footer
      aria-labelledby={titleId}
      className="bg-ink px-5 py-16 text-white sm:px-8 sm:py-28 lg:px-16"
      data-header-theme="light"
    >
      <div className="mx-auto grid max-w-[1440px] gap-12 border-t border-white/18 pt-8 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-5 lg:flex lg:flex-col">
          <h2
            className="mt-5 font-display text-section-title font-normal leading-[1] tracking-[-0.045em]"
            id={titleId}
          >
            {title ?? project.clientArchitectName ?? project.title}
          </h2>
          {body ? (
            <p className="mt-6 max-w-xl whitespace-pre-line text-body leading-7 text-white/68">
              {body}
            </p>
          ) : null}
          <p className="mt-10 text-label uppercase tracking-[0.18em] text-white/40 lg:mt-auto">
            <span className="text-white/38">Produzido por </span>
            <a
              className="text-white transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:underline"
              href={productionCreditHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              Yann | Archviz Studio
            </a>
          </p>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <dl className="grid gap-0">
            {contacts.map((contact) => (
              <ContactRow
                href={contact.href ?? undefined}
                key={contact.label}
                label={contact.label}
                value={formatContactValue(contact.value ?? "")}
              />
            ))}
          </dl>
        </div>
      </div>
    </footer>
  );
}

function ContactRow({ href, label, value }: { href?: string; label: string; value: string }) {
  return (
    <div className="grid gap-2 border-b border-white/14 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
      <dt className="text-label font-medium uppercase tracking-[0.16em] text-white/62">
        {label}
      </dt>
      <dd className="break-words text-meta leading-6 text-white/72">
        {href ? (
          <a className="underline decoration-white/28 underline-offset-4 hover:decoration-white" href={href}>
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function emailHref(value: string | null) {
  return value ? `mailto:${value}` : null;
}

function phoneHref(value: string | null) {
  return value ? `tel:${value.replace(/[^+\d]/g, "")}` : null;
}

function instagramHref(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.includes("://")) {
    return value;
  }

  const handle = value.replace(/^@/, "").replace(/\/+$/, "");
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

function formatContactValue(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
